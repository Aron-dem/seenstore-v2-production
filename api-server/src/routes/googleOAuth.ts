import { Router, type IRouter } from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db/schema";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";

const router: IRouter = Router();

// ─── Config ───────────────────────────────────────────────────────────────────
const CLIENT_ID     = process.env["GOOGLE_CLIENT_ID"]     ?? "";
const CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"] ?? "";
const REDIRECT_URI  = process.env["GOOGLE_REDIRECT_URI"]  ?? "";

const ADMIN_EMAILS = (process.env["ADMIN_EMAILS"] ?? "seifabdelrahman858@gmail.com")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// ─── One-Time Auth Code Store ─────────────────────────────────────────────────
// Tokens are NEVER passed in URL query params (visible in browser history, logs,
// referrer headers). Instead we issue a short-lived one-time code that the
// frontend exchanges once via POST /api/auth/google/exchange.
type OAuthSession = {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number; // unix ms
};

const pendingCodes = new Map<string, OAuthSession>();
const CODE_TTL_MS  = 5 * 60 * 1000; // 5 minutes

// Clean up expired codes every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of pendingCodes) {
    if (session.expiresAt < now) pendingCodes.delete(code);
  }
}, 10 * 60 * 1000);

function issueOneTimeCode(session: Omit<OAuthSession, "expiresAt">): string {
  const code = crypto.randomBytes(32).toString("hex");
  pendingCodes.set(code, { ...session, expiresAt: Date.now() + CODE_TTL_MS });
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

// ─── In-memory CSRF state store ───────────────────────────────────────────────
// state param prevents CSRF in the OAuth flow
const pendingStates = new Map<string, number>(); // state -> expiresAt ms
const STATE_TTL_MS  = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [s, exp] of pendingStates) {
    if (exp < now) pendingStates.delete(s);
  }
}, 10 * 60 * 1000);

// GET /api/auth/google  — initiate OAuth flow
router.get("/auth/google", (_req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    res.status(503).json({
      error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.",
    });
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  res.redirect(getGoogleOAuthUrl(state));
});

// GET /api/auth/google/callback  — handle Google's redirect
router.get("/auth/google/callback", async (req, res) => {
  const code  = req.query["code"]  as string | undefined;
  const state = req.query["state"] as string | undefined;
  const error = req.query["error"] as string | undefined;

  const frontendBase = process.env["FRONTEND_URL"] ?? "";
  const failUrl      = `${frontendBase}/auth?error=google_failed`;

  // Validate CSRF state
  if (!state || !pendingStates.has(state) || (pendingStates.get(state)! < Date.now())) {
    res.redirect(failUrl);
    return;
  }
  pendingStates.delete(state); // consume immediately

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

    // ── Issue a one-time exchange code instead of tokens in URL ──────────────
    // Tokens NEVER appear in the redirect URL — they stay on the server until
    // the frontend calls POST /api/auth/google/exchange to pick them up.
    const onetimeCode = issueOneTimeCode({ accessToken, refreshToken });
    res.redirect(`${frontendBase}/auth/callback?code=${onetimeCode}`);

  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(failUrl);
  }
});

// POST /api/auth/google/exchange  — frontend exchanges one-time code for tokens
// The code is valid for 5 minutes and can only be used once.
router.post("/auth/google/exchange", (req, res) => {
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Code required" });
    return;
  }

  const session = pendingCodes.get(code);

  if (!session) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  if (session.expiresAt < Date.now()) {
    pendingCodes.delete(code);
    res.status(401).json({ error: "Code expired" });
    return;
  }

  // One-time use — delete immediately
  pendingCodes.delete(code);

  res.json({
    accessToken:  session.accessToken,
    refreshToken: session.refreshToken,
  });
});

export default router;
