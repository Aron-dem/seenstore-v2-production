-- =====================================================================
-- SEENSTORE — Complete Schema for Supabase / PostgreSQL
-- Run this on a fresh Supabase project (SQL Editor → Run)
-- =====================================================================

-- ─── Enums (safe idempotent creation) ──────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending','processing','shipped','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.custom_order_status AS ENUM ('pending','processing','done','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email        text NOT NULL UNIQUE,
  name         text NOT NULL,
  password_hash text,
  google_id    text UNIQUE,
  avatar_url   text,
  role         public.user_role NOT NULL DEFAULT 'user',
  phone        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx     ON public.users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON public.users(google_id) WHERE google_id IS NOT NULL;

-- ─── Refresh Tokens ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS        refresh_tokens_user_idx ON public.refresh_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_hash_idx ON public.refresh_tokens(token_hash);

-- ─── Products ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id             serial PRIMARY KEY,
  name           text NOT NULL,
  name_ar        text NOT NULL DEFAULT '',
  description    text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  price          integer NOT NULL,
  original_price integer,
  category       text NOT NULL,
  badge          text,
  sizes          text[] NOT NULL DEFAULT '{}',
  colors         text[] NOT NULL DEFAULT '{}',
  images         text[] NOT NULL DEFAULT '{}',
  in_stock       boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_in_stock_idx ON public.products(in_stock);

-- ─── Orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                 text PRIMARY KEY,
  user_id            text REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name      text NOT NULL,
  customer_email     text NOT NULL,
  items              jsonb NOT NULL,
  subtotal           integer NOT NULL,
  shipping_fee       integer NOT NULL DEFAULT 0,
  total              integer NOT NULL,
  status             public.order_status NOT NULL DEFAULT 'pending',
  shipping_address   jsonb,
  coupon_code        text,
  coupon_discount    integer NOT NULL DEFAULT 0,
  deposit_amount     integer NOT NULL DEFAULT 0,
  payment_screenshot text,
  vf_sender_phone    text,
  guest_phone        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx  ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders(created_at);

-- ─── Custom Orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id             text PRIMARY KEY,
  user_id        text REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name  text NOT NULL,
  customer_email text NOT NULL,
  item_type      text NOT NULL,
  size           text NOT NULL,
  color          text NOT NULL,
  design_url     text,
  details        text NOT NULL,
  status         public.custom_order_status NOT NULL DEFAULT 'pending',
  admin_notes    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS custom_orders_user_idx    ON public.custom_orders(user_id);
CREATE INDEX IF NOT EXISTS custom_orders_status_idx  ON public.custom_orders(status);
CREATE INDEX IF NOT EXISTS custom_orders_created_idx ON public.custom_orders(created_at);

-- ─── Contact Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text NOT NULL,
  message     text NOT NULL,
  admin_reply text,
  replied_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON public.contact_messages(created_at);

-- ─── Wishlist ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_product_idx ON public.wishlist_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS        wishlist_user_idx         ON public.wishlist_items(user_id);

-- ─── Coupons ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code          text NOT NULL UNIQUE,
  discount_rate integer NOT NULL,
  description   text,
  is_active     boolean NOT NULL DEFAULT true,
  max_uses      integer,
  uses_count    integer NOT NULL DEFAULT 0,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code);

-- ─── Admin Account ──────────────────────────────────────────────────
-- ⚠️  Change the email below to your actual admin email before running!
INSERT INTO public.users (id, email, name, role)
VALUES (gen_random_uuid()::text, 'seifabdelrahman858@gmail.com', 'Seif Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin', updated_at = now();

