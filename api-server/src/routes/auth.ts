import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db/schema";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// ─── Safe user columns (never expose password_hash, google_id, etc.) ──────────
const safeUserCols = {
  id:        usersTable.id,
  name:      usersTable.name,
  email:     usersTable.email,
  role:      usersTable.role,
  phone:     usersTable.phone,
  avatarUrl: usersTable.avatarUrl,
  createdAt: usersTable.createdAt,
};

// ─── Schemas ──────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().min(2).max(60),
  email:    z.string().email(),
  password: z.string().min(6).max(72),
  phone:    z.string().optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1).max(72),
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Validation error" });
    return;
  }
  const { name, email, password, phone } = parsed.data;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const ADMIN_EMAILS = (process.env["ADMIN_EMAILS"] ?? "seifabdelrahman858@gmail.com")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    name,
    email:        email.toLowerCase(),
    passwordHash,
    phone:        phone ?? null,
    role:         isAdmin ? "admin" : "user",
  }).returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role });

  const accessToken  = signAccessToken({ sub: user!.id, email: user!.email, role: user!.role });
  const { token: refreshToken, hash, expiresAt } = signRefreshToken(user!.id);
  await db.insert(refreshTokensTable).values({ userId: user!.id, tokenHash: hash, expiresAt });

  res.status(201).json({
    user:  { id: user!.id, name: user!.name, email: user!.email, role: user!.role },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    // Uniform error — never reveal whether it's email or password format
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select({
      id:           usersTable.id,
      name:         usersTable.name,
      email:        usersTable.email,
      role:         usersTable.role,
      passwordHash: usersTable.passwordHash,
      avatarUrl:    usersTable.avatarUrl,
      phone:        usersTable.phone,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  // ── Timing-safe: always run bcrypt even if user not found ─────────────────
  if (!user) {
    await bcrypt.hash(password, 12); // dummy work to prevent timing attacks
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // ── Prevent Google-only accounts from logging in with password ────────────
  if (!user.passwordHash) {
    res.status(401).json({ error: "This account was created with Google. Please sign in with Google." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const accessToken  = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken, hash, expiresAt } = signRefreshToken(user.id);
  await db.insert(refreshTokensTable).values({ userId: user.id, tokenHash: hash, expiresAt });

  res.json({
    user:  { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    accessToken,
    refreshToken,
  });
});

// POST /api/auth/refresh
router.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token required" });
    return;
  }

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const tokenHash = hashToken(refreshToken);
  const [storedToken] = await db
    .select({ id: refreshTokensTable.id, expiresAt: refreshTokensTable.expiresAt })
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash))
    .limit(1);

  if (!storedToken || storedToken.expiresAt < new Date()) {
    res.status(401).json({ error: "Refresh token revoked or expired" });
    return;
  }

  const [user] = await db
    .select(safeUserCols)
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Rotate refresh token (delete old, issue new)
  await db.delete(refreshTokensTable).where(eq(refreshTokensTable.id, storedToken.id));
  const newAccessToken  = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: newRefreshToken, hash, expiresAt } = signRefreshToken(user.id);
  await db.insert(refreshTokensTable).values({ userId: user.id, tokenHash: hash, expiresAt });

  res.json({
    user:         { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    accessToken:  newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// POST /api/auth/logout
router.post("/auth/logout", requireAuth, async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.tokenHash, hash));
  }
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select(safeUserCols)
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.sub))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
