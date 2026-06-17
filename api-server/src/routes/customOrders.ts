import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { customOrdersTable } from "@workspace/db/schema";
import { optionalAuth } from "../middlewares/auth.js";
import { notifyNewCustomOrder } from "../lib/telegram";

const router: IRouter = Router();

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
