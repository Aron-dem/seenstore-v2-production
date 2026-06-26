import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";
import { useLang } from "../context/LanguageContext";
import { api, ApiError } from "../lib/apiClient";
import {
  ShieldCheck, Clock, Loader2, Eye, X, Package,
  Users, ShoppingBag, Palette, TrendingUp, RefreshCw, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, UserCog,
  Plus, Edit2, Check, Image, Upload, Store, MessageSquare, Reply, CheckCircle2,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deriveProductVariants, getColorHex, normalizeColorName, type ColorVariant } from "../lib/productVariants";

// ─── Types ────────────────────────────────────────────────────────────────────
type CustomOrder = {
  id: string; userId: string | null; customerName: string; customerEmail: string;
  customerPhone?: string | null;
  itemType: string; size: string; color: string; designUrl: string | null;
  details: string; status: "pending" | "processing" | "done" | "cancelled";
  adminNotes: string | null; createdAt: string; updatedAt: string;
};

type AdminUser = {
  id: string; name: string; email: string; role: "user" | "admin";
  phone: string | null; createdAt: string;
};

type Stats = {
  totalUsers: number; totalOrders: number; totalCustomOrders: number;
  pendingCustomOrders: number; totalRevenue: number;
  totalProducts: number; productsInStock: number; newUsersWeek: number;
};

type Product = {
  id: number; name: string; nameAr: string;
  description: string; descriptionAr: string;
  price: number; originalPrice: number | null;
  category: string; badge: string | null;
  sizes: string[]; colors: string[]; images: string[];
  variants?: ColorVariant[];
  inStock: boolean; soldOut: boolean; season: string | null; createdAt: string;
};

type ProductVariantForm = {
  color: string;
  hex: string;
  imagesText: string;
};

type ProductForm = {
  name: string; nameAr: string; price: string; originalPrice: string;
  category: string; badge: string;
  sizes: string[]; colors: string; images: string[];
  variants: ProductVariantForm[];
  description: string; descriptionAr: string; inStock: boolean; soldOut: boolean;
  season: "" | "summer" | "winter";
};

const INIT_FORM: ProductForm = {
  name: "", nameAr: "", price: "", originalPrice: "",
  category: "T-Shirts", badge: "", sizes: [], colors: "",
  images: [], variants: [], description: "", descriptionAr: "", inStock: true, soldOut: false,
  season: "",
};

const CATEGORIES = ["T-Shirts", "Pants", "Hoodies"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const CUSTOM_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800"   },
  done:       { label: "Done",       color: "bg-green-100 text-green-800"  },
  cancelled:  { label: "Cancelled",  color: "bg-red-100 text-red-800"      },
};

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f3f4f6' width='80' height='80'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='10' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E";

function splitColorInput(value: string): string[] {
  return value.split(",").map((color) => color.trim()).filter(Boolean);
}

function toVariantForms(colorsInput: string, images: string[], variants?: ColorVariant[]): ProductVariantForm[] {
  const colors = splitColorInput(colorsInput);
  const derived = variants && variants.length > 0
    ? variants
    : deriveProductVariants({ colors, images, variants: [] });

  return colors.map((color) => {
    const existing = derived.find((variant) => normalizeColorName(variant.color) === normalizeColorName(color));
    return {
      color,
      hex: existing?.hex ?? getColorHex(color),
      imagesText: (existing?.images ?? []).join("\n"),
    };
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ContactMessage = {
  id: string; name: string; email: string; subject: string;
  message: string; adminReply: string | null; repliedAt: string | null; createdAt: string;
};

type OrderItem = {
  productId: number;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
};

type ShippingAddress = {
  fullName: string;
  phone: string;
  governorate: string;
  city?: string;
  street?: string;
  postalCode?: string;
};

type Order = {
  id: string; userId: string | null;
  customerName: string; customerEmail: string;
  subtotal: number; shippingFee: number; total: number;
  couponCode: string | null; couponDiscount: number;
  depositAmount: number; paymentScreenshot: string | null;
  vfSenderPhone: string | null; guestPhone: string | null;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress | null;
  adminNotes?: string | null;
  callStatus?: "new" | "called" | "confirmed" | "no_answer" | "cancelled";
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string; updatedAt: string;
};

type Coupon = {
  id: string; code: string; discountRate: number;
  description: string | null; isActive: boolean;
  maxUses: number | null; usesCount: number;
  expiresAt: string | null; createdAt: string;
};

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800"    },
  shipped:    { label: "Shipped",    color: "bg-indigo-100 text-indigo-800" },
  delivered:  { label: "Delivered",  color: "bg-green-100 text-green-800"  },
  cancelled:  { label: "Cancelled",  color: "bg-red-100 text-red-800"      },
};

const CALL_STATUS: Record<string, { label: string; color: string }> = {
  new:       { label: "New",        color: "bg-gray-100 text-gray-700" },
  called:    { label: "Called",     color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmed",  color: "bg-green-100 text-green-800" },
  no_answer: { label: "No Answer",  color: "bg-yellow-100 text-yellow-800" },
  cancelled: { label: "Cancelled",  color: "bg-red-100 text-red-800" },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "products" | "orders" | "custom-orders" | "users" | "messages" | "coupons";

// ─── Color Detection ──────────────────────────────────────────────────────────
const NAMED_COLORS = [
  { name: "Black",        hex: "#0A0A0A", r:  10, g:  10, b:  10 },
  { name: "Charcoal",     hex: "#36454F", r:  54, g:  69, b:  79 },
  { name: "Dark Gray",    hex: "#424242", r:  66, g:  66, b:  66 },
  { name: "Gray",         hex: "#9E9E9E", r: 158, g: 158, b: 158 },
  { name: "Light Gray",   hex: "#BDBDBD", r: 189, g: 189, b: 189 },
  { name: "Dark Brown",   hex: "#3D2314", r:  61, g:  35, b:  20 },
  { name: "Brown",        hex: "#795548", r: 121, g:  85, b:  72 },
  { name: "Camel",        hex: "#C19A6B", r: 193, g: 154, b: 107 },
  { name: "Tan",          hex: "#D2B48C", r: 210, g: 180, b: 140 },
  { name: "Beige",        hex: "#D7C9A7", r: 215, g: 201, b: 167 },
  { name: "Off White",    hex: "#F5F0E8", r: 245, g: 240, b: 232 },
  { name: "White",        hex: "#FFFFFF", r: 255, g: 255, b: 255 },
  { name: "Cream",        hex: "#FFFDD0", r: 255, g: 253, b: 208 },
  { name: "Burgundy",     hex: "#800020", r: 128, g:   0, b:  32 },
  { name: "Maroon",       hex: "#6B1F2F", r: 107, g:  31, b:  47 },
  { name: "Red",          hex: "#C62828", r: 198, g:  40, b:  40 },
  { name: "Orange",       hex: "#E64A19", r: 230, g:  74, b:  25 },
  { name: "Mustard",      hex: "#C8960C", r: 200, g: 150, b:  12 },
  { name: "Yellow",       hex: "#F9A825", r: 249, g: 168, b:  37 },
  { name: "Olive",        hex: "#6D6C31", r: 109, g: 108, b:  49 },
  { name: "Forest Green", hex: "#2E5825", r:  46, g:  88, b:  37 },
  { name: "Green",        hex: "#388E3C", r:  56, g: 142, b:  60 },
  { name: "Mint",         hex: "#A8D5BA", r: 168, g: 213, b: 186 },
  { name: "Navy",         hex: "#1A237E", r:  26, g:  35, b: 126 },
  { name: "Blue",         hex: "#1565C0", r:  21, g: 101, b: 192 },
  { name: "Light Blue",   hex: "#4FC3F7", r:  79, g: 195, b: 247 },
  { name: "Purple",       hex: "#6A1B9A", r: 106, g:  27, b: 154 },
  { name: "Lavender",     hex: "#9575CD", r: 149, g: 117, b: 205 },
  { name: "Pink",         hex: "#E91E63", r: 233, g:  30, b:  99 },
  { name: "Light Pink",   hex: "#F8BBD0", r: 248, g: 187, b: 208 },
] as const;

function rgbToColorName(r: number, g: number, b: number): { name: string; hex: string } {
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const d = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  const detectedHex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  return { name: best.name, hex: detectedHex };
}

function detectImageColor(url: string): Promise<{ name: string; hex: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const SIZE = 120;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
        let tR = 0, tG = 0, tB = 0, count = 0;
        const y0 = Math.round(SIZE * 0.2), y1 = Math.round(SIZE * 0.8);
        const x0 = Math.round(SIZE * 0.2), x1 = Math.round(SIZE * 0.8);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * SIZE + x) * 4;
            const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
            if (r > 235 && g > 235 && b > 235) continue; // skip white/light bg
            tR += r; tG += g; tB += b; count++;
          }
        }
        if (count === 0) { resolve({ name: "Black", hex: "#0A0A0A" }); return; }
        resolve(rgbToColorName(Math.round(tR / count), Math.round(tG / count), Math.round(tB / count)));
      } catch { resolve({ name: "Black", hex: "#0A0A0A" }); }
    };
    img.onerror = () => resolve({ name: "Black", hex: "#0A0A0A" });
    img.src = url;
  });
}

// ─── Custom Order Modal ───────────────────────────────────────────────────────
function OrderModal({ order, onClose, isRTL, onUpdate }: {
  order: CustomOrder; onClose: () => void; isRTL: boolean;
  onUpdate: (id: string, data: Partial<CustomOrder>) => void;
}) {
  const [status, setStatus] = useState(order.status);
  const [notes,  setNotes]  = useState(order.adminNotes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/custom-orders/${order.id}`, { status, adminNotes: notes });
      onUpdate(order.id, { status, adminNotes: notes });
      onClose();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 text-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-black text-white p-5 flex justify-between items-center flex-shrink-0">
          <div>
            <p className="text-gray-400 text-xs">Custom Design Order</p>
            <h3 className="font-heading font-bold text-lg">{order.id}</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Name", order.customerName], ["Phone", order.customerPhone ?? "—"],
              ["Item", order.itemType],      ["Size", order.size],
              ["Color", order.color],        ["Date", new Date(order.createdAt).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k}><p className="text-gray-400 text-xs mb-0.5">{k}</p><p className="font-semibold truncate">{v}</p></div>
            ))}
          </div>
          {order.details && (
            <div><p className="text-xs text-gray-400 mb-1">Details</p>
              <p className="text-sm bg-zinc-800 rounded-xl p-3 text-gray-300">{order.details}</p></div>
          )}
          {order.designUrl && (
            <div><p className="text-xs text-gray-400 mb-2">Design</p>
              <img src={order.designUrl} alt="Design" className="max-h-40 rounded-xl object-contain bg-zinc-800 p-2 w-full" /></div>
          )}
          <div>
            <p className="text-xs text-gray-400 mb-2">Status</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(CUSTOM_STATUS).map(s => (
                <button key={s} onClick={() => setStatus(s as any)}
                  className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${status === s ? "bg-[#E63946] text-white border-[#E63946]" : "border-zinc-700 text-gray-300 hover:border-white"}`}>
                  {CUSTOM_STATUS[s]!.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Admin Notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none resize-none bg-zinc-800 text-white placeholder:text-gray-500" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-[#E63946] transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RegularOrderModal({ order, onClose, onSave }: {
  order: Order;
  onClose: () => void;
  onSave: (orderId: string, patch: Partial<Order>) => void;
}) {
  const [status, setStatus] = useState<Order["status"]>(order.status);
  const [callStatus, setCallStatus] = useState<Order["callStatus"]>(order.callStatus ?? "new");
  const [adminNotes, setAdminNotes] = useState(order.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const address = order.shippingAddress;

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${order.id}`, { status, callStatus, adminNotes });
      onSave(order.id, { status, callStatus, adminNotes });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 text-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-black text-white p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-xs">Regular Order</p>
            <h3 className="font-heading font-bold text-lg">{order.id}</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-5">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-2">Customer</p>
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-gray-300 text-xs">{order.customerEmail}</p>
              <p className="text-gray-300 text-xs mt-1">{address?.phone || order.guestPhone || "—"}</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-2">Shipping Address</p>
              <p className="text-sm text-gray-200">{address?.street || "—"}</p>
              <p className="text-xs text-gray-400 mt-1">{[address?.city, address?.governorate].filter(Boolean).join("، ") || "—"}</p>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-3">Items</p>
            <div className="space-y-3">
              {(order.items ?? []).map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex items-start justify-between gap-4 border-b border-zinc-700/70 pb-3 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-3">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <p className="font-bold whitespace-nowrap">{item.price * item.quantity} EGP</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-zinc-800 rounded-xl p-4"><p className="text-gray-400 text-xs">Subtotal</p><p className="font-bold mt-1">{order.subtotal} EGP</p></div>
            <div className="bg-zinc-800 rounded-xl p-4"><p className="text-gray-400 text-xs">Shipping</p><p className="font-bold mt-1">{order.shippingFee} EGP</p></div>
            <div className="bg-zinc-800 rounded-xl p-4"><p className="text-gray-400 text-xs">Total</p><p className="font-bold mt-1 text-[#E63946]">{order.total} EGP</p></div>
          </div>

          {order.couponCode && (
            <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-4 text-sm">
              <p className="font-semibold text-green-400">Coupon: {order.couponCode}</p>
              <p className="text-gray-300 mt-1">Discount: {order.couponDiscount} EGP</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Order Status</p>
              <select value={status} onChange={(e) => setStatus(e.target.value as Order["status"])}
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-zinc-800 text-white focus:border-[#E63946] focus:outline-none">
                {Object.entries(ORDER_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Call Status</p>
              <select value={callStatus} onChange={(e) => setCallStatus(e.target.value as Order["callStatus"])}
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-zinc-800 text-white focus:border-[#E63946] focus:outline-none">
                {Object.entries(CALL_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">Admin Notes</p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none resize-none bg-zinc-800 text-white placeholder:text-gray-500"
              placeholder="Write call notes, delivery notes, or confirmation notes"
            />
          </div>

          <button onClick={save} disabled={saving}
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-[#E63946] transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }: {
  product: Product | null; onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const initialColors = product ? product.colors.join(", ") : INIT_FORM.colors;
  const initialImages = product?.images ?? INIT_FORM.images;
  const [form,       setForm]       = useState<ProductForm>(product ? {
    name: product.name, nameAr: product.nameAr, price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    category: product.category, badge: product.badge ?? "",
    sizes: product.sizes, colors: initialColors,
    images: initialImages,
    variants: toVariantForms(initialColors, initialImages, product.variants),
    description: product.description,
    descriptionAr: product.descriptionAr, inStock: product.inStock,
    season: (product.season as "" | "summer" | "winter") ?? "",
  } : INIT_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [urlInput,   setUrlInput]   = useState("");
  const [uploading,  setUploading]  = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  const set = (k: keyof ProductForm, v: any) => setForm(f => ({ ...f, [k]: v }));
  const syncVariants = (colorsValue: string, imagesValue: string[], existingVariants = form.variants) => {
    setForm((prev) => ({
      ...prev,
      colors: colorsValue,
      images: imagesValue,
      variants: toVariantForms(
        colorsValue,
        imagesValue,
        existingVariants.map((variant) => ({
          color: variant.color,
          hex: variant.hex,
          images: variant.imagesText.split("\n").map((value) => value.trim()).filter(Boolean),
        })),
      ),
    }));
  };
  const updateVariant = (color: string, patch: Partial<ProductVariantForm>) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        normalizeColorName(variant.color) === normalizeColorName(color)
          ? { ...variant, ...patch }
          : variant,
      ),
    }));
  };
  const toggleSize = (s: string) => set("sizes", form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);
  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    try {
      new URL(u);
      syncVariants(form.colors, [...form.images, u]);
      setUrlInput("");
    } catch {
      setError("Invalid URL");
    }
  };
  const removeImg = (i: number) => syncVariants(form.colors, form.images.filter((_, idx) => idx !== i));

  const uploadFiles = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true); setError("");
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch("/api/admin/upload/image", { method: "POST", body: fd, credentials: "include" });
        if (!res.ok) { const txt = await res.text(); throw new Error(`Upload failed: ${txt}`); }
        const { url } = await res.json() as { url: string };
        uploadedUrls.push(url);
      }

      // Append images immediately without complex color detection to avoid race conditions
      setForm(prev => {
        const newImages = [...prev.images, ...uploadedUrls];
        const existingColors = splitColorInput(prev.colors);
        const existingVariantData = prev.variants.map(v => ({
          color: v.color, hex: v.hex,
          images: v.imagesText.split("\n").map(s => s.trim()).filter(Boolean),
        }));
        const newVariants = toVariantForms(prev.colors, newImages, existingVariantData);
        return { ...prev, images: newImages, variants: newVariants };
      });

      // Optional: detect color in background for the first image only
      if (uploadedUrls[0]) {
        detectImageColor(uploadedUrls[0]).then(({ name, hex }) => {
          setForm(prev => {
            const existingColors = splitColorInput(prev.colors);
            if (!existingColors.some(c => normalizeColorName(c) === normalizeColorName(name))) {
              const newColorsStr = prev.colors ? `${prev.colors}, ${name}` : name;
              const existingVariantData = prev.variants.map(v => ({
                color: v.color, hex: v.hex,
                images: v.imagesText.split("\n").map(s => s.trim()).filter(Boolean),
              }));
              const newVariants = toVariantForms(newColorsStr, prev.images, existingVariantData);
              const vIdx = newVariants.findIndex(v => normalizeColorName(v.color) === normalizeColorName(name));
              if (vIdx !== -1 && !newVariants[vIdx]!.hex) {
                newVariants[vIdx]!.hex = hex;
              }
              return { ...prev, colors: newColorsStr, variants: newVariants };
            }
            return prev;
          });
        }).catch(() => {});
      }
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) { setError("Name, price, and category are required"); return; }
    const price = parseInt(form.price, 10);
    if (isNaN(price) || price <= 0) { setError("Price must be a positive number"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name:          form.name.trim(),
        nameAr:        form.nameAr.trim(),
        price,
        originalPrice: form.originalPrice ? parseInt(form.originalPrice, 10) : null,
        category:      form.category,
        badge:         form.badge || null,
        sizes:         form.sizes,
        colors:        splitColorInput(form.colors),
        images:        form.images,
        variants:      form.variants
          .filter((variant) => variant.color.trim())
          .map((variant) => ({
            color: variant.color.trim(),
            hex: variant.hex.trim() || null,
            images: variant.imagesText.split("\n").map((value) => value.trim()).filter(Boolean),
          })),
        description:   form.description.trim(),
        descriptionAr: form.descriptionAr.trim(),
        inStock:       form.inStock,
        season:        form.season || null,
      };
      let saved: Product;
      if (product) {
        const res = await api.patch<{ product: Product }>(`/admin/products/${product.id}`, payload);
        saved = res.product;
      } else {
        const res = await api.post<{ product: Product }>("/admin/products", payload);
        saved = res.product;
      }
      onSaved(saved);
      onClose();
    } catch (e: any) { setError(e instanceof ApiError ? e.message : "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 text-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="font-heading font-bold text-lg">{product ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {error && <p className="text-red-400 text-sm bg-red-900/30 rounded-xl p-3">{error}</p>}

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Name (EN) *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Product name"
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white placeholder:text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Name (AR)</label>
              <input value={form.nameAr} onChange={e => set("nameAr", e.target.value)} placeholder="اسم المنتج" dir="rtl"
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white placeholder:text-gray-500" />
            </div>
          </div>

          {/* Price + Category + Badge */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Price (EGP) *</label>
              <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="299" min={1}
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white placeholder:text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Original Price</label>
              <input type="number" value={form.originalPrice} onChange={e => set("originalPrice", e.target.value)} placeholder="399" min={1}
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white placeholder:text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Badge</label>
              <select value={form.badge} onChange={e => set("badge", e.target.value)}
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white">
                <option value="">None</option>
                <option value="NEW">NEW</option>
                <option value="SALE">SALE</option>
                <option value="SOLD OUT">SOLD OUT</option>
              </select>
            </div>
          </div>

          {/* Category + Season */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Season</label>
              <select value={form.season} onChange={e => set("season", e.target.value)}
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white">
                <option value="">— No Season —</option>
                <option value="summer">☀️ Summer</option>
                <option value="winter">❄️ Winter</option>
              </select>
            </div>
          </div>

          {/* Status Switches */}
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${form.inStock ? "bg-black" : "bg-gray-300"}`}
                onClick={() => set("inStock", !form.inStock)}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.inStock ? "left-7" : "left-1"}`} />
              </div>
              <span className="text-sm font-semibold">{form.inStock ? "In Stock" : "No Stock"}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${form.soldOut ? "bg-[#E63946]" : "bg-gray-300"}`}
                onClick={() => set("soldOut", !form.soldOut)}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.soldOut ? "left-7" : "left-1"}`} />
              </div>
              <span className="text-sm font-semibold">{form.soldOut ? "Sold Out" : "Available"}</span>
            </label>
          </div>

          {/* Sizes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${form.sizes.includes(s) ? "bg-[#E63946] text-white border-[#E63946]" : "border-zinc-700 text-gray-300 hover:border-white hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Colors (comma-separated)</label>
            <input value={form.colors} onChange={e => syncVariants(e.target.value, form.images)} placeholder="Black, White, Grey, Navy"
              className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white placeholder:text-gray-500" />
          </div>

          {/* Variant swatches */}
          {form.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase block">Color Variants</label>
              <div className="space-y-3">
                {form.variants.map((variant) => (
                  <div key={variant.color} className="border border-zinc-700 rounded-xl p-4 bg-zinc-950/50">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-8 h-8 rounded-full border-2 border-zinc-600" style={{ backgroundColor: variant.hex || getColorHex(variant.color) }} />
                      <p className="font-semibold text-sm flex-1">{variant.color}</p>
                      <input
                        value={variant.hex}
                        onChange={(e) => updateVariant(variant.color, { hex: e.target.value })}
                        placeholder="#000000"
                        className="w-32 border-2 border-zinc-700 rounded-xl px-3 py-2 text-xs focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white"
                      />
                    </div>
                    <textarea
                      value={variant.imagesText}
                      onChange={(e) => updateVariant(variant.color, { imagesText: e.target.value })}
                      rows={3}
                      placeholder="One image URL per line for this color variant"
                      className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2 text-xs focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white placeholder:text-gray-500 resize-none"
                    />
                    <p className="text-[11px] text-gray-500 mt-2">Leave empty to fall back to automatic image matching from filenames.</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description (EN)</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Product description..."
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none resize-none bg-zinc-800 text-white placeholder:text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Description (AR)</label>
              <textarea value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} rows={3} placeholder="وصف المنتج..." dir="rtl"
                className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none resize-none bg-zinc-800 text-white placeholder:text-gray-500" />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block flex items-center gap-1">
              <Image className="w-3.5 h-3.5" /> Images
            </label>

            {/* Existing images */}
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.images.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-zinc-700 group">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                    <button onClick={() => removeImg(i)}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add by URL */}
            <div className="flex gap-2 mb-2">
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addUrl()}
                placeholder="Paste image URL..." type="url"
                className="flex-1 border-2 border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white placeholder:text-gray-500" />
              <button onClick={addUrl} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm font-semibold transition-colors text-white">
                Add URL
              </button>
            </div>

            {/* Upload file */}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { const files = e.target.files; if (files?.length) uploadFiles(files); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-zinc-600 hover:border-[#E63946] rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all w-full justify-center disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading..." : "Upload Images (select multiple)"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-zinc-700 font-semibold text-sm text-gray-300 hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-sm hover:bg-[#E63946] transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {product ? "Update Product" : "Create Product"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const { isRTL } = useLang();
  const [, setLocation] = useLocation();

  const [tab,           setTab]          = useState<Tab>("dashboard");
  const [stats,         setStats]        = useState<Stats | null>(null);
  const [customOrders,  setCustomOrders] = useState<CustomOrder[]>([]);
  const [users,         setUsers]        = useState<AdminUser[]>([]);
  const [products,      setProducts]     = useState<Product[]>([]);
  const [orders,        setOrders]       = useState<Order[]>([]);
  const [messages,      setMessages]     = useState<ContactMessage[]>([]);
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState("");
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [selectedRegularOrder, setSelectedRegularOrder] = useState<Order | null>(null);
  const [editProduct,   setEditProduct]  = useState<Product | null | undefined>(undefined);
  const [filterStatus,  setFilterStatus] = useState("all");
  const [page,          setPage]         = useState(1);
  const [total,         setTotal]        = useState(0);
  const [activeMsg,     setActiveMsg]    = useState<ContactMessage | null>(null);
  const [replyText,     setReplyText]    = useState("");
  const [replying,      setReplying]     = useState(false);
  const [coupons,       setCoupons]      = useState<Coupon[]>([]);
  const [couponForm,    setCouponForm]   = useState({ code: "", discountRate: "10", description: "", maxUses: "", expiresAt: "", isActive: true });
  const [couponFormOpen, setCouponFormOpen] = useState(false);
  const [couponSaving,  setCouponSaving] = useState(false);
  const [couponError,   setCouponError]  = useState("");

  const limit = 15;

  const fetchStats = useCallback(async () => {
    try { setStats(await api.get<Stats>("/admin/stats")); } catch { /* ignore */ }
  }, []);

  const fetchCustomOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const qs = `page=${page}&limit=${limit}${filterStatus !== "all" ? `&status=${filterStatus}` : ""}`;
      const d = await api.get<{ orders: CustomOrder[]; total: number }>(`/admin/custom-orders?${qs}`);
      setCustomOrders(d.orders); setTotal(d.total);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await api.get<{ users: AdminUser[]; total: number }>(`/admin/users?page=${page}&limit=${limit}`);
      setUsers(d.users); setTotal(d.total);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [page]);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await api.get<{ products: Product[]; total: number }>(`/admin/products?limit=200`);
      setProducts(d.products); setTotal(d.total);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await api.get<{ orders: Order[]; total: number }>(`/admin/orders?page=${page}&limit=${limit}`);
      setOrders(d.orders); setTotal(d.total);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [page]);

  const fetchMessages = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await api.get<{ messages: ContactMessage[]; total: number }>(`/admin/messages?limit=50`);
      setMessages(d.messages); setTotal(d.total);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  const fetchCoupons = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await api.get<{ coupons: Coupon[] }>("/admin/coupons");
      setCoupons(d.coupons);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  const saveCoupon = async () => {
    if (!couponForm.code || !couponForm.discountRate) { setCouponError("Code and discount rate are required"); return; }
    const rate = parseInt(couponForm.discountRate, 10);
    if (isNaN(rate) || rate < 1 || rate > 100) { setCouponError("Discount rate must be 1–100"); return; }
    setCouponSaving(true); setCouponError("");
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discountRate: rate,
        description: couponForm.description.trim() || null,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses, 10) : null,
        expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : null,
        isActive: couponForm.isActive,
      };
      const { coupon } = await api.post<{ coupon: Coupon }>("/admin/coupons", payload);
      setCoupons(prev => [coupon, ...prev]);
      setCouponFormOpen(false);
      setCouponForm({ code: "", discountRate: "10", description: "", maxUses: "", expiresAt: "", isActive: true });
    } catch (e: any) { setCouponError(e instanceof ApiError ? e.message : "Failed to save"); }
    finally { setCouponSaving(false); }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    await api.patch(`/admin/coupons/${coupon.id}`, { isActive: !coupon.isActive });
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await api.delete(`/admin/coupons/${id}`);
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const sendReply = async (msg: ContactMessage) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const { message: updated } = await api.patch<{ message: ContactMessage }>(`/admin/messages/${msg.id}/reply`, { reply: replyText });
      setMessages(prev => prev.map(m => m.id === msg.id ? updated : m));
      setActiveMsg(updated);
      setReplyText("");
    } catch { /* ignore */ } finally { setReplying(false); }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await api.delete(`/admin/messages/${id}`);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (activeMsg?.id === id) setActiveMsg(null);
  };


  useEffect(() => { if (isAdmin) fetchStats(); }, [isAdmin, fetchStats]);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "custom-orders") fetchCustomOrders();
    else if (tab === "orders") fetchOrders();
    else if (tab === "users") fetchUsers();
    else if (tab === "products") fetchProducts();
    else if (tab === "messages") fetchMessages();
    else if (tab === "coupons") fetchCoupons();
    setPage(1);
  }, [tab, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "custom-orders") fetchCustomOrders();
    else if (tab === "orders") fetchOrders();
    else if (tab === "users") fetchUsers();
  }, [page, filterStatus]);

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await api.delete(`/admin/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
    fetchStats();
  };

  // ─── Loading / Auth states ───────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );

  if (!currentUser || !isAdmin) return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-8xl font-heading font-bold text-zinc-800 mb-4">404</p>
        <h1 className="font-heading text-2xl font-bold mb-3">الصفحة مش موجودة</h1>
        <p className="text-gray-500 mb-8 text-sm">Page Not Found</p>
        <button onClick={() => setLocation("/")}
          className="bg-[#E63946] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors">
          Go Home
        </button>
      </motion.div>
    </div>
  );

  const totalPages = Math.ceil(total / limit);

  const SIDEBAR_TABS = [
    { key: "dashboard",     label: "Dashboard",      icon: TrendingUp    },
    { key: "products",      label: "Products",       icon: Store         },
    { key: "orders",        label: "Orders",         icon: ShoppingBag   },
    { key: "custom-orders", label: "Custom Orders",  icon: Palette       },
    { key: "coupons",       label: "Coupons",        icon: Tag           },
    { key: "users",         label: "Users",          icon: Users         },
    { key: "messages",      label: "Messages",       icon: MessageSquare },
  ] as { key: Tab; label: string; icon: any }[];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="bg-black border-b border-zinc-800 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#E63946]" />
          <span className="font-heading font-bold text-lg">SEENSTORE ADMIN</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">{currentUser.email}</span>
          <button onClick={() => setLocation("/")} className="text-gray-400 hover:text-white transition-colors text-xs px-3 py-1 border border-gray-700 rounded-lg">
            Back to Store
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-zinc-900 border-r border-zinc-800 min-h-[calc(100vh-56px)] p-4 hidden md:block sticky top-14 self-start">
          {SIDEBAR_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mb-1 transition-all ${tab === key ? "bg-[#E63946] text-white" : "text-gray-400 hover:bg-zinc-800"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </aside>

        {/* Mobile bottom tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex z-30">
          {SIDEBAR_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setPage(1); }}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-semibold transition-colors ${tab === key ? "text-[#E63946]" : "text-gray-500"}`}>
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6 max-w-6xl">

          {/* ── Dashboard ───────────────────────────────────────────── */}
          {tab === "dashboard" && stats && (
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Users",     value: stats.totalUsers,          icon: Users,      color: "bg-blue-900/40 text-blue-400"    },
                  { label: "Total Products",  value: stats.totalProducts,       icon: Store,      color: "bg-indigo-900/40 text-indigo-400" },
                  { label: "Custom Orders",   value: stats.totalCustomOrders,   icon: Palette,    color: "bg-purple-900/40 text-purple-400" },
                  { label: "Pending Orders",  value: stats.pendingCustomOrders, icon: Clock,      color: "bg-yellow-900/40 text-yellow-400" },
                  { label: "New Users/Week",  value: stats.newUsersWeek,        icon: Users,      color: "bg-cyan-900/40 text-cyan-400"     },
                  { label: "Products in Stock",value: stats.productsInStock,    icon: Package,    color: "bg-green-900/40 text-green-400"   },
                  { label: "Regular Orders",  value: stats.totalOrders,         icon: ShoppingBag,color: "bg-orange-900/40 text-orange-400" },
                  { label: "Revenue (EGP)",   value: stats.totalRevenue,        icon: TrendingUp, color: "bg-emerald-900/40 text-emerald-400"},
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-heading font-bold">{value.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Products ─────────────────────────────────────────────── */}
          {tab === "products" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold">Products</h2>
                <div className="flex gap-2">
                  <button onClick={fetchProducts} className="p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button onClick={() => setEditProduct(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 bg-red-900/30 rounded-xl p-4 mb-4 text-sm">{error}</p>}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No products yet</p>
                  <button onClick={() => setEditProduct(null)} className="mt-4 bg-black text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    Add First Product
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-800 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                          {["", "Name", "Price", "Category", "Badge", "Sizes", "Stock", ""].map((h, i) => (
                            <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-zinc-800/60 transition-colors">
                            <td className="px-4 py-3">
                              <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={p.images[0] ?? PLACEHOLDER} alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold line-clamp-1 max-w-[180px]">{p.name}</p>
                              {p.nameAr && <p className="text-gray-400 text-xs" dir="rtl">{p.nameAr}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold">{p.price} EGP</p>
                              {p.originalPrice && <p className="text-gray-400 text-xs line-through">{p.originalPrice}</p>}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{p.category}</td>
                            <td className="px-4 py-3">
                              {p.badge ? (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${p.badge === "SALE" ? "bg-[#E63946]" : "bg-black"}`}>{p.badge}</span>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{p.sizes.slice(0, 3).join(", ")}{p.sizes.length > 3 ? "..." : ""}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-center ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                  {p.inStock ? "In Stock" : "No Stock"}
                                </span>
                                {p.soldOut && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-center bg-orange-100 text-orange-700">
                                    Sold Out
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => setEditProduct(p)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteProduct(p.id)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Regular Orders ───────────────────────────────────────── */}
          {tab === "orders" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold">Orders</h2>
                  {stats && <p className="text-sm text-gray-500 mt-1">{stats.totalOrders} total orders · {stats.totalRevenue.toLocaleString()} EGP revenue</p>}
                </div>
                <button onClick={fetchOrders} className="p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {error && <p className="text-red-400 bg-red-900/30 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-800 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>{["Order ID", "Customer", "Items", "Total", "Status", "Date", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {orders.map(order => {
                          const cfg = ORDER_STATUS[order.status] ?? ORDER_STATUS["pending"]!;
                          const phone = order.shippingAddress?.phone || order.guestPhone || "—";
                          return (
                            <tr key={order.id} className="hover:bg-zinc-800/60 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-mono font-bold text-[#E63946] text-xs">{order.id}</p>
                                {order.couponCode && <p className="text-green-600 text-xs mt-0.5">🏷 {order.couponCode} (−{order.couponDiscount} EGP)</p>}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-sm">{order.customerName}</p>
                                <p className="text-gray-400 text-xs truncate max-w-[130px]">{phone}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">
                                {(order.items ?? []).slice(0, 2).map((item) => item.name).join(", ") || "—"}
                                {(order.items?.length ?? 0) > 2 && <span> +{(order.items?.length ?? 0) - 2}</span>}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-sm">{order.total.toLocaleString()} EGP</p>
                                <p className="text-gray-500 text-xs">Shipping: {order.shippingFee} EGP</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => setSelectedRegularOrder(order)}
                                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                      <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
                      <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Custom Orders ────────────────────────────────────────── */}
          {tab === "custom-orders" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold">Custom Orders</h2>
                <button onClick={fetchCustomOrders} className="p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="flex gap-2 flex-wrap mb-6">
                {["all", "pending", "processing", "done", "cancelled"].map(s => (
                  <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterStatus === s ? "bg-[#E63946] text-white" : "bg-zinc-800 text-gray-300 border border-zinc-700 hover:border-zinc-400"}`}>
                    {s === "all" ? "All" : CUSTOM_STATUS[s]!.label}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-400 bg-red-900/30 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : customOrders.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-800 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>{["Order ID", "Customer", "Item", "Size", "Date", "Status", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {customOrders.map(order => {
                          const cfg = CUSTOM_STATUS[order.status] ?? CUSTOM_STATUS["pending"]!;
                          return (
                            <tr key={order.id} className="hover:bg-zinc-800/60 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-[#E63946] text-xs">{order.id}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold">{order.customerName}</p>
                                <p className="text-gray-400 text-xs truncate max-w-[140px]">{order.customerPhone ?? order.customerEmail}</p>
                              </td>
                              <td className="px-4 py-3 font-medium">{order.itemType}</td>
                              <td className="px-4 py-3 text-gray-600">{order.size}</td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={() => setSelectedOrder(order)}
                                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                      <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
                      <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Users ─────────────────────────────────────────────────── */}
          {tab === "users" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold">Users</h2>
                  {stats && (
                    <p className="text-sm text-gray-500 mt-1">
                      {stats.totalUsers} total · <span className="text-green-600 font-semibold">{stats.newUsersWeek} new this week</span>
                    </p>
                  )}
                </div>
                <button onClick={fetchUsers} className="p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {error && <p className="text-red-400 bg-red-900/30 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-800 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>{["Name", "Email", "Role", "Phone", "Joined", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-zinc-800/60 transition-colors">
                            <td className="px-4 py-3 font-semibold">{u.name}</td>
                            <td className="px-4 py-3 text-gray-600">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{u.phone ?? "—"}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={async () => {
                                  const newRole = u.role === "admin" ? "user" : "admin";
                                  await api.patch(`/admin/users/${u.id}/role`, { role: newRole });
                                  setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
                                }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors" title="Toggle role">
                                  <UserCog className="w-4 h-4" />
                                </button>
                                {u.id !== currentUser.id && (
                                  <button onClick={async () => {
                                    if (!confirm(`Delete user ${u.name}?`)) return;
                                    await api.delete(`/admin/users/${u.id}`);
                                    setUsers(prev => prev.filter(x => x.id !== u.id));
                                  }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors" title="Delete user">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                      <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
                      <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ── Coupons ──────────────────────────────────────────────── */}
          {tab === "coupons" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold">Discount Coupons</h2>
                  <p className="text-sm text-gray-500 mt-1">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchCoupons} className="p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button onClick={() => { setCouponFormOpen(true); setCouponError(""); }}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    <Plus className="w-4 h-4" /> Add Coupon
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400 bg-red-900/30 rounded-xl p-4 mb-4 text-sm">{error}</p>}

              {/* ── Add Coupon Form ── */}
              {couponFormOpen && (
                <div className="bg-zinc-900 rounded-2xl border-2 border-[#E63946]/40 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">New Coupon</h3>
                    <button onClick={() => setCouponFormOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-black" /></button>
                  </div>
                  {couponError && <p className="text-red-400 bg-red-900/30 rounded-lg p-3 text-sm mb-4">{couponError}</p>}
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Code *</label>
                      <input value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="SEEN20" className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono focus:border-[#E63946] focus:outline-none uppercase bg-zinc-800 text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Discount % *</label>
                      <input type="number" min={1} max={100} value={couponForm.discountRate}
                        onChange={e => setCouponForm(f => ({ ...f, discountRate: e.target.value }))}
                        className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Max Uses (blank = unlimited)</label>
                      <input type="number" min={1} value={couponForm.maxUses}
                        onChange={e => setCouponForm(f => ({ ...f, maxUses: e.target.value }))}
                        placeholder="∞" className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                      <input value={couponForm.description} onChange={e => setCouponForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Optional note about this coupon"
                        className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Expires At (optional)</label>
                      <input type="datetime-local" value={couponForm.expiresAt}
                        onChange={e => setCouponForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-[#E63946] focus:outline-none bg-zinc-800 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-12 h-6 rounded-full transition-colors relative ${couponForm.isActive ? "bg-black" : "bg-gray-300"}`}
                        onClick={() => setCouponForm(f => ({ ...f, isActive: !f.isActive }))}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${couponForm.isActive ? "left-7" : "left-1"}`} />
                      </div>
                      <span className="text-sm font-semibold">{couponForm.isActive ? "Active" : "Inactive"}</span>
                    </label>
                    <div className="flex gap-3">
                      <button onClick={() => setCouponFormOpen(false)}
                        className="px-5 py-2.5 rounded-xl border-2 border-zinc-700 text-sm font-semibold text-gray-300 hover:bg-zinc-800 transition-colors">Cancel</button>
                      <button onClick={saveCoupon} disabled={couponSaving}
                        className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-[#E63946] transition-colors flex items-center gap-2">
                        {couponSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Coupon
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Coupons Table ── */}
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No coupons yet</p>
                  <button onClick={() => setCouponFormOpen(true)} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    Create First Coupon
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-800 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>{["Code", "Discount", "Description", "Uses", "Expires", "Status", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {coupons.map(c => (
                          <tr key={c.id} className="hover:bg-zinc-800/60 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-[#E63946] text-sm bg-[#E63946]/10 px-2 py-1 rounded-lg">{c.code}</span>
                            </td>
                            <td className="px-4 py-3 font-bold text-green-700">{c.discountRate}%</td>
                            <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{c.description ?? "—"}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {c.usesCount}{c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => toggleCoupon(c)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${c.isActive ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"}`}>
                                {c.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => deleteCoupon(c.id)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors text-gray-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Messages ─────────────────────────────────────────────── */}
          {tab === "messages" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold">Contact Messages</h2>
                  <p className="text-sm text-gray-500 mt-1">{messages.length} messages</p>
                </div>
                <button onClick={fetchMessages} className="p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {error && <p className="text-red-400 bg-red-900/30 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Message list */}
                  <div className="space-y-2">
                    {messages.map(msg => (
                      <button key={msg.id} onClick={() => { setActiveMsg(msg); setReplyText(""); }}
                        className={`w-full text-left bg-zinc-900 rounded-2xl border p-4 transition-all ${activeMsg?.id === msg.id ? "border-[#E63946]" : "border-zinc-800 hover:border-zinc-600"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{msg.name}</p>
                            <p className="text-xs text-gray-400 truncate">{msg.email}</p>
                            <p className="text-xs text-gray-700 mt-1.5 font-medium truncate">{msg.subject}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{msg.message}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {msg.adminReply ? (
                              <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Replied
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full font-medium">Pending</span>
                            )}
                            <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Message detail + reply */}
                  {activeMsg ? (
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4 sticky top-20 self-start">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-base">{activeMsg.name}</p>
                          <p className="text-xs text-gray-400">{activeMsg.email}</p>
                        </div>
                        <button onClick={() => deleteMessage(activeMsg.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-gray-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">{activeMsg.subject}</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{activeMsg.message}</p>
                      </div>
                      {activeMsg.adminReply && (
                        <div className="bg-green-900/20 border border-green-800/40 rounded-xl px-4 py-3">
                          <p className="text-xs text-green-400 font-medium mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Your reply — {activeMsg.repliedAt ? new Date(activeMsg.repliedAt).toLocaleDateString() : ""}
                          </p>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{activeMsg.adminReply}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">{activeMsg.adminReply ? "Update reply" : "Write a reply"}</p>
                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}
                          placeholder="Type your reply..."
                          className="w-full border-2 border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none resize-none transition-colors bg-zinc-800 text-white placeholder:text-gray-500" />
                        <button onClick={() => sendReply(activeMsg)} disabled={replying || !replyText.trim()}
                          className="mt-2 w-full bg-black text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                          {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden lg:flex items-center justify-center text-gray-400 bg-zinc-900 rounded-2xl border border-zinc-800 py-20">
                      <div className="text-center">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">Select a message to view and reply</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderModal key="order-modal" order={selectedOrder} onClose={() => setSelectedOrder(null)} isRTL={isRTL}
            onUpdate={(id, data) => { setCustomOrders(prev => prev.map(o => o.id === id ? { ...o, ...data } : o)); setSelectedOrder(null); }} />
        )}
        {selectedRegularOrder && (
          <RegularOrderModal
            key="regular-order-modal"
            order={selectedRegularOrder}
            onClose={() => setSelectedRegularOrder(null)}
            onSave={(id, patch) => {
              setOrders((prev) => prev.map((order) => order.id === id ? { ...order, ...patch } : order));
              setSelectedRegularOrder(null);
            }}
          />
        )}
        {editProduct !== undefined && (
          <ProductModal key="product-modal"
            product={editProduct}
            onClose={() => setEditProduct(undefined)}
            onSaved={(saved) => {
              setProducts(prev => {
                const existing = prev.find(p => p.id === saved.id);
                return existing ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev];
              });
              fetchStats();
              setEditProduct(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
