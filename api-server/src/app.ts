import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const isProd = process.env["NODE_ENV"] === "production";

// ─── Allowed Origins ──────────────────────────────────────────────────────────
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "";
const allowedOrigins = new Set<string>(FRONTEND_URL ? [FRONTEND_URL] : []);

function isOriginAllowed(origin: string | undefined): boolean {
  if (!isProd) return true;
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  for (const allowed of allowedOrigins) {
    if (origin === allowed.replace(/\/$/, "")) return true;
  }
  return false;
}

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", "data:", "https:"],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'", "https:", "data:"],
      objectSrc:      ["'none'"],
      mediaSrc:       ["'self'"],
      frameSrc:       ["'none'"],
      ...(isProd ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginResourcePolicy:   { policy: "cross-origin" },
  crossOriginOpenerPolicy:     { policy: "same-origin-allow-popups" },
  referrerPolicy:              { policy: "strict-origin-when-cross-origin" },
  hsts: isProd
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  xFrameOptions:               { action: "deny" },
  xContentTypeOptions:         true,
}));

app.set("trust proxy", 1);

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) callback(null, true);
    else callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const ipKey = (req: express.Request) =>
  (req.ip ?? req.socket?.remoteAddress ?? "anonymous");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    ipKey,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      300,
  message:  { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    ipKey,
});

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
    res(res) { return { statusCode: res.statusCode }; },
  },
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api",      generalLimiter);
app.use("/api",      router);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = isProd ? "Internal server error" : err.message;
  logger.error(err);
  res.status(500).json({ error: message });
});

export default app;
