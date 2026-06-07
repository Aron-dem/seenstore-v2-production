import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { customOrdersTable } from "@workspace/db/schema";
import { optionalAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

const createCustomOrderSchema = z.object({
  customerName:  z.string().min(2).max(80),
  customerEmail: z.string().email(),
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

  const [order] = await db.insert(customOrdersTable).values({
    ...parsed.data,
    userId: req.user?.sub ?? null,
    designUrl: parsed.data.designUrl ?? null,
  }).returning();

  res.status(201).json({ order });
});

export default router;
