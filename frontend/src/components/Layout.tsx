import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Search, Menu, X, ChevronRight, User, LogOut, Package } from "lucide-react";
import { Toaster, toast } from "./ui/sonner";
import { SiInstagram, SiTiktok, SiFacebook, SiX, SiVisa, SiMastercard } from "react-icons/si";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useWishlist } from "../context/WishlistContext";
import SeenstoreLogo from "./SeenstoreLogo";
import SearchOverlay from "./SearchOverlay";

const shopRoutes: Record<string, string> = {
  "All Products":     "/shop",
  "جميع المنتجات":    "/shop",
  "T-Shirts":         "/shop?category=T-Shirts",
  "تيشيرتات":         "/shop?category=T-Shirts",
  "Hoodies":          "/shop?category=Hoodies",
  "هوديز":            "/shop?category=Hoodies",
  "Pants":            "/shop?category=Pants",
  "بناطيل":           "/shop?category=Pants",
  "New Arrivals":     "/shop?badge=new",
  "وصل حديثاً":       "/shop?badge=new",
};

const supportRoutes: Record<string, string> = {
  "FAQ":                  "/#faq",
  "الأسئلة الشائعة":      "/#faq",
  "Shipping & Delivery":  "/shipping",
  "الشحن والتوصيل":       "/shipping",
  "Returns Policy":       "/returns",
  "سياسة الإرجاع":        "/returns",
  "Track Order":          "/track-order",
  "تتبع الطلب":           "/track-order",
  "Size Guide":           "/size-guide",
  "دليل المقاسات":        "/size-guide",
  "Contact Us":           "/contact",
  "تواصل معنا":           "/contact",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled,        setIsScrolled]        = useState(false);
  const [isMobileMenuOpen,  setIsMobileMenuOpen]  = useState(false);
  const [showUserDropdown,  setShowUserDropdown]  = useState(false);
  const [showSearch,        setShowSearch]        = useState(false);
  const [location]  = useLocation();
  const { cartCount }                          = useCart();
  const { count: wishlistCount }               = useWishlist();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { lang, setLang, t, isRTL }            = useLang();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isHome  = location === "/";
  const onDark  = !isScrolled && isHome;
  const textCls = onDark ? "text-white" : "text-gray-100";

  const navLinks = [
    { label: t.nav.home,    href: "/",        isRouter: true  },
    { label: t.nav.shop,    href: "/shop",     isRouter: true  },
    { label: t.nav.about,   href: "/#about",   isRouter: false },
    { label: t.nav.contact, href: "/#contact", isRouter: false },
  ];

  return (
    <div
      className={`min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-[#E63946] selection:text-white overflow-x-hidden ${isRTL ? "font-[Cairo]" : "font-sans"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      {/* ── Header ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isHome ? "bg-black/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between max-w-[1400px]">

          {/* Mobile menu button */}
          <button
            className="md:hidden transition-colors text-white hover:text-[#E63946]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="block">
            <SeenstoreLogo white={onDark} size="md" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(item =>
              item.isRouter ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-medium text-sm text-white hover:text-[#E63946] transition-colors relative group whitespace-nowrap"
                >
                  {item.label}
                  <span className="absolute -bottom-1 start-0 w-0 h-0.5 bg-[#E63946] transition-all group-hover:w-full" />
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="font-medium text-sm text-white hover:text-[#E63946] transition-colors relative group whitespace-nowrap"
                >
                  {item.label}
                  <span className="absolute -bottom-1 start-0 w-0 h-0.5 bg-[#E63946] transition-all group-hover:w-full" />
                </a>
              )
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4 text-white">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="text-xs font-bold px-2.5 py-1 rounded-full border-2 border-white/40 text-white transition-all hover:border-[#E63946] hover:text-[#E63946]"
            >
              {lang === "en" ? "AR" : "EN"}
            </button>

            <button 
              onClick={() => setShowSearch(true)}
              className="hover:text-[#E63946] transition-colors flex items-center gap-1" 
              aria-label="Search"
              title="Ctrl+K"
            >
              <Search className="w-5 h-5" />
              <span className="hidden lg:inline text-xs opacity-60">Ctrl+K</span>
            </button>
            <Link href="/wishlist" className={`relative hover:text-[#E63946] transition-colors hidden sm:block ${wishlistCount > 0 ? "text-[#E63946]" : "text-white"}`} aria-label="Wishlist">
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? "fill-[#E63946]" : ""}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E63946] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            <div className="relative">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowUserDropdown(v => !v)}
                    className="hover:text-[#E63946] transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  {showUserDropdown && (
                    <div className={`absolute ${isRTL ? "left-0" : "right-0"} mt-2 w-48 bg-[#111] border border-white/10 rounded-lg shadow-lg py-2 text-white z-50`}>
                      <div className="px-4 py-2 border-b border-white/10 mb-2 text-sm">
                        <p className="font-semibold text-white truncate">{currentUser?.name}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setShowUserDropdown(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 hover:text-[#E63946] ${isRTL ? "flex-row-reverse text-right" : ""}`}
                      >
                        <Package className="w-4 h-4" />
                        {isRTL ? "طلباتي" : "My Orders"}
                      </Link>
                      <button
                        onClick={() => { logout(); setShowUserDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 hover:text-[#E63946] border-t border-white/10 mt-1 ${isRTL ? "flex-row-reverse text-right" : ""}`}
                      >
                        <LogOut className="w-4 h-4" />
                        {t.nav.logout}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/auth" className="hover:text-[#E63946] transition-colors block">
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart" className="hover:text-[#E63946] transition-colors relative block">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E63946] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: isRTL ? "100%" : "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? "100%" : "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black text-white flex flex-col"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <SeenstoreLogo size="md" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col p-6 space-y-6 flex-1">
              {navLinks.map(item =>
                item.isRouter ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-heading font-semibold hover:text-[#E63946] transition-colors flex items-center justify-between group"
                  >
                    {item.label}
                    <ChevronRight className={`w-6 h-6 opacity-0 group-hover:opacity-100 transition-all text-[#E63946] ${isRTL ? "rotate-180" : ""}`} />
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-heading font-semibold hover:text-[#E63946] transition-colors flex items-center justify-between group"
                  >
                    {item.label}
                    <ChevronRight className={`w-6 h-6 opacity-0 group-hover:opacity-100 transition-all text-[#E63946] ${isRTL ? "rotate-180" : ""}`} />
                  </a>
                )
              )}
              {!isAuthenticated ? (
                <Link
                  href="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-heading font-semibold hover:text-[#E63946] transition-colors flex items-center justify-between group"
                >
                  {t.nav.login}
                  <ChevronRight className={`w-6 h-6 opacity-0 group-hover:opacity-100 transition-all text-[#E63946] ${isRTL ? "rotate-180" : ""}`} />
                </Link>
              ) : (
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="text-2xl font-heading font-semibold hover:text-[#E63946] text-left w-full"
                >
                  {t.nav.logout}
                </button>
              )}

              {/* Language in mobile */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => setLang(lang === "en" ? "ar" : "en")}
                  className="flex items-center gap-3 text-sm font-semibold hover:text-[#E63946] transition-colors"
                >
                  <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                    {lang === "en" ? "AR" : "EN"}
                  </span>
                  {lang === "en" ? "العربية" : "English"}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-black pt-20 pb-10 border-t border-white/10 mt-auto">
        <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block mb-6">
                <SeenstoreLogo size="md" />
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm">{t.footer.tagline}</p>
              <div className="flex items-center gap-4">
                {[SiInstagram, SiTiktok, SiFacebook].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-[#E63946] hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-[#E63946] hover:text-white transition-colors">
                  <SiX className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-lg text-white mb-6">{t.footer.shop}</h4>
              <ul className="space-y-4">
                {t.shopLinks.map(link => (
                  <li key={link}>
                    <Link href={shopRoutes[link] ?? "/shop"} className="text-gray-400 hover:text-[#E63946] text-sm transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-lg text-white mb-6">{t.footer.support}</h4>
              <ul className="space-y-4">
                {t.supportLinks.map(link => (
                  <li key={link}>
                    <Link href={supportRoutes[link] ?? "/faq"} className="text-gray-400 hover:text-[#E63946] text-sm transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div id="contact">
              <h4 className="font-heading font-semibold text-lg text-white mb-6">{t.footer.contact}</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>Email: hello@seenstore.com</li>
                <li>Phone: +20 123 456 7890</li>
                <li>{isRTL ? "١٢٣ شارع الحضري، القاهرة، مصر" : "123 Urban Street, Cairo, Egypt"}</li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SEENSTORE. {t.footer.rights}
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-[#E63946] transition-colors">
                {isRTL ? "سياسة الخصوصية وشروط الاستخدام" : "Privacy Policy & Terms of Use"}
              </Link>
              <div className="flex items-center gap-4 text-gray-500">
                <SiVisa className="w-10 h-6" />
                <SiMastercard className="w-8 h-6" />
              </div>
            </div>
          </div>
        </div>
      </footer>
      <Toaster position="top-center" richColors />
    </div>
  );
}
