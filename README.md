# SEENSTORE — E-Commerce Platform

A modern, full-stack e-commerce platform built with React, Express, and Drizzle ORM, deployed on Vercel.

## Project Structure

```
seenstore-production/
├── frontend/                 # React + Vite frontend
├── api-server/              # Express API server
├── packages/
│   ├── db/                  # Drizzle ORM database schema
│   └── api-zod/             # Shared Zod validation schemas
├── vercel.json              # Vercel deployment config
├── pnpm-workspace.yaml      # pnpm monorepo workspace
└── ENVIRONMENT_VARIABLES.md # Required env vars for deployment
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm run dev
```

### Build for Production

```bash
# Build API server
cd api-server && pnpm run build

# Build frontend
cd frontend && pnpm run build
```

## Deployment on Vercel

### 1. Create Vercel Project

```bash
vercel link
```

### 2. Set Environment Variables

Go to **Vercel Dashboard** → **Settings** → **Environment Variables** and add:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Min 32 characters
- `JWT_REFRESH_SECRET` - Min 32 characters
- `FRONTEND_URL` - Your Vercel frontend URL
- `NODE_ENV` - Set to `production`
- `GOOGLE_CLIENT_ID` - Google OAuth credentials
- `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `GOOGLE_REDIRECT_URI` - `https://your-api.vercel.app/api/auth/google/callback`
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for detailed instructions.

### 3. Deploy

```bash
vercel deploy --prod
```

Or push to GitHub and enable auto-deploy in Vercel settings.

## Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **UI Components:** Radix UI
- **State Management:** React Context + React Query

### Backend
- **Framework:** Express.js
- **Database ORM:** Drizzle ORM
- **Authentication:** JWT + Google OAuth 2.0
- **File Storage:** Supabase Storage
- **Validation:** Zod

## API Routes

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET/POST /api/auth/google` - Google OAuth flow
- `GET /api/products` - List products
- `POST /api/products` - Create product (admin)
- `GET /api/orders` - User orders
- `POST /api/orders` - Create order
- `POST /api/admin/seed` - Seed admin user (one-time)

## Database Setup

1. Create a PostgreSQL database (Supabase recommended)
2. Run migrations from `seenstore_migration.sql`
3. Create a `product-images` bucket in Supabase Storage (set to public)

## Troubleshooting

### Build fails on Vercel
- Ensure all environment variables are set correctly
- Check that `pnpm-lock.yaml` is committed to git
- Verify Node.js version compatibility (18+)

### Google OAuth not working
- Confirm `GOOGLE_REDIRECT_URI` matches your Vercel API URL
- Check Google Cloud Console credentials are correct
- Verify CORS is properly configured

### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure Supabase project is running
- Check network access rules in Supabase

## License

Proprietary - SEENSTORE
