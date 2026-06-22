import { Router, type IRouter } from "express";
import { z } from "zod";
import multer from "multer";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "@workspace/db";
import { customOrdersTable } from "@workspace/db/schema";
import { optionalAuth } from "../middlewares/auth.js";
import { notifyNewCustomOrder } from "../lib/telegram";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_IMAGES_DIR = join(__dirname, "..", "public", "images");

// ─── Image Storage: save to local disk, serve via /api/images/ ───────────────
async function uploadToStorage(buffer: Buffer, originalname: string, _mimetype: string): Promise<string> {
  const ext      = (originalname.split(".").pop() ?? "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const filename = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  await mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  await writeFile(join(PUBLIC_IMAGES_DIR, filename), buffer);

  return `/api/images/${filename}`;
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
