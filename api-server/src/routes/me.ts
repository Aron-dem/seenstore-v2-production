import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { usersTable, wishlistItemsTable, customOrdersTable, ordersTable } from "@workspace/db/schema";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// helper: normalise Express 5 params which may be string | string[]
function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

router.get("/me/wishlist", requireAuth, async (req, res) => {
  const items = await db.select()
    .from(wishlistItemsTable)
    .where(eq(wishlistItemsTable.userId, req.user!.sub));
  res.json({ items: items.map(i => i.productId) });
});

router.post("/me/wishlist", requireAuth, async (req, res) => {
  const { productId } = z.object({ productId: z.number().int().positive() }).parse(req.body);
  try {
    await db.insert(wishlistItemsTable).values({ userId: req.user!.sub, productId });
  } catch {
    // Already exists (unique constraint) — ignore
  }
  res.json({ success: true });
});

router.delete("/me/wishlist/:productId", requireAuth, async (req, res) => {
  const productId = parseInt(paramStr(req.params["productId"]) || "0", 10);
  await db.delete(wishlistItemsTable)
    .where(and(
      eq(wishlistItemsTable.userId, req.user!.sub),
      eq(wishlistItemsTable.productId, productId),
    ));
  res.json({ success: true });
});

// ─── Profile ──────────────────────────────────────────────────────────────────

router.patch("/me/profile", requireAuth, async (req, res) => {
  const schema = z.object({
    name:  z.string().min(2).max(60).optional(),
    phone: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }
  await db.update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.sub));
  res.json({ success: true });
});

// ─── My Custom Orders ─────────────────────────────────────────────────────────

router.get("/me/custom-orders", requireAuth, async (req, res) => {
  const orders = await db.select().from(customOrdersTable)
    .where(eq(customOrdersTable.userId, req.user!.sub));
  res.json({ orders });
});

router.get("/me/orders", requireAuth, async (req, res) => {
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, req.user!.sub));
  res.json(orders);
});

export default router;
