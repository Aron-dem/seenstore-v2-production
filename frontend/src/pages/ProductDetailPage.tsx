import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLang } from "../context/LanguageContext";
import { useSEO } from "../hooks/useSEO";
import { Heart, ShieldCheck, Truck, RefreshCcw, Info, Check, ChevronRight, Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ReviewsSection from "../components/ReviewsSection";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect fill='%23f3f4f6' width='400' height='533'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESEENSTORE%3C/text%3E%3C/svg%3E";

type ApiProduct = {
  id: number; name: string; nameAr: string;
  description: string; descriptionAr: string;
  price: number; originalPrice: number | null;
  category: string; badge: string | null;
  sizes: string[]; colors: string[]; images: string[];
  inStock: boolean;
};

const FALLBACK_FEATURES = [
  "Premium Quality Materials",
  "Comfortable Streetwear Fit",
  "Durable Construction",
  "Machine Washable",
];

const COLOR_MAP: Record<string, string> = {
  black: "#000000", white: "#E5E5E5", grey: "#9CA3AF", gray: "#9CA3AF",
  red: "#E63946", navy: "#1E3A8A", blue: "#3B82F6", green: "#10B981",
  olive: "#6B7A41", beige: "#C9B99A", khaki: "#C3B091",
};

function getColorHex(name: string): string {
  return COLOR_MAP[name.toLowerCase()] ?? "#888";
}

const API_BASE = "/api";

function useSEOProduct(product: ApiProduct | null) {
  useSEO({
    title:       product ? `${product.name} — ${product.price} EGP` : "Product — SEENSTORE",
    description: product?.description ?? "SEENSTORE product",
    keywords:    product ? `${product.name}, ${product.category}, seenstore` : "seenstore",
    canonical:   product ? `https://seenstore.com/product/${product.id}` : "",
  });
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { t, isRTL } = useLang();

  const [product,    setProduct]    = useState<ApiProduct | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  const [selectedImg,   setSelectedImg]   = useState(0);
  const [selectedSize,  setSelectedSize]  = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty,           setQty]           = useState(1);
  const [added,         setAdded]         = useState(false);
  const [activeTab,     setActiveTab]     = useState<"description" | "details" | "shipping">("description");
  const [related,       setRelated]       = useState<ApiProduct[]>([]);

  useSEOProduct(product);

  useEffect(() => {
    const pid = parseInt(id ?? "", 10);
    if (isNaN(pid)) { setNotFound(true); setLoading(false); return; }

    (async () => {
      setLoading(true); setNotFound(false);
      try {
        const res = await fetch(`${API_BASE}/products/${pid}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const p: ApiProduct = data.product;
        setProduct(p);
        setSelectedSize(p.sizes[0] ?? "");
        setSelectedColor(p.colors[0] ?? "");
        setSelectedImg(0);

        // Fetch related
        const relRes = await fetch(`${API_BASE}/products/${pid}/related`);
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelated(relData.products ?? []);
        }
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const img = product.images[selectedImg] ?? PLACEHOLDER;
    const name = isRTL && product.nameAr ? product.nameAr : product.name;
    addToCart({
      productId: product.id,
      name,
      price:     product.price,
      image:     img,
      size:      selectedSize,
      color:     selectedColor,
      quantity:  qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    toast.success(isRTL ? "تمت الإضافة للسلة" : "Added to cart", {
      description: `${name} (${selectedSize} / ${selectedColor})`,
      action: {
        label: isRTL ? "عرض السلة" : "View Cart",
        onClick: () => window.location.assign("/cart")
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-16 h-16 text-gray-300" />
        <h1 className="text-2xl font-heading font-bold">{isRTL ? "المنتج غير موجود" : "Product Not Found"}</h1>
        <p className="text-gray-500">{isRTL ? "هذا المنتج غير متاح أو تم حذفه." : "This product is not available or has been removed."}</p>
        <Link href="/shop" className="mt-4 bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-[#E63946] transition-colors">
          {isRTL ? "تسوق الكل" : "Shop All"}
        </Link>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [PLACEHOLDER];
  const displayName = isRTL && product.nameAr ? product.nameAr : product.name;
  const displayDesc = isRTL && product.descriptionAr ? product.descriptionAr : product.description;

  return (
    <div className="container mx-auto px-6 py-24 max-w-6xl">
      {/* Breadcrumb */}
      <nav className={`flex items-center gap-2 text-sm text-gray-500 mb-10 ${isRTL ? "flex-row-reverse" : ""}`}>
        <Link href="/" className="hover:text-black transition-colors">{isRTL ? "الرئيسية" : "Home"}</Link>
        <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
        <Link href="/shop" className="hover:text-black transition-colors">{isRTL ? "المتجر" : "Shop"}</Link>
        <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
        <span className="text-black font-medium truncate max-w-[200px]">{displayName}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* ── Images ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
            {product.badge && (
              <span className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} z-10 text-xs font-bold px-3 py-1.5 rounded text-white shadow-sm ${product.badge === "SALE" ? "bg-[#E63946]" : "bg-black"}`}>
                {product.badge}
              </span>
            )}
            <motion.img
              key={selectedImg}
              src={images[selectedImg]}
              alt={displayName}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10 hover:scale-110 ${isWishlisted(product.id) ? "text-[#E63946]" : "text-gray-400"}`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? "fill-[#E63946]" : ""}`} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImg ? "border-black shadow-md" : "border-transparent hover:border-gray-300"}`}>
                  <img src={img} alt={`${displayName} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ────────────────────────────────────────────── */}
        <div className={`space-y-6 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">{product.category}</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight mb-3">{displayName}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-heading text-2xl font-bold">{product.price} EGP</span>
              {product.originalPrice && (
                <>
                  <span className="text-gray-400 line-through">{product.originalPrice} EGP</span>
                  <span className="text-[#E63946] text-sm font-bold">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% {isRTL ? "خصم" : "OFF"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Color */}
          {product.colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3 uppercase tracking-wide">
                {t.productDetail.color}: <span className="font-bold text-black">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)} title={c}
                    className={`relative w-10 h-10 rounded-full border-3 transition-all hover:scale-110 ${selectedColor === c ? "border-black shadow-md scale-110" : "border-gray-300"}`}
                    style={{ backgroundColor: getColorHex(c), borderWidth: 3 }}>
                    {selectedColor === c && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className={`w-4 h-4 ${["white", "beige", "khaki"].includes(c.toLowerCase()) ? "text-gray-700" : "text-white"}`} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold uppercase tracking-wide">{t.productDetail.size}</p>
                <Link href="/size-guide" className="text-xs text-gray-400 hover:text-black flex items-center gap-1 transition-colors">
                  <Info className="w-3.5 h-3.5" /> {isRTL ? "دليل المقاسات" : "Size Guide"}
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all min-w-[54px] ${selectedSize === s ? "border-black bg-black text-white shadow-md" : "border-gray-200 text-gray-700 hover:border-black"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold">−</button>
              <span className="w-10 text-center font-heading font-bold text-lg">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
                !product.inStock
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : added
                  ? "bg-green-600 text-white scale-[1.02]"
                  : "bg-black text-white hover:bg-[#E63946] active:scale-[0.98]"
              }`}>
              {!product.inStock ? (
                <>{isRTL ? "نفذ من المخزون" : "Out of Stock"}</>
              ) : added ? (
                <><Check className="w-5 h-5" /> {isRTL ? "تمت الإضافة!" : "Added!"}</>
              ) : (
                <>{t.product.addToCart}</>
              )}
            </button>
          </div>

          {/* Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck,        label: isRTL ? "توصيل سريع" : "Fast Delivery" },
              { icon: ShieldCheck,  label: isRTL ? "جودة مضمونة" : "Quality Guaranteed" },
              { icon: RefreshCcw,   label: isRTL ? "إرجاع مجاني" : "Free Returns" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center">
                <Icon className="w-5 h-5 text-gray-700" />
                <p className="text-xs text-gray-600 font-medium leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="pt-2">
            <div className="flex border-b border-gray-200">
              {(["description", "details", "shipping"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}>
                  {tab === "description" ? (isRTL ? "الوصف" : "Description") :
                   tab === "details"     ? (isRTL ? "التفاصيل" : "Details") :
                                          (isRTL ? "الشحن" : "Shipping")}
                </button>
              ))}
            </div>
            <div className="pt-4 text-sm text-gray-600 leading-relaxed">
              {activeTab === "description" && <p>{displayDesc || (isRTL ? "لا يوجد وصف متاح." : "No description available.")}</p>}
              {activeTab === "details" && (
                <ul className="space-y-2">
                  {FALLBACK_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {activeTab === "shipping" && (
                <ul className="space-y-2">
                  {[
                    isRTL ? "توصيل 3-5 أيام عمل" : "Delivery 3-5 business days",
                    isRTL ? "توصيل مجاني فوق 1000 جنيه" : "Free shipping over 1000 EGP",
                    isRTL ? "إرجاع مجاني خلال 14 يوم" : "Free returns within 14 days",
                  ].map(line => (
                    <li key={line} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-32">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-heading text-3xl font-bold">{isRTL ? "قد يعجبك أيضاً" : "You May Also Like"}</h2>
              <p className="text-gray-500 mt-2">{isRTL ? "منتجات مشابهة اخترناها لك" : "Similar products we picked for you"}</p>
            </div>
            <Link href="/shop" className="text-sm font-bold hover:text-[#E63946] transition-colors">{isRTL ? "عرض الكل" : "View All"}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map(p => (
              <div key={p.id} className="group">
                <Link href={`/product/${p.id}`} className="block relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-4">
                  <img src={p.images[0] ?? PLACEHOLDER} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleWishlist(p.id); }}
                    className={`absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transition-all ${isWishlisted(p.id) ? "text-[#E63946]" : "text-gray-400"}`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted(p.id) ? "fill-[#E63946]" : ""}`} />
                  </button>
                </Link>
                <Link href={`/product/${p.id}`}>
                  <h3 className="font-heading font-semibold text-sm hover:text-[#E63946] transition-colors mb-1 line-clamp-1">
                    {isRTL && p.nameAr ? p.nameAr : p.name}
                  </h3>
                </Link>
                <p className="font-heading font-bold text-sm">{p.price} EGP</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {product && <ReviewsSection productId={product.id} />}
    </div>
  );
}
