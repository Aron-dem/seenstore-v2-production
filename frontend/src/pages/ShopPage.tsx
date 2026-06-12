import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLang } from "../context/LanguageContext";
import { ShoppingBag, Heart, Filter, Grid, List, X, Check, Loader2 } from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { label: "T-Shirts", labelAr: "تيشيرتات", keys: ["T-Shirts"] },
  { label: "Hoodies",  labelAr: "هوديز",    keys: ["Hoodies"]  },
  { label: "Pants",    labelAr: "بناطيل",   keys: ["Pants"]    },
];
const SIZES     = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS    = [
  { name: "Black",  hex: "#000000" },
  { name: "White",  hex: "#E5E5E5" },
  { name: "Grey",   hex: "#9CA3AF" },
  { name: "Navy",   hex: "#1E3A8A" },
  { name: "Red",    hex: "#E63946" },
  { name: "Olive",  hex: "#6B7A41" },
  { name: "Beige",  hex: "#C9B99A" },
  { name: "Blue",   hex: "#3B82F6" },
  { name: "Green",  hex: "#10B981" },
  { name: "Khaki",  hex: "#C3B091" },
];

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect fill='%23f3f4f6' width='400' height='533'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESEENSTORE%3C/text%3E%3C/svg%3E";

type ApiProduct = {
  id: number; name: string; nameAr: string;
  description: string; descriptionAr: string;
  price: number; originalPrice: number | null;
  category: string; badge: string | null;
  sizes: string[]; colors: string[]; images: string[];
  inStock: boolean; createdAt: string;
};

const API_BASE = import.meta.env["VITE_API_URL"] ?? "/api";

interface SidebarProps {
  products:        ApiProduct[];
  selectedCats:    string[];
  selectedSizes:   string[];
  selectedColors:  string[];
  priceRange:      number;
  isRTL:           boolean;
  onToggleCat:     (v: string) => void;
  onToggleSize:    (v: string) => void;
  onToggleColor:   (v: string) => void;
  onPriceChange:   (v: number) => void;
  onClearAll:      () => void;
  labels: { clearAll: string; categories: string; priceRange: string; size: string; color: string; };
}

function FilterSidebar({ products, selectedCats, selectedSizes, selectedColors, priceRange, isRTL, onToggleCat, onToggleSize, onToggleColor, onPriceChange, onClearAll, labels }: SidebarProps) {
  const hasActive = selectedCats.length > 0 || selectedSizes.length > 0 || selectedColors.length > 0 || priceRange < 2000;
  const pct = (priceRange / 2000) * 100;
  return (
    <div className="space-y-8">
      {hasActive && (
        <button onClick={onClearAll} className="text-sm text-[#E63946] font-semibold hover:underline flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> {labels.clearAll}
        </button>
      )}
      <div>
        <h3 className="font-heading font-bold text-base mb-4 uppercase tracking-wide">{labels.categories}</h3>
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const active = cat.keys.every(k => selectedCats.includes(k));
            const count  = products.filter(p => cat.keys.includes(p.category)).length;
            return (
              <button key={cat.label} type="button" onClick={() => onToggleCat(cat.label)} className="flex items-center gap-3 w-full group text-left">
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-[#E63946] border-[#E63946]" : "border-zinc-600 group-hover:border-[#E63946]"}`}>
                  {active && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className={`text-sm transition-colors ${active ? "font-semibold text-white" : "text-gray-400 group-hover:text-white"}`}>{isRTL ? cat.labelAr : cat.label}</span>
                <span className="ml-auto text-xs text-gray-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="font-heading font-bold text-base mb-4 uppercase tracking-wide">{labels.priceRange}</h3>
        <div className="flex justify-between text-sm font-medium mb-3">
          <span className="text-gray-500">0 EGP</span>
          <span className="text-[#E63946] font-bold">{priceRange} EGP</span>
        </div>
        <div className="relative h-6 flex items-center" dir="ltr">
          <div className="absolute left-0 right-0 h-1.5 rounded-full bg-zinc-700" />
          <div className="absolute left-0 h-1.5 rounded-full bg-[#E63946]" style={{ width: `${pct}%` }} />
          <input
            type="range" min={0} max={2000} step={50}
            value={priceRange}
            onChange={e => onPriceChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-6" style={{ zIndex: 2 }}
          />
          <div className="absolute w-5 h-5 rounded-full bg-[#E63946] shadow-md border-2 border-zinc-950 pointer-events-none transition-all" style={{ left: `calc(${pct}% - 10px)`, zIndex: 1 }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2"><span>Min</span><span>Max: 2000 EGP</span></div>
      </div>
      <div>
        <h3 className="font-heading font-bold text-base mb-4 uppercase tracking-wide">{labels.size}</h3>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map(s => (
            <button key={s} type="button" onClick={() => onToggleSize(s)} className={`py-2 text-sm border-2 rounded-lg font-medium transition-all ${selectedSizes.includes(s) ? "border-[#E63946] bg-[#E63946] text-white" : "border-zinc-700 text-gray-300 hover:border-[#E63946] hover:text-[#E63946]"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-heading font-bold text-base mb-4 uppercase tracking-wide">{labels.color}</h3>
        <div className="flex flex-wrap gap-3">
          {COLORS.map(c => (
            <button key={c.name} type="button" onClick={() => onToggleColor(c.name)} title={c.name} className={`relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${selectedColors.includes(c.name) ? "border-[#E63946] scale-110 shadow-md" : "border-zinc-700 hover:border-zinc-400"}`} style={{ backgroundColor: c.hex }}>
              {selectedColors.includes(c.name) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className={`w-4 h-4 ${c.name === "White" || c.name === "Beige" ? "text-gray-600" : "text-white"}`} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ShopPageProps {
  initialCategories?: string[];
  season?: "summer" | "winter";
}

export default function ShopPage({ initialCategories = [], season }: ShopPageProps = {}) {
  const seasonMeta = season === "summer"
    ? { title: "Summer Collection — كولكشن الصيف | SEENSTORE", desc: "تسوق كولكشن الصيف — تيشيرتات وبناطيل ستريت وير.", canonical: "https://seenstore.com/shop/summer" }
    : season === "winter"
    ? { title: "Winter Collection — كولكشن الشتاء | SEENSTORE", desc: "تسوق كولكشن الشتاء — هوديز وبناطيل ستريت وير.", canonical: "https://seenstore.com/shop/winter" }
    : { title: "Shop All — تسوق الكل | ملابس ستريت وير", desc: "تسوق كل منتجات SEENSTORE. هوديز، كارجو بانت، تيشيرتات، وإكسسوارات ستريت وير بأسعار منافسة.", canonical: "https://seenstore.com/shop" };

  useSEO({
    title:       seasonMeta.title,
    description: seasonMeta.desc,
    keywords:    "تسوق ملابس ستريت وير, shop streetwear egypt, هوديز, كارجو بانت, تيشيرتات مصر",
    canonical:   seasonMeta.canonical,
    jsonLd: {
      "@context": "https://schema.org", "@type": "CollectionPage",
      "name": seasonMeta.title,
    },
  });

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { t, isRTL } = useLang();

  const [products,       setProducts]       = useState<ApiProduct[]>([]);
  const [loadingProds,   setLoadingProds]   = useState(true);
  const [selectedCats,   setSelectedCats]   = useState<string[]>(initialCategories);
  const [selectedSizes,  setSelectedSizes]  = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange,     setPriceRange]     = useState(2000);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [view,           setView]           = useState<"grid" | "list">("grid");
  const [sort,           setSort]           = useState("Latest");

  useEffect(() => {
    (async () => {
      setLoadingProds(true);
      try {
        const res = await fetch(`${API_BASE}/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? []);
        }
      } catch { /* ignore */ } finally { setLoadingProds(false); }
    })();
  }, []);

  const toggle = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }, []);

  const toggleCat = useCallback((catLabel: string) => {
    const cat = CATEGORIES.find(c => c.label === catLabel);
    if (!cat) return;
    setSelectedCats(prev => {
      const allSelected = cat.keys.every(k => prev.includes(k));
      return allSelected
        ? prev.filter(k => !cat.keys.includes(k))
        : [...prev.filter(k => !cat.keys.includes(k)), ...cat.keys];
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedCats([]); setSelectedSizes([]); setSelectedColors([]); setPriceRange(2000);
  }, []);

  const filtered = products
    .filter(p => {
      if (selectedCats.length && !selectedCats.includes(p.category)) return false;
      if (p.price > priceRange) return false;
      if (selectedSizes.length && !p.sizes.some(s => selectedSizes.includes(s))) return false;
      if (selectedColors.length && !p.colors.some(c => selectedColors.includes(c))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "Price Low-High") return a.price - b.price;
      if (sort === "Price High-Low") return b.price - a.price;
      return 0;
    });

  const sidebarLabels = { clearAll: t.shop.clearAll, categories: t.shop.categories, priceRange: t.shop.priceRange, size: t.shop.size, color: t.shop.color };
  const sidebarProps: SidebarProps = {
    products, selectedCats, selectedSizes, selectedColors, priceRange, isRTL,
    onToggleCat:   toggleCat,
    onToggleSize:  (v) => toggle(setSelectedSizes, v),
    onToggleColor: (v) => toggle(setSelectedColors, v),
    onPriceChange: setPriceRange,
    onClearAll:    clearAll,
    labels:        sidebarLabels,
  };

  const seasonBanner = season === "summer"
    ? { emoji: "☀️", en: "Summer Collection", ar: "كولكشن الصيف", sub: isRTL ? "تيشيرتات وبناطيل" : "T-Shirts & Pants", bg: "from-orange-900/40 to-yellow-900/20", border: "border-orange-500/30" }
    : season === "winter"
    ? { emoji: "❄️", en: "Winter Collection", ar: "كولكشن الشتاء", sub: isRTL ? "هوديز وبناطيل" : "Hoodies & Pants", bg: "from-blue-900/40 to-cyan-900/20", border: "border-blue-500/30" }
    : null;

  return (
    <div className="container mx-auto px-6 py-24 max-w-[1400px]">
      {seasonBanner && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 rounded-2xl bg-gradient-to-r ${seasonBanner.bg} border ${seasonBanner.border} px-6 py-5 flex items-center gap-4`}
        >
          <span className="text-4xl">{seasonBanner.emoji}</span>
          <div>
            <h2 className="text-xl font-heading font-bold text-white">{isRTL ? seasonBanner.ar : seasonBanner.en}</h2>
            <p className="text-sm text-gray-400">{seasonBanner.sub}</p>
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? "100%" : "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? "100%" : "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-zinc-950 overflow-y-auto"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h2 className="text-xl font-heading font-bold">{t.shop.filters}</h2>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6"><FilterSidebar {...sidebarProps} /></div>
            <div className="sticky bottom-0 p-6 bg-zinc-950 border-t border-zinc-800">
              <button onClick={() => setMobileOpen(false)} className="w-full bg-[#E63946] text-white py-3 rounded-xl font-bold tracking-wide hover:bg-red-700 transition">
                {filtered.length} {t.shop.title}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start">
          <FilterSidebar {...sidebarProps} />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pb-6 border-b">
            <div>
              <h1 className="text-3xl font-heading font-bold">{t.shop.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {loadingProds ? "..." : filtered.length} {isRTL ? "منتج" : "products"}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:border-[#E63946] hover:text-[#E63946] transition text-sm font-medium">
                <Filter className="w-4 h-4" /> {t.shop.filters}
                {(selectedCats.length + selectedSizes.length + selectedColors.length) > 0 && (
                  <span className="w-5 h-5 bg-[#E63946] text-white text-xs rounded-full flex items-center justify-center">
                    {selectedCats.length + selectedSizes.length + selectedColors.length}
                  </span>
                )}
              </button>
              <select value={sort} onChange={e => setSort(e.target.value)} className="border-2 border-zinc-700 bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E63946] ml-auto">
                <option value="Latest">{t.shop.sort.latest}</option>
                <option value="Price Low-High">{t.shop.sort.priceLow}</option>
                <option value="Price High-Low">{t.shop.sort.priceHigh}</option>
              </select>
              <div className="hidden sm:flex border-2 border-zinc-700 rounded-lg overflow-hidden">
                <button onClick={() => setView("grid")} className={`p-2 transition ${view === "grid" ? "bg-white text-black" : "hover:bg-zinc-800"}`}><Grid className="w-4 h-4" /></button>
                <button onClick={() => setView("list")} className={`p-2 transition ${view === "list" ? "bg-white text-black" : "hover:bg-zinc-800"}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {(selectedCats.length > 0 || selectedSizes.length > 0 || selectedColors.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCats.map(c => (
                <button key={c} onClick={() => toggle(setSelectedCats, c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs rounded-full font-medium hover:bg-[#E63946] transition">{c} <X className="w-3 h-3" /></button>
              ))}
              {selectedSizes.map(s => (
                <button key={s} onClick={() => toggle(setSelectedSizes, s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs rounded-full font-medium hover:bg-[#E63946] transition">{t.shop.size}: {s} <X className="w-3 h-3" /></button>
              ))}
              {selectedColors.map(c => (
                <button key={c} onClick={() => toggle(setSelectedColors, c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs rounded-full font-medium hover:bg-[#E63946] transition">{c} <X className="w-3 h-3" /></button>
              ))}
            </div>
          )}

          {loadingProds ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-[3/4] bg-zinc-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-5 bg-zinc-800 rounded w-1/3" />
                    <div className="h-10 bg-zinc-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.shop.noResults}</h3>
              <p className="text-gray-500 mb-6">{isRTL ? "حاول تغيير الفلاتر." : "Try adjusting your filters."}</p>
              <button onClick={clearAll} className="bg-[#E63946] text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition">{t.shop.clearFilters}</button>
            </div>
          ) : (
            <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-5" : "space-y-5"}>
              {filtered.map((p, idx) => {
                const img       = p.images[0] ?? PLACEHOLDER;
                const mainColor = p.colors[0] ?? "";
                const mainSize  = p.sizes[0] ?? "M";
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className={`group bg-zinc-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${view === "list" ? "flex gap-5 items-center p-4" : ""}`}
                  >
                    <div className={`relative overflow-hidden bg-zinc-800 ${view === "list" ? "w-44 h-56 flex-shrink-0 rounded-lg" : "aspect-[3/4]"}`}>
                      {p.badge && (
                        <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 rounded text-white ${p.badge === "SALE" ? "bg-[#E63946]" : "bg-black"}`}>
                          {p.badge}
                        </span>
                      )}
                      <Link href={`/product/${p.id}`} className="block w-full h-full">
                        <img src={img} alt={isRTL ? p.nameAr || p.name : p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </Link>
                      <button
                        onClick={(e) => { e.preventDefault(); toggleWishlist(p.id); }}
                        className={`absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10 ${isWishlisted(p.id) ? "text-[#E63946]" : "text-gray-400 hover:text-[#E63946]"}`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted(p.id) ? "fill-[#E63946]" : ""}`} />
                      </button>
                    </div>
                    <div className={view === "list" ? "flex-1 py-2" : "p-4"}>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{p.category}</p>
                      <Link href={`/product/${p.id}`}>
                        <h3 className="font-heading font-semibold hover:text-[#E63946] transition-colors mb-1 line-clamp-1">
                          {isRTL && p.nameAr ? p.nameAr : p.name}
                        </h3>
                      </Link>
                      {p.colors.length > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          {p.colors.slice(0, 4).map(c => {
                            const def = COLORS.find(x => x.name.toLowerCase() === c.toLowerCase());
                            return (
                              <span key={c} title={c} className="w-4 h-4 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: def?.hex ?? "#ccc" }} />
                            );
                          })}
                          {p.colors.length > 4 && <span className="text-xs text-gray-400">+{p.colors.length - 4}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <p className="font-heading font-bold text-lg">{p.price} <span className="text-sm font-normal text-gray-500">EGP</span></p>
                        {p.originalPrice && <p className="text-sm text-gray-400 line-through">{p.originalPrice} EGP</p>}
                      </div>
                      {view === "list" && (
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{isRTL && p.descriptionAr ? p.descriptionAr : p.description}</p>
                      )}
                      <button
                        onClick={() => addToCart({ productId: p.id, name: isRTL && p.nameAr ? p.nameAr : p.name, price: p.price, image: img, size: mainSize, color: mainColor, quantity: 1 })}
                        className={`flex items-center justify-center gap-2 bg-black text-white rounded-lg font-semibold hover:bg-[#E63946] transition-colors text-sm ${view === "grid" ? "w-full py-2.5" : "px-6 py-2.5"}`}
                      >
                        <ShoppingBag className="w-4 h-4" /> {t.product.addToCart}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
