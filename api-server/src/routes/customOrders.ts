import { Router, type IRouter } from "express";
import { z } from "zod";
import multer from "multer";
import { db } from "@workspace/db";
import { customOrdersTable } from "@workspace/db/schema";
import { optionalAuth } from "../middlewares/auth.js";
import { notifyNewCustomOrder } from "../lib/telegram";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Derive Supabase HTTP URL ───────────────────────────────────────────────────
function getSupabaseHttpUrl(rawUrl?: string, jwtKey?: string): string | null {
  if (jwtKey) {
    try {
      const payload = jwtKey.split(".")[1];
      const padded  = payload + "=".repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
      if (decoded.ref) return `https://${decoded.ref}.supabase.co`;
    } catch { /* ignore */ }
  }
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http")) return rawUrl;
  const m = rawUrl.match(/db\.([a-z0-9]+)\.supabase\.co/);
  return m ? `https://${m[1]}.supabase.co` : null;
}

// ─── Image Storage helper (Supabase primary · Replit fallback) ────────────────
async function uploadToStorage(buffer: Buffer, originalname: string, mimetype: string): Promise<string> {
  const ext        = (originalname.split(".").pop() ?? "jpg").replace(/[^a-z0-9]/gi, "");
  const objectName = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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

  const REPLIT_SIDECAR = "http://127.0.0.1:1106";
  const bucketId       = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];
  if (!bucketId) throw new Error("Storage not configured");

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
  if (!signRes.ok) throw new Error(`Failed to get upload URL`);
  const { signed_url: signedUrl } = await signRes.json() as { signed_url: string };

  const uploadRes = await fetch(signedUrl, {
    method:  "PUT",
    headers: { "Content-Type": mimetype },
    body:    buffer,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed`);
  return `https://storage.googleapis.com/${bucketId}/${fullName}`;
}

// POST /api/custom-orders/upload
router.post("/custom-orders/upload", upload.single("image"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  try {
    const url = await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ url });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});

const createCustomOrderSchema = z.object({
  customerName:  z.string().min(2).max(80),
  customerPhone: z.string().min(8).max(30),
  customerEmail: z.string().email().optional(),
  itemType:      z.string().min(1),
  size:          z.string().min(1),
  color:         z.string().min(1),
  details:       z.string().min(1),
  designUrl:     z.string().optional(),
});

// POST /api/custom-orders
router.post("/custom-orders", optionalAuth, async (req, res) => {
  const parsed = createCustomOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Validation error" });
    return;
  }

  const fallbackEmail = req.user?.email
    ?? parsed.data.customerEmail
    ?? `guest-${parsed.data.customerPhone.replace(/\D/g, "") || "custom"}@seenstore.local`;

  const [order] = await db.insert(customOrdersTable).values({
    customerName: parsed.data.customerName,
    customerEmail: fallbackEmail,
    customerPhone: parsed.data.customerPhone,
    itemType: parsed.data.itemType,
    size: parsed.data.size,
    color: parsed.data.color,
    details: parsed.data.details,
    userId: req.user?.sub ?? null,
    designUrl: parsed.data.designUrl ?? null,
  }).returning();

  await notifyNewCustomOrder({
    orderId: order.id,
    customerName: parsed.data.customerName,
    phone: parsed.data.customerPhone,
    itemType: parsed.data.itemType,
    size: parsed.data.size,
    color: parsed.data.color,
    details: parsed.data.details,
  }).catch((error) => console.error("Telegram custom order notification failed:", error));

  res.status(201).json({ order });
});

export default router;
