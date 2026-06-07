import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useLang } from "../context/LanguageContext";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect fill='%23f3f4f6' width='400' height='533'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESEENSTORE%3C/text%3E%3C/svg%3E";

type ApiProduct = {
  id: number; name: string; nameAr: string;
  price: number; originalPrice: number | null;
  category: string; badge: string | null;
  sizes: string[]; colors: string[]; images: string[];
  inStock: boolean;
};

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isRTL } = useLang();

  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data.products ?? []);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  const wishlisted = allProducts.filter(p => wishlist.includes(p.id));

  return (
    <div className="container mx-auto px-6 py-24 max-w-5xl">
      <div className="mb-10">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E63946] transition-colors mb-6">
          <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {isRTL ? "متابعة التسوق" : "Continue Shopping"}
        </Link>
        <h1 className="font-heading text-4xl font-bold flex items-center gap-3">
          <Heart className="w-8 h-8 text-[#E63946] fill-[#E63946]" />
          {isRTL ? "المفضلة" : "Wishlist"}
          {wishlist.length > 0 && (
            <span className="text-lg font-normal text-gray-400">({wishlist.length})</span>
          )}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : wishlisted.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl">
          <div className="w-20 h-20 bg-[#E63946]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-[#E63946]" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-3">
            {isRTL ? "قائمتك فارغة" : "Your wishlist is empty"}
          </h2>
          <p className="text-gray-500 mb-8">
            {isRTL ? "اضغط على القلب على أي منتج لإضافته هنا" : "Click the heart on any product to save it here"}
          </p>
          <Link href="/shop" className="inline-block bg-[#E63946] text-white font-bold px-8 py-3 rounded-lg hover:bg-black transition-colors">
            {isRTL ? "تصفح المنتجات" : "Browse Products"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <AnimatePresence>
            {wishlisted.map((p, idx) => {
              const img       = p.images[0] ?? PLACEHOLDER;
              const mainColor = p.colors[0] ?? "";
              const mainSize  = p.sizes[0] ?? "M";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative overflow-hidden bg-gray-100 aspect-[3/4]">
                    {p.badge && (
                      <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 rounded text-white ${p.badge === "SALE" ? "bg-[#E63946]" : "bg-black"}`}>
                        {p.badge}
                      </span>
                    )}
                    <Link href={`/product/${p.id}`} className="block w-full h-full">
                      <img src={img} alt={isRTL && p.nameAr ? p.nameAr : p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                    </Link>
                    <button
                      onClick={() => toggleWishlist(p.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-10 text-[#E63946] hover:scale-110 transition-transform"
                    >
                      <Heart className="w-4 h-4 fill-[#E63946]" />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{p.category}</p>
                    <Link href={`/product/${p.id}`}>
                      <h3 className="font-heading font-semibold text-sm hover:text-[#E63946] transition-colors mb-2 line-clamp-1">
                        {isRTL && p.nameAr ? p.nameAr : p.name}
                      </h3>
                    </Link>
                    {p.colors.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2">
                        {isRTL ? "ألوان:" : "Colors:"}{" "}
                        <span className="font-semibold text-black">{p.colors.slice(0, 2).join(", ")}{p.colors.length > 2 ? "..." : ""}</span>
                      </p>
                    )}
                    <p className="font-heading font-bold text-base mb-3">{p.price} <span className="text-xs font-normal text-gray-500">EGP</span></p>
                    <button
                      onClick={() => addToCart({ productId: p.id, name: isRTL && p.nameAr ? p.nameAr : p.name, price: p.price, image: img, size: mainSize, color: mainColor, quantity: 1 })}
                      className="flex items-center justify-center gap-2 w-full bg-black text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-[#E63946] transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {isRTL ? "أضف للسلة" : "Add to Cart"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
