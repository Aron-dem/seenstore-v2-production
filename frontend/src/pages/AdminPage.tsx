import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";
import { useLang } from "../context/LanguageContext";
import { api, ApiError } from "../lib/apiClient";
import {
  ShieldCheck, Clock, Loader2, Eye, X, Package,
  Users, ShoppingBag, Palette, TrendingUp, RefreshCw, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, UserCog, LogIn,
  Plus, Edit2, Check, Image, Upload, Store, MessageSquare, Reply, CheckCircle2,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type CustomOrder = {
  id: string; userId: string | null; customerName: string; customerEmail: string;
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
  inStock: boolean; createdAt: string;
};

type ProductForm = {
  name: string; nameAr: string; price: string; originalPrice: string;
  category: string; badge: string;
  sizes: string[]; colors: string; images: string[];
  description: string; descriptionAr: string; inStock: boolean;
};

const INIT_FORM: ProductForm = {
  name: "", nameAr: "", price: "", originalPrice: "",
  category: "T-Shirts", badge: "", sizes: [], colors: "",
  images: [], description: "", descriptionAr: "", inStock: true,
};

const CATEGORIES = ["T-Shirts", "Pants", "Hoodies", "Accessories", "Summer Collection", "Winter Collection"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const CUSTOM_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800"   },
  done:       { label: "Done",       color: "bg-green-100 text-green-800"  },
  cancelled:  { label: "Cancelled",  color: "bg-red-100 text-red-800"      },
};

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f3f4f6' width='80' height='80'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='10' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E";

// ─── Types ────────────────────────────────────────────────────────────────────
type ContactMessage = {
  id: string; name: string; email: string; subject: string;
  message: string; adminReply: string | null; repliedAt: string | null; createdAt: string;
};

type Order = {
  id: string; userId: string | null;
  customerName: string; customerEmail: string;
  subtotal: number; shippingFee: number; total: number;
  couponCode: string | null; couponDiscount: number;
  depositAmount: number; paymentScreenshot: string | null;
  vfSenderPhone: string | null; guestPhone: string | null;
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "products" | "orders" | "custom-orders" | "users" | "messages" | "coupons";

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
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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
              ["Name", order.customerName], ["Email", order.customerEmail],
              ["Item", order.itemType],      ["Size", order.size],
              ["Color", order.color],        ["Date", new Date(order.createdAt).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k}><p className="text-gray-400 text-xs mb-0.5">{k}</p><p className="font-semibold truncate">{v}</p></div>
            ))}
          </div>
          {order.details && (
            <div><p className="text-xs text-gray-400 mb-1">Details</p>
              <p className="text-sm bg-gray-50 rounded-xl p-3 text-gray-700">{order.details}</p></div>
          )}
          {order.designUrl && (
            <div><p className="text-xs text-gray-400 mb-2">Design</p>
              <img src={order.designUrl} alt="Design" className="max-h-40 rounded-xl object-contain bg-gray-50 p-2 w-full" /></div>
          )}
          <div>
            <p className="text-xs text-gray-400 mb-2">Status</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(CUSTOM_STATUS).map(s => (
                <button key={s} onClick={() => setStatus(s as any)}
                  className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${status === s ? "bg-black text-white border-black" : "border-gray-200 hover:border-black"}`}>
                  {CUSTOM_STATUS[s]!.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Admin Notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none resize-none" />
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

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }: {
  product: Product | null; onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [form,       setForm]       = useState<ProductForm>(product ? {
    name: product.name, nameAr: product.nameAr, price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    category: product.category, badge: product.badge ?? "",
    sizes: product.sizes, colors: product.colors.join(", "),
    images: product.images, description: product.description,
    descriptionAr: product.descriptionAr, inStock: product.inStock,
  } : INIT_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [urlInput,   setUrlInput]   = useState("");
  const [uploading,  setUploading]  = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  const set = (k: keyof ProductForm, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleSize = (s: string) => set("sizes", form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);
  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    try { new URL(u); set("images", [...form.images, u]); setUrlInput(""); } catch { setError("Invalid URL"); }
  };
  const removeImg = (i: number) => set("images", form.images.filter((_, idx) => idx !== i));

  const uploadFile = async (file: File) => {
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("seen_access_token");
      const res = await fetch("/api/admin/upload/image", {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      set("images", [...form.images, data.url]);
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
        colors:        form.colors.split(",").map(c => c.trim()).filter(Boolean),
        images:        form.images,
        description:   form.description.trim(),
        descriptionAr: form.descriptionAr.trim(),
        inStock:       form.inStock,
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
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h3 className="font-heading font-bold text-lg">{product ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Name (EN) *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Product name"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Name (AR)</label>
              <input value={form.nameAr} onChange={e => set("nameAr", e.target.value)} placeholder="اسم المنتج" dir="rtl"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
            </div>
          </div>

          {/* Price + Category + Badge */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Price (EGP) *</label>
              <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="299" min={1}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Original Price</label>
              <input type="number" value={form.originalPrice} onChange={e => set("originalPrice", e.target.value)} placeholder="399" min={1}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Badge</label>
              <select value={form.badge} onChange={e => set("badge", e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none bg-white">
                <option value="">None</option>
                <option value="NEW">NEW</option>
                <option value="SALE">SALE</option>
              </select>
            </div>
          </div>

          {/* Category + In Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer pb-1">
                <div className={`w-12 h-6 rounded-full transition-colors relative ${form.inStock ? "bg-black" : "bg-gray-300"}`}
                  onClick={() => set("inStock", !form.inStock)}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.inStock ? "left-7" : "left-1"}`} />
                </div>
                <span className="text-sm font-semibold">{form.inStock ? "In Stock" : "Out of Stock"}</span>
              </label>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${form.sizes.includes(s) ? "bg-black text-white border-black" : "border-gray-200 hover:border-black"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Colors (comma-separated)</label>
            <input value={form.colors} onChange={e => set("colors", e.target.value)} placeholder="Black, White, Grey, Navy"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description (EN)</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Product description..."
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description (AR)</label>
              <textarea value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} rows={3} placeholder="وصف المنتج..." dir="rtl"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none resize-none" />
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
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 group">
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
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none" />
              <button onClick={addUrl} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">
                Add URL
              </button>
            </div>

            {/* Upload file */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-black rounded-xl text-sm font-semibold text-gray-600 hover:text-black transition-all w-full justify-center disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading..." : "Upload Image File"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
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
  const { currentUser, isAdmin, isLoading, login } = useAuth();
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

  // Login form
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError,    setLoginError]    = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); setLoginLoading(true);
    try { await login(loginEmail, loginPassword); }
    catch (err) { setLoginError(err instanceof ApiError ? err.message : "Invalid credentials"); }
    finally { setLoginLoading(false); }
  };

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

  if (!currentUser) return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-2">Sign in with your admin account</p>
        </div>
        {loginError && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3 mb-4 text-center">{loginError}</p>}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Admin email" required
            className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:border-black transition-colors" />
          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" required
            className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:border-black transition-colors" />
          <button type="submit" disabled={loginLoading}
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-[#E63946] transition-colors flex items-center justify-center gap-2">
            {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            Enter Admin Panel
          </button>
        </form>
      </motion.div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">This account doesn't have admin privileges.</p>
        <button onClick={() => setLocation("/")} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-[#E63946] transition-colors">Go Home</button>
      </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30">
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
        <aside className="w-56 bg-white border-r border-gray-100 min-h-[calc(100vh-56px)] p-4 hidden md:block sticky top-14 self-start">
          {SIDEBAR_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mb-1 transition-all ${tab === key ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </aside>

        {/* Mobile bottom tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
          {SIDEBAR_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setPage(1); }}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-semibold transition-colors ${tab === key ? "text-[#E63946]" : "text-gray-400"}`}>
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
                  { label: "Total Users",     value: stats.totalUsers,          icon: Users,      color: "bg-blue-50 text-blue-600"    },
                  { label: "Total Products",  value: stats.totalProducts,       icon: Store,      color: "bg-indigo-50 text-indigo-600" },
                  { label: "Custom Orders",   value: stats.totalCustomOrders,   icon: Palette,    color: "bg-purple-50 text-purple-600" },
                  { label: "Pending Orders",  value: stats.pendingCustomOrders, icon: Clock,      color: "bg-yellow-50 text-yellow-600" },
                  { label: "New Users/Week",  value: stats.newUsersWeek,        icon: Users,      color: "bg-cyan-50 text-cyan-600"     },
                  { label: "Products in Stock",value: stats.productsInStock,    icon: Package,    color: "bg-green-50 text-green-600"   },
                  { label: "Regular Orders",  value: stats.totalOrders,         icon: ShoppingBag,color: "bg-orange-50 text-orange-600" },
                  { label: "Revenue (EGP)",   value: stats.totalRevenue,        icon: TrendingUp, color: "bg-emerald-50 text-emerald-600"},
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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
                  <button onClick={fetchProducts} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button onClick={() => setEditProduct(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>
              </div>

              {error && <p className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm">{error}</p>}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No products yet</p>
                  <button onClick={() => setEditProduct(null)} className="mt-4 bg-black text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    Add First Product
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                          {["", "Name", "Price", "Category", "Badge", "Sizes", "Stock", ""].map((h, i) => (
                            <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
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
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                {p.inStock ? "In Stock" : "Out"}
                              </span>
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
                <button onClick={fetchOrders} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {error && <p className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>{["Order ID", "Customer", "Total / Deposit", "Payment Proof", "Status", "Date"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map(order => {
                          const cfg = ORDER_STATUS[order.status] ?? ORDER_STATUS["pending"]!;
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-mono font-bold text-[#E63946] text-xs">{order.id}</p>
                                {order.couponCode && <p className="text-green-600 text-xs mt-0.5">🏷 {order.couponCode} (−{order.couponDiscount} EGP)</p>}
                                {order.guestPhone && <p className="text-blue-600 text-xs mt-0.5">📱 {order.guestPhone}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-sm">{order.customerName}</p>
                                <p className="text-gray-400 text-xs truncate max-w-[130px]">{order.customerEmail}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-sm">{order.total.toLocaleString()} EGP</p>
                                {order.depositAmount > 0 && (
                                  <p className="text-[#E63946] text-xs font-bold">مقدم: {order.depositAmount} EGP</p>
                                )}
                                {order.vfSenderPhone && (
                                  <p className="text-gray-500 text-xs">VF: {order.vfSenderPhone}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {order.paymentScreenshot ? (
                                  <a href={order.paymentScreenshot} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                    <span>📸</span> عرض
                                  </a>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={order.status}
                                  onChange={async (e) => {
                                    const newStatus = e.target.value as Order["status"];
                                    await api.patch(`/admin/orders/${order.id}`, { status: newStatus });
                                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                                  }}
                                  className={`text-xs font-bold px-2 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black ${cfg.color}`}
                                >
                                  {Object.entries(ORDER_STATUS).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
                      <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
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
                <button onClick={fetchCustomOrders} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="flex gap-2 flex-wrap mb-6">
                {["all", "pending", "processing", "done", "cancelled"].map(s => (
                  <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterStatus === s ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-black"}`}>
                    {s === "all" ? "All" : CUSTOM_STATUS[s]!.label}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : customOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>{["Order ID", "Customer", "Item", "Size", "Date", "Status", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customOrders.map(order => {
                          const cfg = CUSTOM_STATUS[order.status] ?? CUSTOM_STATUS["pending"]!;
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-[#E63946] text-xs">{order.id}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold">{order.customerName}</p>
                                <p className="text-gray-400 text-xs truncate max-w-[140px]">{order.customerEmail}</p>
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
                      <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
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
                <button onClick={fetchUsers} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {error && <p className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>{["Name", "Email", "Role", "Phone", "Joined", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} total</p>
                      <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
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
                  <button onClick={fetchCoupons} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button onClick={() => { setCouponFormOpen(true); setCouponError(""); }}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    <Plus className="w-4 h-4" /> Add Coupon
                  </button>
                </div>
              </div>
              {error && <p className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm">{error}</p>}

              {/* ── Add Coupon Form ── */}
              {couponFormOpen && (
                <div className="bg-white rounded-2xl border-2 border-black shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">New Coupon</h3>
                    <button onClick={() => setCouponFormOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-black" /></button>
                  </div>
                  {couponError && <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm mb-4">{couponError}</p>}
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Code *</label>
                      <input value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="SEEN20" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:border-black focus:outline-none uppercase" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Discount % *</label>
                      <input type="number" min={1} max={100} value={couponForm.discountRate}
                        onChange={e => setCouponForm(f => ({ ...f, discountRate: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Max Uses (blank = unlimited)</label>
                      <input type="number" min={1} value={couponForm.maxUses}
                        onChange={e => setCouponForm(f => ({ ...f, maxUses: e.target.value }))}
                        placeholder="∞" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                      <input value={couponForm.description} onChange={e => setCouponForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Optional note about this coupon"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Expires At (optional)</label>
                      <input type="datetime-local" value={couponForm.expiresAt}
                        onChange={e => setCouponForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-black focus:outline-none" />
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
                        className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
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
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No coupons yet</p>
                  <button onClick={() => setCouponFormOpen(true)} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors">
                    Create First Coupon
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>{["Code", "Discount", "Description", "Uses", "Expires", "Status", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {coupons.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-[#E63946] text-sm bg-red-50 px-2 py-1 rounded-lg">{c.code}</span>
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
                <button onClick={fetchMessages} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {error && <p className="text-red-600 bg-red-50 rounded-xl p-4 mb-4 text-sm">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Message list */}
                  <div className="space-y-2">
                    {messages.map(msg => (
                      <button key={msg.id} onClick={() => { setActiveMsg(msg); setReplyText(""); }}
                        className={`w-full text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-sm ${activeMsg?.id === msg.id ? "border-black shadow-sm" : "border-gray-100"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{msg.name}</p>
                            <p className="text-xs text-gray-400 truncate">{msg.email}</p>
                            <p className="text-xs text-gray-700 mt-1.5 font-medium truncate">{msg.subject}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{msg.message}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {msg.adminReply ? (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Replied
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Pending</span>
                            )}
                            <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Message detail + reply */}
                  {activeMsg ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 sticky top-20 self-start">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-base">{activeMsg.name}</p>
                          <p className="text-xs text-gray-400">{activeMsg.email}</p>
                        </div>
                        <button onClick={() => deleteMessage(activeMsg.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-gray-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">{activeMsg.subject}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeMsg.message}</p>
                      </div>
                      {activeMsg.adminReply && (
                        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                          <p className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Your reply — {activeMsg.repliedAt ? new Date(activeMsg.repliedAt).toLocaleDateString() : ""}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeMsg.adminReply}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">{activeMsg.adminReply ? "Update reply" : "Write a reply"}</p>
                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}
                          placeholder="Type your reply..."
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none resize-none transition-colors" />
                        <button onClick={() => sendReply(activeMsg)} disabled={replying || !replyText.trim()}
                          className="mt-2 w-full bg-black text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#E63946] transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                          {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden lg:flex items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-100 py-20">
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
