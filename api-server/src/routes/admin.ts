import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, desc, count, sql, asc } from "drizzle-orm";
import multer from "multer";
import { db } from "@workspace/db";
import { usersTable, ordersTable, customOrdersTable, productsTable, couponsTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// ── Derive Supabase HTTP URL ───────────────────────────────────────────────────
// Priority: decode project ref from JWT key → fall back to SUPABASE_URL parsing
function getSupabaseHttpUrl(rawUrl?: string, jwtKey?: string): string | null {
  // 1. Try to decode the ref from the JWT service role key (most reliable)
  if (jwtKey) {
    try {
      const payload = jwtKey.split(".")[1];
      const padded  = payload + "=".repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
      if (decoded.ref) return `https://${decoded.ref}.supabase.co`;
    } catch { /* ignore */ }
  }
  // 2. Fall back to parsing SUPABASE_URL
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http")) return rawUrl;
  const m = rawUrl.match(/db\.([a-z0-9]+)\.supabase\.co/);
  return m ? `https://${m[1]}.supabase.co` : null;
}

// ─── Image Storage helper (Supabase primary · Replit fallback) ────────────────
async function uploadToStorage(buffer: Buffer, originalname: string, mimetype: string): Promise<string> {
  const ext        = (originalname.split(".").pop() ?? "jpg").replace(/[^a-z0-9]/gi, "");
  const objectName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // ── 1. Supabase Storage (derives URL from JWT key ref) ────────────────────
  const rawSupabaseUrl = process.env["SUPABASE_URL"];
  const supabaseKey    = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const supabaseUrl    = getSupabaseHttpUrl(rawSupabaseUrl, supabaseKey);

  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const ws = (await import("ws")).default;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }, realtime: { transport: ws } } as any);

    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === "product-images")) {
      await supabase.storage.createBucket("product-images", { public: true });
    }

    const { error } = await supabase.storage
      .from("product-images")
      .upload(objectName, buffer, { contentType: mimetype, upsert: false });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(objectName);
    return publicUrl;
  }

  // ── 2. Replit Object Storage fallback ─────────────────────────────────────
  const REPLIT_SIDECAR = "http://127.0.0.1:1106";
  const bucketId       = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
  if (!bucketId) throw new Error("Storage not configured: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY or DEFAULT_OBJECT_STORAGE_BUCKET_ID");

  const fullName = `product-images/${objectName}`;
  const signRes  = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      bucket_name: bucketId,
      object_name: fullName,
      method:      "PUT",
      expires_at:  new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }),
  });
  if (!signRes.ok) throw new Error(`Failed to get upload URL: ${await signRes.text()}`);
  const { signed_url: signedUrl } = await signRes.json() as { signed_url: string };

  const uploadRes = await fetch(signedUrl, {
    method:  "PUT",
    headers: { "Content-Type": mimetype },
    body:    buffer,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`);
  return `https://storage.googleapis.com/${bucketId}/${fullName}`;
}

// helper: extract a single string from req.params value (Express 5 types allow string | string[])
function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const row = (await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users)                                               AS "totalUsers",
      (SELECT COUNT(*)::int FROM orders)                                              AS "totalOrders",
      (SELECT COUNT(*)::int FROM custom_orders)                                       AS "totalCustomOrders",
      (SELECT COUNT(*)::int FROM custom_orders WHERE status = 'pending')              AS "pendingCustomOrders",
      (SELECT COALESCE(SUM(total), 0)::int FROM orders WHERE status = 'delivered')   AS "totalRevenue",
      (SELECT COUNT(*)::int FROM products)                                            AS "totalProducts",
      (SELECT COUNT(*)::int FROM products WHERE in_stock = true)                      AS "productsInStock",
      (SELECT COUNT(*)::int FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS "newUsersWeek"
  `))[0] ?? {};
  res.json(row);
});

// ─── Regular Orders ───────────────────────────────────────────────────────────
router.get("/admin/orders", requireAdmin, async (req, res) => {
  const page   = Math.max(1, parseInt(paramStr(req.query["page"]  as string | string[]) || "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(paramStr(req.query["limit"] as string | string[]) || "20", 10)));
  const offset = (page - 1) * limit;
  const [orders, [total]] = await Promise.all([
    db.select({
      id: ordersTable.id, userId: ordersTable.userId,
      customerName: ordersTable.customerName, customerEmail: ordersTable.customerEmail,
      subtotal: ordersTable.subtotal, shippingFee: ordersTable.shippingFee,
      total: ordersTable.total, status: ordersTable.status,
      callStatus: ordersTable.callStatus, adminNotes: ordersTable.adminNotes,
      couponCode: ordersTable.couponCode, couponDiscount: ordersTable.couponDiscount,
      depositAmount: ordersTable.depositAmount, paymentScreenshot: ordersTable.paymentScreenshot,
      vfSenderPhone: ordersTable.vfSenderPhone, guestPhone: ordersTable.guestPhone,
      items: ordersTable.items,
      shippingAddress: ordersTable.shippingAddress,
      createdAt: ordersTable.createdAt, updatedAt: ordersTable.updatedAt,
    }).from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(ordersTable),
  ]);
  res.json({ orders, total: total?.total ?? 0, page, limit });
});

router.patch("/admin/orders/:id", requireAdmin, async (req, res) => {
  const id = paramStr(req.params["id"] as string | string[]);
  const parsed = z.object({
    status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
    callStatus: z.enum(["new", "called", "confirmed", "no_answer", "cancelled"]).optional(),
    adminNotes: z.string().max(2000).optional(),
  }).parse(req.body);

  await db.update(ordersTable)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(ordersTable.id, id));

  res.json({ success: true });
});

// ─── Image Upload ─────────────────────────────────────────────────────────────
router.post("/admin/upload/image", requireAdmin, upload.single("image"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  try {
    const url = await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ url });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────
const productVariantSchema = z.object({
  color: z.string().min(1),
  hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).nullable().optional(),
  images: z.array(z.string()).default([]),
});

const productSchema = z.object({
  name:          z.string().min(1).max(120),
  nameAr:        z.string().max(120).default(""),
  description:   z.string().max(2000).default(""),
  descriptionAr: z.string().max(2000).default(""),
  price:         z.number().int().positive(),
  originalPrice: z.number().int().positive().nullable().optional(),
  category:      z.string().min(1).max(60),
  badge:         z.string().max(20).nullable().optional(),
  sizes:         z.array(z.string()).default([]),
  colors:        z.array(z.string()).default([]),
  images:        z.array(z.string()).default([]),
  variants:      z.array(productVariantSchema).default([]),
  inStock:       z.boolean().default(true),
  soldOut:       z.boolean().default(false),
  season:        z.enum(["summer", "winter"]).nullable().optional(),
});

router.get("/admin/products", requireAdmin, async (req, res) => {
  const page   = Math.max(1, parseInt(paramStr(req.query["page"]  as string | string[]) || "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(paramStr(req.query["limit"] as string | string[]) || "50", 10)));
  const offset = (page - 1) * limit;

  const [products, [total]] = await Promise.all([
    db.select().from(productsTable).orderBy(asc(productsTable.id)).limit(limit).offset(offset),
    db.select({ total: count() }).from(productsTable),
  ]);
  res.json({ products, total: total?.total ?? 0, page, limit });
});

router.post("/admin/products", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0]?.message }); return; }
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    originalPrice: parsed.data.originalPrice ?? null,
    badge:         parsed.data.badge ?? null,
  }).returning();
  res.status(201).json({ product });
});

router.patch("/admin/products/:id", requireAdmin, async (req, res) => {
  const id = parseInt(paramStr(req.params["id"]), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0]?.message }); return; }
  const [product] = await db.update(productsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(productsTable.id, id))
    .returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ product });
});

router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  const id = parseInt(paramStr(req.params["id"]), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true });
});

// ─── Users ────────────────────────────────────────────────────────────────────
const safeUserCols = {
  id:        usersTable.id,
  name:      usersTable.name,
  email:     usersTable.email,
  role:      usersTable.role,
  phone:     usersTable.phone,
  createdAt: usersTable.createdAt,
};

router.get("/admin/users", requireAdmin, async (req, res) => {
  const page   = Math.max(1, parseInt(paramStr(req.query["page"]  as string | string[]) || "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(paramStr(req.query["limit"] as string | string[]) || "20", 10)));
  const offset = (page - 1) * limit;
  const [users, [total]] = await Promise.all([
    db.select(safeUserCols).from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(usersTable),
  ]);
  res.json({ users, total: total?.total ?? 0, page, limit });
});

router.patch("/admin/users/:id/role", requireAdmin, async (req, res) => {
  const { role } = z.object({ role: z.enum(["user", "admin"]) }).parse(req.body);
  await db.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, paramStr(req.params["id"])));
  res.json({ success: true });
});

router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = paramStr(req.params["id"]);
  if (id === req.user!.sub) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

// ─── Custom Orders ────────────────────────────────────────────────────────────
router.get("/admin/custom-orders", requireAdmin, async (req, res) => {
  const page   = Math.max(1, parseInt(paramStr(req.query["page"]  as string | string[]) || "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(paramStr(req.query["limit"] as string | string[]) || "20", 10)));
  const offset = (page - 1) * limit;
  const status = paramStr(req.query["status"] as string | string[] | undefined) || undefined;

  const [orders, [total]] = status
    ? await Promise.all([
        db.select().from(customOrdersTable).where(eq(customOrdersTable.status, status as never)).orderBy(desc(customOrdersTable.createdAt)).limit(limit).offset(offset),
        db.select({ total: count() }).from(customOrdersTable).where(eq(customOrdersTable.status, status as never)),
      ])
    : await Promise.all([
        db.select().from(customOrdersTable).orderBy(desc(customOrdersTable.createdAt)).limit(limit).offset(offset),
        db.select({ total: count() }).from(customOrdersTable),
      ]);
  res.json({ orders, total: total?.total ?? 0, page, limit });
});

router.patch("/admin/custom-orders/:id", requireAdmin, async (req, res) => {
  const schema = z.object({
    status:     z.enum(["pending", "processing", "done", "cancelled"]).optional(),
    adminNotes: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0]?.message }); return; }
  await db.update(customOrdersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(customOrdersTable.id, paramStr(req.params["id"])));
  res.json({ success: true });
});

router.delete("/admin/custom-orders/:id", requireAdmin, async (req, res) => {
  await db.delete(customOrdersTable).where(eq(customOrdersTable.id, paramStr(req.params["id"])));
  res.json({ success: true });
});

// ─── Coupons (Admin CRUD) ─────────────────────────────────────────────────────
router.get("/admin/coupons", requireAdmin, async (_req, res) => {
  const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  res.json({ coupons });
});

const couponSchema = z.object({
  code:         z.string().min(2).max(30).transform(v => v.toUpperCase().trim()),
  discountRate: z.number().int().min(1).max(100),
  description:  z.string().max(200).optional().nullable(),
  isActive:     z.boolean().optional().default(true),
  maxUses:      z.number().int().positive().optional().nullable(),
  expiresAt:    z.string().datetime().optional().nullable(),
});

router.post("/admin/coupons", requireAdmin, async (req, res) => {
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0]?.message }); return; }
  const [coupon] = await db.insert(couponsTable).values({
    ...parsed.data,
    description: parsed.data.description ?? null,
    maxUses:     parsed.data.maxUses ?? null,
    expiresAt:   parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  }).returning();
  res.status(201).json({ coupon });
});

router.patch("/admin/coupons/:id", requireAdmin, async (req, res) => {
  const id     = paramStr(req.params["id"] as string | string[]);
  const parsed = couponSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0]?.message }); return; }
  const data = {
    ...parsed.data,
    ...(parsed.data.expiresAt !== undefined ? { expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null } : {}),
    updatedAt: new Date(),
  };
  const [coupon] = await db.update(couponsTable).set(data).where(eq(couponsTable.id, id)).returning();
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }
  res.json({ coupon });
});

router.delete("/admin/coupons/:id", requireAdmin, async (req, res) => {
  const id = paramStr(req.params["id"] as string | string[]);
  await db.delete(couponsTable).where(eq(couponsTable.id, id));
  res.json({ success: true });
});

// ─── Public: Validate Coupon ──────────────────────────────────────────────────
router.get("/coupons/validate", async (req, res) => {
  const code = (paramStr(req.query["code"] as string | string[]) || "").toUpperCase().trim();
  if (!code) { res.status(400).json({ valid: false, error: "Code is required" }); return; }

  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code)).limit(1);
  if (!coupon) { res.status(404).json({ valid: false, error: "Invalid coupon code" }); return; }
  if (!coupon.isActive) { res.status(400).json({ valid: false, error: "This coupon is no longer active" }); return; }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) { res.status(400).json({ valid: false, error: "This coupon has expired" }); return; }
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) { res.status(400).json({ valid: false, error: "This coupon has reached its usage limit" }); return; }

  res.json({ valid: true, code: coupon.code, discountRate: coupon.discountRate, description: coupon.description });
});

// ─── Admin Seed (first-time setup) ───────────────────────────────────────────
router.post("/admin/seed", async (req, res) => {
  const seedKey  = process.env["ADMIN_SEED_KEY"] ?? "SEEN-ADMIN-SETUP-2024";
  const { key, email } = z.object({ key: z.string(), email: z.string().email() }).parse(req.body);
  if (key !== seedKey) { res.status(403).json({ error: "Invalid seed key" }); return; }
  await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.email, email));
  res.json({ success: true, message: `Promoted ${email} to admin` });
});

export default router;
