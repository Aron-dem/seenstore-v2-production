# Full-Stack E-Commerce Platform — Build Prompt

## Project Overview
Build a modern, production-ready e-commerce platform for a streetwear/fashion brand.
The platform supports Arabic + English (RTL/LTR), sells clothing items, handles orders,
manages an admin dashboard, and integrates Google OAuth.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + Radix UI components |
| Animations | Framer Motion |
| State | React Context + React Query |
| Routing | Wouter |
| Backend | Express.js (Node.js) |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle ORM |
| Auth | JWT (access + refresh tokens) + Google OAuth 2.0 |
| File Storage | Supabase Storage |
| Validation | Zod |
| Deployment | Vercel (frontend) + Vercel Serverless Functions or Railway (API) |
| Package Manager | pnpm |
| Monorepo | pnpm workspaces |

---

## Design System

### Brand Identity

**Name:** SEENSTORE
**Vibe:** Bold streetwear brand — oversized cuts, graphic tees, hoodies, modern Egyptian street style
**Personality:** Confident, minimal, premium-but-accessible, culturally rooted

### Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary | Red | `#E63946` | CTAs, badges, highlights, active states |
| Background | Black | `#0A0A0A` | Page background |
| Surface | Dark Gray | `#141414` | Cards, panels, modals |
| Surface Alt | Charcoal | `#1C1C1C` | Navbar, sidebar, inputs |
| Border | Subtle | `rgba(255,255,255,0.08)` | Card borders, dividers |
| Text Primary | White | `#FFFFFF` | Headlines, primary text |
| Text Secondary | Gray | `#9CA3AF` | Subtitles, meta text |
| Text Muted | Dark Gray | `#6B7280` | Placeholders, disabled |
| Accent | Off-White | `#F5F5F5` | Badges, tags |

**Usage rules:**
- Background is always black (`#0A0A0A`), never white
- Cards have `bg-[#141414]` with `border border-white/8`
- Primary red (`#E63946`) only on CTAs, active nav items, badges, hover states
- Text in gray scale: white → gray-400 → gray-500
- No gradient backgrounds on full page — subtle gradient only on hero section

### Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Headings (H1–H2) | Tajawal (Google Fonts) | Bold (700) | 3xl–6xl |
| Subheadings (H3–H4) | Tajawal | SemiBold (600) | xl–2xl |
| Body | Tajawal | Regular (400) | base (16px) |
| Small/Meta | Tajawal | Regular (400) | sm (14px) |
| Buttons | Tajawal | SemiBold (600) | sm–base |
| Price | Tajawal | Bold (700) | xl–2xl |
| Arabic font fallback | Noto Sans Arabic | — | same scale |

### Spacing & Layout

- Container max-width: `1280px` centered
- Page padding: `px-6` (mobile) → `px-8` (desktop)
- Card gap: `gap-4` (mobile) → `gap-6` (desktop)
- Section padding: `py-16` (mobile) → `py-24` (desktop)
- Border radius: `rounded-xl` (cards), `rounded-full` (buttons, badges, avatars)
- Grid: 1 col (mobile) → 2 col (tablet) → 4 col (desktop) for product grids

### Shadows & Elevation

```css
/* Card shadow — subtle, not heavy */
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);

/* Elevated (modals, dropdowns) */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);

/* No blue/purple glow — stick to black */
```

### Component Styling Conventions

**Buttons:**
- Primary: `bg-[#E63946] text-white rounded-full px-8 py-3 font-semibold hover:bg-red-700 transition-colors`
- Secondary/Ghost: `border border-white/20 text-white rounded-full px-8 py-3 hover:bg-white/10 transition-colors`
- Sizes: `sm` (px-5 py-2), `md` (px-8 py-3), `lg` (px-10 py-4)

**Cards (Product):**
- `bg-[#141414] rounded-2xl border border-white/8 overflow-hidden`
- Image: aspect-ratio `3/4`, `object-cover`
- Hover: slight scale (`scale-[1.02]`) + shadow increase
- Badge: absolute top-3 left-3, `bg-[#E63946] text-white text-xs font-bold px-3 py-1 rounded-full`

**Inputs:**
- `bg-[#1C1C1C] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-[#E63946] focus:outline-none transition-colors`

**Navbar:**
- `bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/8`

**Footer:**
- `bg-black border-t border-white/8 py-12`
- 4-column grid (mobile: stacked)

---

## User Experience (UX)

### Global UX Rules

1. **Speed first** — Every interaction responds in < 200ms. Loading skeletons for async data.
2. **No dead ends** — Every action has feedback. Errors shown inline, not in alerts.
3. **Progressive disclosure** — Don't show everything at once. Filter first, expand on click.
4. **Cart persistence** — Cart stored in `localStorage` + synced to backend when logged in.
5. **Wishlist persistence** — Synced to backend, falls back to `localStorage` for guests.
6. **Toast notifications** — Success/error toasts slide in from bottom-right (EN) or bottom-left (AR).
7. **Smooth page transitions** — Framer Motion `AnimatePresence` with `fade` + slight `y` slide.
8. **Scroll restoration** — After navigation, restore previous scroll position.
9. **Keyboard accessible** — All interactive elements focusable, `Tab` navigation works.
10. **Skeleton loading** — Never show empty space while loading. Skeleton cards match real layout.

### Navigation

**Header (sticky):**
- Logo (left in LTR, right in RTL)
- Nav links: Home, Shop, Custom Design, Contact
- Language toggle (EN / العربية) — click to switch, no page reload
- Wishlist icon with count badge
- Cart icon with item count badge
- User avatar/login (if authenticated) or "Sign In" button

**Mobile nav:**
- Hamburger icon → full-screen overlay menu (black, blurred)
- Links stacked vertically with smooth fade-in stagger animation
- Language toggle at bottom

### Page-by-Page UX

#### Home Page
1. **Hero Section** — Full-width hero image with bold headline overlay:
   - LTR: "Your Style. Your Story." / AR: "أسلوبك. قصتك."
   - Subheadline + CTA button "Shop Now" / "تسوّق الآن"
   - Animated entrance: text fades up, image subtle zoom
2. **Category Cards** — Two large cards: Summer / Winter:
   - Image + category name + "Explore" button
   - Hover: overlay darkens, button slides up
3. **New Arrivals Grid** — 4-column product grid, "NEW" badge on products
4. **Trust Signals** — 3 icons: Free Shipping, 14-Day Returns, Secure Payment
5. **FAQ Accordion** — Collapsed by default, click to expand with smooth height animation
6. **Newsletter** — Email input + "Subscribe" button, success state shows checkmark

#### Shop Page
1. **Filter Bar** (sticky on scroll):
   - Category pills (All, T-Shirts, Hoodies, Pants, Accessories)
   - Price range slider (min/max)
   - Season toggle (All / Summer / Winter)
   - In-stock only checkbox
   - Sort dropdown (Newest, Price: Low to High, Price: High to Low)
   - "Clear Filters" button (appears when any filter active)
2. **Product Grid** — Cards with:
   - Image with hover zoom (scale 1.05)
   - Name, price (with strikethrough original price if on sale)
   - Color swatches (circles, max 4 shown + "+N")
   - Quick "Add to Cart" icon button on hover
   - Wishlist heart icon (top-right corner)
3. **Pagination** — Bottom of page, numbered pages + prev/next
4. **Empty state** — "No products match your filters" with illustration + reset button

#### Product Detail Page
1. **Image Gallery** (left side):
   - Main image (large, zoom on hover — CSS transform scale)
   - Thumbnail strip below (4–6 thumbnails)
   - Click thumbnail → main image changes with crossfade
2. **Product Info** (right side):
   - Badge ("NEW" / "SALE") if present
   - Product name (large heading)
   - Price (bold, large) + original price if on sale (strikethrough, muted)
   - Rating (stars, if reviews exist)
   - Description text
   - **Size selector** — Horizontal pill buttons (XS, S, M, L, XL, XXL), selected state highlighted in red
   - **Color selector** — Circles with border on selected, tooltip with color name on hover
   - Quantity stepper (+/- buttons)
   - "Add to Cart" primary button (full width)
   - "Add to Wishlist" secondary button (full width)
   - Accordion: Size Guide, Shipping Info, Returns Policy
3. **Related Products** — "You May Also Like" horizontal scroll section at bottom

#### Cart Page
1. **Cart Items List**:
   - Product image (small), name, size, color
   - Quantity stepper (decrease/increase)
   - Price per item
   - Remove button (trash icon, confirms on click)
   - Subtotal per item
2. **Order Summary** (sticky on desktop, bottom sheet on mobile):
   - Subtotal
   - Shipping fee (shows "Calculated at checkout" or fixed amount)
   - Coupon input field + "Apply" button (shows success/error inline)
   - Discount line (hidden if no coupon)
   - Divider
   - Total (bold, large)
   - "Proceed to Checkout" primary button
3. **Empty cart state** — Illustration + "Your cart is empty" + "Start Shopping" button

#### Checkout Page
1. **Step indicator** (top): Address → Payment → Confirm
2. **Step 1 — Shipping Address**:
   - Full name, email, phone (required)
   - Governorate dropdown (all 27 Egyptian governorates)
   - City input
   - Street address (optional)
   - Postal code (optional)
3. **Step 2 — Payment**:
   - Payment method radio: "Vodafone Cash" / "Bank Transfer"
   - If Vodafone Cash: sender phone number input + screenshot upload (drag & drop + click to browse)
   - If deposit: "Pay deposit now, remainder on delivery" toggle + deposit amount shown
4. **Step 3 — Review & Confirm**:
   - Order summary (all items listed)
   - Shipping address displayed
   - Payment method + details
   - Edit links back to previous steps
   - "Place Order" primary button
5. **On success** → redirect to Order Confirmation page

#### Order Tracking Page
1. **Order ID input** — Large input field, "Track Order" button
2. **Order status timeline** — Vertical steps (pending → processing → shipped → delivered), active step highlighted in red
3. **Order details** — Items list, shipping address, payment method
4. **Guest phone** — If guest order, prompt to enter phone number for SMS updates

#### Custom Design Page
1. **Upload design** — Large drag & drop zone or "Browse" button (accepts PNG, JPG, SVG)
   - Preview uploaded image
   - "Clear" button to remove
2. **Select base item** — Grid of product types (T-Shirt, Hoodie, Tote Bag, etc.)
3. **Select size and color** — Same style as product detail page
4. **Additional details** — Textarea for special instructions
5. **Submit** — "Submit Custom Order" button
6. **Success state** — Confirmation message + order ID

#### Auth Pages
1. **Login tab / Register tab** — Toggle between forms
2. **Register**: Name, Email, Password (with strength indicator), Confirm Password, Phone (optional)
3. **Login**: Email, Password, "Forgot Password?" link
4. **Google OAuth button** — "Continue with Google" (Google icon + text)
5. **Form validation** — Inline errors below each field, red border on error
6. **Loading state** — Button shows spinner, disabled during submission
7. **Success** → redirect to previous page or home

#### Account Page
1. **Sidebar navigation** (desktop): Profile, Orders, Wishlist, Settings
2. **Profile tab**: Edit name, email, phone; change password
3. **Orders tab**: List of past orders with status badges, click to expand/view details
4. **Wishlist tab**: Grid of saved products with "Move to Cart" and "Remove" buttons

#### Admin Dashboard
1. **Sidebar navigation** (collapsible on mobile):
   - Overview, Orders, Products, Users, Custom Orders, Coupons, Messages, Settings
2. **Overview** — Stat cards (4-grid): Total Users, Total Orders, Revenue, New Users (7 days)
   - Each card: icon + number + label + trend indicator
3. **Orders** — Table view:
   - Columns: Order ID, Customer, Total, Status, Date, Actions
   - Status shown as colored badge (pending=yellow, processing=blue, shipped=purple, delivered=green, cancelled=red)
   - Row click → expand to show full details
   - Action: "Update Status" dropdown
4. **Products** — Table view with:
   - Thumbnail, Name, Category, Price, Stock status, Actions (Edit, Delete)
   - "Add Product" button → modal form
   - Image upload with preview
5. **Users** — Table: Avatar, Name, Email, Role (badge), Joined, Actions (Change Role, Delete)
6. **Custom Orders** — Table: ID, Customer, Item, Status, Date, Actions
   - Row click → modal with full details + design preview + notes input
7. **Coupons** — Table: Code, Discount %, Uses/Max, Expiry, Status, Actions
   - "Add Coupon" button → modal form
8. **Messages** — List of contact submissions with reply functionality

### Animations Specification

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Page enter | fade + y: 20→0 | 400ms | ease-out |
| Page exit | fade + y: 0→-20 | 200ms | ease-in |
| Card hover | scale 1.02 + shadow increase | 200ms | ease |
| Button hover | background color shift | 150ms | ease |
| Modal open | scale 0.95→1 + fade | 300ms | spring(stiffness:300, damping:30) |
| Modal close | scale 1→0.95 + fade | 200ms | ease |
| Accordion expand | height 0→auto | 250ms | easeInOut |
| Toast enter | x: 100→0 (EN) / x: -100→0 (AR) + fade | 300ms | spring |
| Toast exit | x: 0→100 (EN) / x: 0→-100 (AR) + fade | 200ms | ease |
| Image gallery swap | opacity 0→1 | 200ms | ease |
| Cart item add | brief scale pulse on cart icon | 150ms | ease |
| Loading skeleton | shimmer pulse | 1.5s | ease-in-out (loop) |
| Stagger list items | fade + y: 20→0, 50ms stagger | 400ms | ease-out |

---

## Features

### Core E-Commerce Features

1. **Product Browsing**
   - Grid view with lazy loading (load more on scroll)
   - Filters: category, price range (slider), season, in-stock
   - Sort: newest, price low-high, price high-low
   - Search bar (header) — searches by name and description

2. **Product Detail**
   - Multi-image gallery with zoom on hover
   - Size guide modal (size chart table)
   - Color and size selection (required before adding to cart)
   - Quantity selection
   - Add to cart with visual feedback (cart icon bounces)
   - Add to wishlist (heart fills on click)

3. **Cart**
   - Real-time subtotal calculation
   - Apply coupon code (validate against backend)
   - Remove items with confirmation
   - Persist cart in localStorage (guest) / backend (logged in)
   - Merge guest cart on login

4. **Checkout**
   - Multi-step form (Address → Payment → Confirm)
   - Governorate list for Egypt shipping
   - Payment: Vodafone Cash (screenshot upload) or Bank Transfer
   - Optional deposit payment
   - Order confirmation with order ID

5. **Order Tracking**
   - Track by order ID (no login required for guest orders)
   - Visual status timeline
   - Guest phone number collection for SMS updates

6. **Wishlist**
   - Add/remove products
   - Move to cart directly
   - Sync across devices (logged-in users)

7. **Custom Orders**
   - Upload artwork (PNG, JPG, SVG, max 10MB)
   - Select base product type, size, color
   - Add special instructions
   - Admin reviews and approves

8. **Contact**
   - Contact form (name, email, subject, message)
   - Admin replies (shown on page if email provided)

9. **Authentication**
   - Email/password registration + login
   - Google OAuth 2.0
   - JWT access tokens (15 min) + refresh tokens (30 days)
   - Forgot password (sends reset email via backend)
   - Profile management

### Admin Features

1. **Dashboard Overview** — Stats cards, recent orders
2. **Order Management** — View all, update status, filter by status
3. **Product Management** — CRUD with image upload, bulk actions
4. **User Management** — View all, change roles, delete
5. **Custom Order Management** — Review designs, update status, add notes
6. **Coupon Management** — Create/edit/delete coupons, set limits
7. **Message Management** — Read contact submissions, send replies

### Bilingual (Arabic + English)

- Language toggle in header (click, instant switch, no page reload)
- All UI text has `en` and `ar` keys in translation object
- RTL layout automatically applied for Arabic
- Number formatting respects locale
- Font switches to Tajawal (Arabic-compatible)
- CSS `dir` attribute switches between `ltr` and `rtl`
- Icons that indicate direction (arrows) flip with RTL

---

## Authentication Flow

### JWT Structure
- **Access Token**: 15 min expiry, contains `{ sub: userId, email, role }`, signed with `JWT_ACCESS_SECRET`
- **Refresh Token**: 30 day expiry, signed with `JWT_REFRESH_SECRET`, stored in DB as SHA256 hash
- Token rotation: every refresh deletes old token, issues new pair
- **Logout**: delete refresh token from DB (access token valid until expiry)
- No insecure fallback secrets in production — app exits if env vars missing

### Google OAuth
1. Generate random `state`, store in `oauth_states` table with 10-min expiry
2. Redirect to Google with `state`
3. Google redirects back with `code` + `state`
4. Verify `state`, exchange `code` for tokens, create/find user
5. For serverless: use `oauth_codes` table to pass tokens between auth callback and API

### Password Auth
- bcrypt, cost factor 12
- Always run bcrypt even if user not found (timing-safe)
- Uniform error message: "Invalid email or password" (no email enumeration)

---

## API Routes

### Auth
- `POST /api/auth/register` — Zod: name(2-60), email, password(6-72), phone(optional)
- `POST /api/auth/login` — Zod: email, password
- `POST /api/auth/refresh` — body: { refreshToken }
- `POST /api/auth/logout` — requireAuth, body: { refreshToken }
- `GET /api/auth/me` — requireAuth

### Google OAuth
- `GET /api/auth/google` — initiates OAuth flow
- `GET /api/auth/google/callback` — handles callback

### Products (public)
- `GET /api/products` — filters: category, maxPrice, minPrice, inStock, sort, season
- `GET /api/products/:id`

### Orders
- `POST /api/orders` — optionalAuth, Zod validated
- `GET /api/orders/:id` — **MUST check: user is owner OR admin** (CRITICAL FIX)
- `PATCH /api/orders/:id/guest-phone`
- `GET /api/orders` — requireAuth, admin only

### Custom Orders
- `POST /api/custom-orders` — optionalAuth

### Messages
- `POST /api/messages` — contact form submission

### Coupons
- `GET /api/coupons/validate` — public, code query param

### Admin (requireAdmin)
- `GET /api/admin/stats`
- `GET /api/admin/orders` — paginated
- `PATCH /api/admin/orders/:id` — update status
- `GET /api/admin/products` — paginated
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/upload/image` — multer, 8MB max, validate mime type
- `GET /api/admin/users` — paginated
- `PATCH /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/custom-orders` — paginated, filter by status
- `PATCH /api/admin/custom-orders/:id`
- `DELETE /api/admin/custom-orders/:id`
- `GET /api/admin/coupons`
- `POST /api/admin/coupons`
- `PATCH /api/admin/coupons/:id`
- `DELETE /api/admin/coupons/:id`
- `POST /api/admin/seed` — first-time admin setup, NO fallback secret

### Health
- `GET /api/health`

---

## Security Requirements

### Must Have
- [ ] Helmet.js security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Rate limiting: 20 attempts/15min on auth routes; 300/min general
- [ ] CORS: strict origin checking in production
- [ ] Zod validation on ALL user inputs (body, query, params)
- [ ] Admin-only routes protected by `requireAdmin` middleware
- [ ] No password hash or sensitive data in API responses
- [ ] File upload: validate mime type (images only), 8MB limit
- [ ] Uniform error messages (no data leakage)
- [ ] Order data: only owner or admin can view order details
- [ ] Production: fail-fast if required env vars missing

### Recommended
- [ ] XSS sanitization on user-generated content (contact messages, reviews)
- [ ] CSRF: use `SameSite=Strict` if cookies are introduced
- [ ] Refresh token blacklist (Redis) — current DB approach is OK for scale
- [ ] CAPTCHA on login/register
- [ ] Account lockout after N failed attempts

---

## Environment Variables

```
# Database
DATABASE_URL=

# JWT (min 32 chars each, NO fallback in production)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Frontend URL (for CORS)
FRONTEND_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Admin (NO default fallback)
ADMIN_EMAILS=you@example.com
ADMIN_SEED_KEY=

NODE_ENV=production
```

---

## Project Structure

```
/
├── api-server/
│   ├── src/
│   │   ├── app.ts              # Express setup (helmet, cors, rate limit, compression)
│   │   ├── index.ts             # Entry point
│   │   ├── db/
│   │   │   └── schema.ts         # Drizzle schema + Zod schemas
│   │   ├── lib/
│   │   │   ├── jwt.ts            # Token signing/verification
│   │   │   └── logger.ts         # Pino logger
│   │   ├── middlewares/
│   │   │   └── auth.ts           # requireAuth, requireAdmin, optionalAuth
│   │   └── routes/
│   │       ├── auth.ts
│   │       ├── googleOAuth.ts
│   │       ├── orders.ts
│   │       ├── products.ts
│   │       ├── reviews.ts
│   │       ├── messages.ts
│   │       ├── customOrders.ts
│   │       ├── me.ts
│   │       └── admin.ts
│   ├── build.mjs
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── components/           # Shared UI components
│   │   ├── context/              # LanguageContext, WishlistContext, AuthContext
│   │   ├── hooks/                # useToast, useSEO
│   │   ├── lib/                  # apiClient, utils
│   │   ├── pages/                # All page components
│   │   └── assets/               # Images
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── packages/
│   ├── db/
│   │   ├── src/index.ts
│   │   ├── src/schema.ts          # Re-exports from api-server
│   │   └── package.json
│   └── api-zod/
│       ├── src/index.ts
│       └── package.json
├── package.json                   # Root workspace config
├── pnpm-workspace.yaml
├── vercel.json
├── tsconfig.base.json
└── seenstore_migration.sql        # Raw SQL migration (backup)
```

---

## Payment Flow (Manual)

1. User selects items, fills shipping address
2. User chooses payment method: Bank Transfer OR Vodafone Cash
3. If Vodafone Cash: user enters sender phone number + uploads payment screenshot
4. If deposit: user pays deposit amount, remainder on delivery
5. Order created with status `pending`
6. Admin reviews screenshot, approves/cancels in dashboard
7. Admin updates status: pending → processing → shipped → delivered

---

## Pages to Build (Frontend)

| Page | Route | Auth | Key UX Elements |
|---|---|---|---|
| Home | `/` | Public | Hero, categories, new arrivals, FAQ, newsletter |
| Shop | `/shop` | Public | Sticky filter bar, 4-col grid, pagination |
| Product Detail | `/product/:id` | Public | Gallery zoom, size/color selectors, size guide modal |
| Cart | `/cart` | Public | Item list, quantity stepper, coupon input, order summary |
| Checkout | `/checkout` | Public (optional) | 3-step wizard: Address → Payment → Confirm |
| Order Confirmation | `/order/:id` | Public | Success message, order ID, status timeline |
| Track Order | `/track` | Public | Order ID lookup, status timeline |
| Custom Design | `/custom-design` | Public (optional) | Upload zone, product selector, size/color |
| Contact | `/contact` | Public | Form with inline validation, success state |
| Auth | `/auth` | Guest only | Tab toggle login/register, Google OAuth |
| Account | `/account` | Required | Sidebar nav: profile, orders, wishlist |
| Wishlist | `/wishlist` | Required | Product grid with move-to-cart action |
| Admin Dashboard | `/admin` | Admin only | Sidebar nav, stats cards, tabbed tables |
| 404 | `/*` | — | Not found page with back-to-home |

---

## Acceptance Criteria

1. User can register, login, logout
2. User can browse products, filter, sort, search
3. User can add to cart, apply coupon, checkout
4. User can track order by ID
5. Admin can manage products, orders, users, coupons
6. Arabic/English toggle works across all pages with RTL support
7. Google OAuth login works
8. File upload for products works
9. All pages are responsive (mobile, tablet, desktop)
10. No critical security vulnerabilities (especially order data exposure)
11. Deployment on Vercel works
12. Design matches brand identity (black bg, red accents, Tajawal font)
13. All animations are smooth (60fps) with Framer Motion
14. Loading skeletons appear while fetching data
15. Toast notifications for all user actions