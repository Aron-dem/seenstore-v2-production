import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { contactMessagesTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth.js";

const router: IRouter = Router();

// POST /api/messages — public contact form submission
router.post("/messages", async (req, res) => {
  const schema = z.object({
    name:    z.string().min(1).max(80),
    email:   z.string().email().max(200),
    subject: z.string().min(1).max(150),
    message: z.string().min(1).max(3000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }
  const [msg] = await db.insert(contactMessagesTable).values(parsed.data).returning();
  res.status(201).json({ success: true, id: msg!.id });
});

// GET /api/admin/messages — list all messages
router.get("/admin/messages", requireAdmin, async (req, res) => {
  const page  = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt((req.query["limit"] as string) ?? "20", 10)));
  const offset = (page - 1) * limit;

  const messages = await db
    .select()
    .from(contactMessagesTable)
    .orderBy(desc(contactMessagesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(contactMessagesTable);
  const total = countRow?.total ?? 0;

  res.json({ messages, total, page, limit });
});

// PATCH /api/admin/messages/:id/reply — admin replies to a message
router.patch("/admin/messages/:id/reply", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  const schema = z.object({ reply: z.string().min(1).max(3000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }
  const [msg] = await db
    .update(contactMessagesTable)
    .set({ adminReply: parsed.data.reply, repliedAt: new Date() })
    .where(eq(contactMessagesTable.id, id))
    .returning();
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }
  res.json({ success: true, message: msg });
});

// DELETE /api/admin/messages/:id
router.delete("/admin/messages/:id", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, id));
  res.json({ success: true });
});

export default router;
