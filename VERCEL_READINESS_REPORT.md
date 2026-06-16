# Vercel Readiness Report — SEENSTORE

Date: 2026-06-16

## Result

The project is **ready for deployment to Vercel** after validating the production build and fixing one production issue in the API CORS logic.

## What was tested

### 1) Dependency install
```bash
corepack pnpm install
```
Result: success

### 2) Production build
```bash
corepack pnpm --filter "*" run build
```
Result: success

Artifacts generated:
- Frontend static output: `frontend/dist/public`
- Vercel serverless function: `api/server.mjs`

### 3) Runtime smoke test
Started the built API locally with production-like environment variables and tested:
- `GET /api/healthz` without `Origin` header
- `GET /api/healthz` with allowed `Origin` header

Result after fix:
- both returned `200`
- body: `{"status":"ok"}`

## Issue found and fixed

### Production CORS bug
**Problem:** production requests without an `Origin` header were rejected with HTTP 500.
This can affect:
- same-origin/browser requests in some cases
- health checks
- curl/server-to-server requests

**Fix applied:** in `api-server/src/app.ts`, requests without `Origin` are now allowed in production.

## Required Vercel environment variables

Set these in **Vercel → Project Settings → Environment Variables**:

### Required
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `NODE_ENV=production`

### Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### Storage
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Optional / admin
- `ADMIN_SEED_KEY`
- `ADMIN_EMAILS`
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- `PORT` (usually handled by Vercel runtime)

## Notes

- Frontend build emits a large JS chunk warning, but the build still succeeds.
- Root `package.json` build script is compatible with Vercel because Vercel provides `pnpm` in the build environment.
- Health route currently available in code is `/api/healthz`.

## Recommended deploy flow

```bash
vercel deploy --prod
```

Or connect the GitHub repo to Vercel and deploy automatically from the default branch.
