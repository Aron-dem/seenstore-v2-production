import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X, Loader2 } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  nameAr?: string;
  price: number;
  images?: string[];
  category: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { lang, isRTL } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.products ?? []);
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error(lang === "en" ? "Search failed" : "فشل البحث");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [query, lang]);

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={lang === "en" ? "Search products..." : "ابحث عن المنتجات..."}
                className="flex-1 outline-none text-lg"
                dir={isRTL ? "rtl" : "ltr"}
              />
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E63946]" />
                </div>
              ) : query.trim() && results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500">
                    {lang === "en" ? "No products found" : "لم يتم العثور على منتجات"}
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y">
                  {results.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <img
                        src={product.images?.[0] ?? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect fill='%23f3f4f6' width='64' height='64'/%3E%3C/svg%3E"}
                        alt={isRTL && product.nameAr ? product.nameAr : product.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{isRTL && product.nameAr ? product.nameAr : product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                        <p className="text-sm font-bold text-[#E63946] mt-1">{product.price} EGP</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Keyboard Hint */}
            {!query && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
                {lang === "en" ? "Press ESC to close" : "اضغط ESC للإغلاق"}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
