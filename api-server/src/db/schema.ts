import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, pgEnum, jsonb, index, uniqueIndex, serial, boolean } from "drizzle-orm/pg-core";
import { z } from "zod";

const productVariantSchema = z.object({
  color: z.string().min(1),
  hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).nullable().optional(),
  images: z.array(z.string()).default([]),
});

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum          = pgEnum("user_role", ["user", "admin"]);
export const orderStatusEnum       = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);
export const customOrderStatusEnum = pgEnum("custom_order_status", ["pending", "processing", "done", "cancelled"]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersTable = pgTable("users", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email:        text("email").notNull().unique(),
  name:         text("name").notNull(),
  passwordHash: text("password_hash"),
  googleId:     text("google_id").unique(),
  avatarUrl:    text("avatar_url"),
  role:         userRoleEnum("role").notNull().default("user"),
  phone:        text("phone"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("users_email_idx").on(t.email),
  uniqueIndex("users_google_id_idx").on(t.googleId),
]);

export const insertUserSchema = z.object({
  email:        z.string().email(),
  name:         z.string().min(1),
  passwordHash: z.string().nullable().optional(),
  googleId:     z.string().nullable().optional(),
  avatarUrl:    z.string().nullable().optional(),
  role:         z.enum(["user", "admin"]).optional(),
  phone:        z.string().nullable().optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── Refresh Tokens ───────────────────────────────────────────────────────────
export const refreshTokensTable = pgTable("refresh_tokens", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:    text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("refresh_tokens_user_idx").on(t.userId),
  uniqueIndex("refresh_tokens_hash_idx").on(t.tokenHash),
]);

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsTable = pgTable("products", {
  id:            serial("id").primaryKey(),
  name:          text("name").notNull(),
  nameAr:        text("name_ar").notNull().default(""),
  description:   text("description").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  price:         integer("price").notNull(),
  originalPrice: integer("original_price"),
  category:      text("category").notNull(),
  badge:         text("badge"),
  sizes:         text("sizes").array().notNull().default(sql`'{}'::text[]`),
  colors:        text("colors").array().notNull().default(sql`'{}'::text[]`),
  images:        text("images").array().notNull().default(sql`'{}'::text[]`),
  variants:      jsonb("variants").$type<Array<z.infer<typeof productVariantSchema>>>().notNull().default(sql`'[]'::jsonb`),
  inStock:       boolean("in_stock").notNull().default(true),
  season:        text("season"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("products_category_idx").on(t.category),
  index("products_in_stock_idx").on(t.inStock),
  index("products_season_idx").on(t.season),
]);

export type Product = typeof productsTable.$inferSelect;
export const insertProductSchema = z.object({
  name:          z.string().min(1),
  nameAr:        z.string().optional(),
  description:   z.string().optional(),
  descriptionAr: z.string().optional(),
  price:         z.number().int(),
  originalPrice: z.number().int().nullable().optional(),
  category:      z.string().min(1),
  badge:         z.string().nullable().optional(),
  sizes:         z.array(z.string()).optional(),
  colors:        z.array(z.string()).optional(),
  images:        z.array(z.string()).optional(),
  variants:      z.array(productVariantSchema).optional(),
  inStock:       z.boolean().optional(),
  season:        z.enum(["summer", "winter"]).nullable().optional(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersTable = pgTable("orders", {
  id:                text("id").primaryKey().$defaultFn(() => "ORD-" + crypto.randomUUID().slice(0, 8).toUpperCase()),
  userId:            text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  customerName:      text("customer_name").notNull(),
  customerEmail:     text("customer_email").notNull(),
  items:             jsonb("items").notNull(),
  subtotal:          integer("subtotal").notNull(),
  shippingFee:       integer("shipping_fee").notNull().default(0),
  total:             integer("total").notNull(),
  status:            orderStatusEnum("status").notNull().default("pending"),
  callStatus:        text("call_status").notNull().default("new"),
  adminNotes:        text("admin_notes"),
  shippingAddress:   jsonb("shipping_address"),
  couponCode:        text("coupon_code"),
  couponDiscount:    integer("coupon_discount").notNull().default(0),
  depositAmount:     integer("deposit_amount").notNull().default(0),
  paymentScreenshot: text("payment_screenshot"),
  vfSenderPhone:     text("vf_sender_phone"),
  guestPhone:        text("guest_phone"),
  createdAt:         timestamp("created_at").notNull().defaultNow(),
  updatedAt:         timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("orders_user_idx").on(t.userId),
  index("orders_status_idx").on(t.status),
  index("orders_created_idx").on(t.createdAt),
]);

export type Order = typeof ordersTable.$inferSelect;

// ─── Custom Orders ────────────────────────────────────────────────────────────
export const customOrdersTable = pgTable("custom_orders", {
  id:            text("id").primaryKey().$defaultFn(() => "CO-" + crypto.randomUUID().slice(0, 6).toUpperCase()),
  userId:        text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  customerName:  text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  itemType:      text("item_type").notNull(),
  size:          text("size").notNull(),
  color:         text("color").notNull(),
  designUrl:     text("design_url"),
  details:       text("details").notNull(),
  status:        customOrderStatusEnum("status").notNull().default("pending"),
  adminNotes:    text("admin_notes"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("custom_orders_user_idx").on(t.userId),
  index("custom_orders_status_idx").on(t.status),
  index("custom_orders_created_idx").on(t.createdAt),
]);

export type CustomOrder = typeof customOrdersTable.$inferSelect;

// ─── Contact Messages ─────────────────────────────────────────────────────────
export const contactMessagesTable = pgTable("contact_messages", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:         text("name").notNull(),
  email:        text("email").notNull(),
  subject:      text("subject").notNull(),
  message:      text("message").notNull(),
  adminReply:   text("admin_reply"),
  repliedAt:    timestamp("replied_at"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("contact_messages_created_idx").on(t.createdAt),
]);

export type ContactMessage = typeof contactMessagesTable.$inferSelect;

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistItemsTable = pgTable("wishlist_items", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:    text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("wishlist_user_product_idx").on(t.userId, t.productId),
  index("wishlist_user_idx").on(t.userId),
]);

export type WishlistItem = typeof wishlistItemsTable.$inferSelect;

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const couponsTable = pgTable("coupons", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code:         text("code").notNull().unique(),
  discountRate: integer("discount_rate").notNull(),
  description:  text("description"),
  isActive:     boolean("is_active").notNull().default(true),
  maxUses:      integer("max_uses"),
  usesCount:    integer("uses_count").notNull().default(0),
  expiresAt:    timestamp("expires_at"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("coupons_code_idx").on(t.code),
]);

export type Coupon = typeof couponsTable.$inferSelect;

// ─── OAuth Temporary Storage (For Serverless Compatibility) ──────────────────
export const oauthStatesTable = pgTable("oauth_states", {
  state:     text("state").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const oauthCodesTable = pgTable("oauth_codes", {
  code:         text("code").primaryKey(),
  accessToken:  text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt:    timestamp("expires_at").notNull(),
});
