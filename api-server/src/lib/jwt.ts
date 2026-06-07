import jwt from "jsonwebtoken";
import crypto from "crypto";

// ─── Secrets ──────────────────────────────────────────────────────────────────
// Must be set via environment variables — no insecure defaults.
// In development the server will warn; in production it will exit.
function requireSecret(name: string, devFallback: string): string {
  const val = process.env[name];
  if (val) return val;

  if (process.env["NODE_ENV"] !== "production") {
    console.warn(
      `[JWT] WARNING: ${name} not set. Using insecure development fallback. ` +
      `Set this variable before deploying to production.`
    );
    return devFallback;
  }

  console.error(`[FATAL] ${name} environment variable is required in production.`);
  process.exit(1);
}

const ACCESS_SECRET  = requireSecret("JWT_ACCESS_SECRET",  "dev-only-access-secret-not-for-prod");
const REFRESH_SECRET = requireSecret("JWT_REFRESH_SECRET", "dev-only-refresh-secret-not-for-prod");
const ACCESS_EXPIRY  = "15m";
const REFRESH_EXPIRY = "30d";

export interface AccessTokenPayload {
  sub:   string;
  email: string;
  role:  "user" | "admin";
  iat?:  number;
  exp?:  number;
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(userId: string): { token: string; hash: string; expiresAt: Date } {
  const token     = jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  const hash      = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
