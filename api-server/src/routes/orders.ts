import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import { notifyNewOrder } from "../lib/telegram";
import { z } from "zod";

const router: IRouter = Router();

// Zod schema for order creation
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number(),
    name: z.string(),
    price: z.number(),
    image: z.string(),
    size: z.string(),
    color: z.string(),
    quantity: z.number(),
  })),
  subtotal: z.number(),
  shippingFee: z.number(),
  total: z.number(),
  shippingAddress: z.object({
    fullName: z.string(),
    phone: z.string(),
    governorate: z.string(),
    city: z.string(),
    street: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  paymentMethod: z.string().default("vodafone_cash"),
  customerName: z.string(),
  customerEmail: z.string(),
  couponCode:        z.string().nullable().optional(),
  couponDiscount:    z.number().int().min(0).default(0),
  depositAmount:     z.number().int().min(0).default(0),
  paymentScreenshot: z.string().optional(),
  vfSenderPhone:     z.string().optional(),
});

// POST /api/orders — Create a new order
router.post("/orders", optionalAuth, async (req, res) => {
  try {
    const payload = createOrderSchema.parse(req.body);

    const newOrder = await db.insert(ordersTable).values({
      userId: req.user?.sub || null,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      items: payload.items,
      subtotal: payload.subtotal,
      shippingFee: payload.shippingFee,
      total: payload.total,
      shippingAddress: payload.shippingAddress,
      couponCode:        payload.couponCode ?? null,
      couponDiscount:    payload.couponDiscount,
      depositAmount:     payload.depositAmount,
      paymentScreenshot: payload.paymentScreenshot ?? null,
      vfSenderPhone:     payload.vfSenderPhone ?? null,
      callStatus:        "new",
      status: "pending",
    }).returning();

    await notifyNewOrder({
      orderId: newOrder[0]!.id,
      customerName: payload.customerName,
      phone: payload.shippingAddress.phone,
      total: payload.total,
      shippingFee: payload.shippingFee,
      items: payload.items,
    }).catch((error) => console.error("Telegram order notification failed:", error));

    res.status(201).json(newOrder[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid order data", details: error.errors });
    }
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// GET /api/orders/:id — Get order by ID
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);

    if (!order.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order[0]);
  } catch (error) {
    console.error("Order fetch error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// PATCH /api/orders/:id/guest-phone — Save guest phone after order confirmation
router.patch("/orders/:id/guest-phone", async (req, res) => {
  try {
    const { id } = req.params;
    const { guestPhone } = z.object({ guestPhone: z.string().min(8) }).parse(req.body);
    const updated = await db.update(ordersTable).set({ guestPhone, updatedAt: new Date() })
      .where(eq(ordersTable.id, id)).returning();
    if (!updated.length) { res.status(404).json({ error: "Order not found" }); return; }
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// GET /api/orders — List all orders (admin only)
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const orders = await db
      .select()
      .from(ordersTable)
      .limit(Number(limit) || 10)
      .offset(Number(offset) || 0);

    res.json(orders);
  } catch (error) {
    console.error("Orders list error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
