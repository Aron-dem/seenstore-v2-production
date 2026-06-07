import { Router, type IRouter } from "express";
import crypto from "crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable, oauthStatesTable, oauthCodesTable } from "@workspace/db/schema";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";

const router: IRouter = Router();

// ─── Config ───────────────────────────────────────────────────────────────────
const CLIENT_ID     = process.env["GOOGLE_CLIENT_ID"]     ?? "";
const CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"] ?? "";
const REDIRECT_URI  = process.env["GOOGLE_REDIRECT_URI"]  ?? "";

const ADMIN_EMAILS = (process.env["ADMIN_EMAILS"] ?? "seifabdelrahman858@gmail.com")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

const CODE_TTL_MS  = 5 * 60 * 1000; // 5 minutes
const STATE_TTL_MS  = 10 * 60 * 1000; // 10 minutes

// ─── DB-backed Session Helpers ───────────────────────────────────────────────

async function issueOneTimeCode(session: { accessToken: string; refreshToken: string }): Promise<string> {
  const code = crypto.randomBytes(32).toString("hex");
  await db.insert(oauthCodesTable).values({
    code,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: new Date(Date.now() + CODE_TTL_MS)
  });
  return code;
}

// ─── Google OAuth URL ─────────────────────────────────────────────────────────
function getGoogleOAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "offline",
    prompt:        "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/auth/google  — initiate OAuth flow
router.get("/auth/google", async (_req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    res.status(503).json({
      error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.",
    });
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  // Store state in DB for serverless compatibility
  await db.insert(oauthStatesTable).values({
    state,
    expiresAt: new Date(Date.now() + STATE_TTL_MS)
  });
  
  res.redirect(getGoogleOAuthUrl(state));
});

// GET /api/auth/google/callback  — handle Google's redirect
router.get("/auth/google/callback", async (req, res) => {
  const code  = req.query["code"]  as string | undefined;
  const state = req.query["state"] as string | undefined;
  const error = req.query["error"] as string | undefined;

  const frontendBase = process.env["FRONTEND_URL"] ?? "";
  const failUrl      = `${frontendBase}/auth?error=google_failed`;

  if (!state) { res.redirect(failUrl); return; }

  // Validate CSRF state from DB
  const [dbState] = await db.select().from(oauthStatesTable).where(eq(oauthStatesTable.state, state)).limit(1);
  
  if (!dbState || dbState.expiresAt < new Date()) {
    res.redirect(failUrl);
    return;
  }
  
  // Consume state immediately
  await db.delete(oauthStatesTable).where(eq(oauthStatesTable.state, state));

  if (error || !code) {
    res.redirect(failUrl);
    return;
  }

  try {
    // Exchange code for Google tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    "authorization_code",
      }),
    });
    if (!tokenRes.ok) { res.redirect(failUrl); return; }
    const tokenData = await tokenRes.json() as { access_token: string };

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userInfoRes.ok) { res.redirect(failUrl); return; }
    const gUser = await userInfoRes.json() as {
      id: string; email: string; name: string; picture?: string;
    };

    const email   = gUser.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(email);
    const role    = isAdmin ? "admin" as const : "user" as const;

    // Find or create user
    let [existingUser] = await db
      .select({ id: usersTable.id, googleId: usersTable.googleId, avatarUrl: usersTable.avatarUrl, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    let userId: string;

    if (existingUser) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (!existingUser.googleId)             updates.googleId  = gUser.id;
      if (!existingUser.avatarUrl && gUser.picture) updates.avatarUrl = gUser.picture;
      if (isAdmin && existingUser.role !== "admin") updates.role = "admin";

      await db.update(usersTable).set(updates as any).where(eq(usersTable.id, existingUser.id));
      userId = existingUser.id;
    } else {
      const [newUser] = await db.insert(usersTable).values({
        email,
        name:         gUser.name,
        passwordHash: null,
        googleId:     gUser.id,
        avatarUrl:    gUser.picture ?? null,
        role,
      }).returning({ id: usersTable.id });
      userId = newUser!.id;
    }

    // Fetch final user for token signing
    const [finalUser] = await db
      .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!finalUser) { res.redirect(failUrl); return; }

    const accessToken  = signAccessToken({ sub: finalUser.id, email: finalUser.email, role: finalUser.role });
    const { token: refreshToken, hash, expiresAt } = signRefreshToken(finalUser.id);
    await db.insert(refreshTokensTable).values({ userId: finalUser.id, tokenHash: hash, expiresAt });

    // ── Issue a one-time exchange code stored in DB ──────────────
    const onetimeCode = await issueOneTimeCode({ accessToken, refreshToken });
    res.redirect(`${frontendBase}/auth/callback?code=${onetimeCode}`);

  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(failUrl);
  }
});

// POST /api/auth/google/exchange  — frontend exchanges one-time code for tokens
router.post("/auth/google/exchange", async (req, res) => {
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Code required" });
    return;
  }

  // Find code in DB
  const [session] = await db.select().from(oauthCodesTable).where(eq(oauthCodesTable.code, code)).limit(1);

  if (!session) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  if (session.expiresAt < new Date()) {
    await db.delete(oauthCodesTable).where(eq(oauthCodesTable.code, code));
    res.status(401).json({ error: "Code expired" });
    return;
  }

  // One-time use — delete immediately from DB
  await db.delete(oauthCodesTable).where(eq(oauthCodesTable.code, code));

  res.json({
    accessToken:  session.accessToken,
    refreshToken: session.refreshToken,
  });
});

// Cleanup route (optional, can be called by a cron job)
router.delete("/auth/cleanup", async (_req, res) => {
  const now = new Date();
  await db.delete(oauthStatesTable).where(lt(oauthStatesTable.expiresAt, now));
  await db.delete(oauthCodesTable).where(lt(oauthCodesTable.expiresAt, now));
  res.json({ success: true });
});

export default router;
