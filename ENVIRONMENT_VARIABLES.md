# SEENSTORE — Environment Variables

## Required (must set before deploying)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Supabase | `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` |
| `JWT_ACCESS_SECRET` | Secret for signing JWT access tokens (min 32 chars) | `your-super-secret-access-key-here-32chars` |
| `JWT_REFRESH_SECRET` | Secret for signing JWT refresh tokens (min 32 chars) | `your-super-secret-refresh-key-here-32chars` |
| `FRONTEND_URL` | Deployed frontend URL (for CORS) | `https://your-project.vercel.app` |
| `NODE_ENV` | Must be `production` for deployment | `production` |

## Google OAuth (required for Google login)

| Variable | Description | How to get |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | Google Cloud Console → APIs → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | Same as above |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URL | `https://your-api.vercel.app/api/auth/google/callback` |

## Supabase Storage (required for product image uploads in production)

| Variable | Description | Where to find |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (not anon key!) | Supabase Dashboard → Project Settings → API → service_role |

> **Note:** Create a bucket named `product-images` in Supabase Storage and set it to **public**.

## Optional / Admin

| Variable | Description | Default |
|---|---|---|
| `ADMIN_SEED_KEY` | Key for the one-time admin promotion endpoint | `SEEN-ADMIN-SETUP-2024` |
| `ADMIN_EMAILS` | Comma-separated list of admin emails | `seifabdelrahman858@gmail.com` |
| `PORT` | API server port | `8080` |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Supabase storage bucket ID for product images | `product-images` |

---

## Vercel Setup Steps

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add all variables above for the **Production** environment
3. Redeploy the project

## To set the admin account after first deploy

After deploying, call this endpoint once with your admin email:

```bash
curl -X POST https://your-api.vercel.app/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"key": "SEEN-ADMIN-SETUP-2024", "email": "seifabdelrahman858@gmail.com"}'
```

Or just run the SQL in `seenstore_migration.sql` which already inserts the admin row.
