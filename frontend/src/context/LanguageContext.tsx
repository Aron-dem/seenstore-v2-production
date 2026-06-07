import { createContext, useContext, useState, useEffect } from "react";

type Lang = "en" | "ar";

interface Translations {
  nav: { home: string; shop: string; about: string; contact: string; login: string; logout: string };
  hero: { label: string; cta1: string; cta2: string };
  footer: { tagline: string; shop: string; support: string; contact: string; rights: string };
  shopLinks: string[];
  supportLinks: string[];
  cart: { title: string; empty: string; subtotal: string; checkout: string; continueShopping: string; remove: string };
  product: { addToCart: string; sizeGuide: string; inStock: string; reviews: string; youMayLike: string; viewAll: string; freeShipping: string; returns: string; secure: string };
  shop: { title: string; filters: string; clearAll: string; categories: string; priceRange: string; size: string; color: string; noResults: string; clearFilters: string; sort: { latest: string; priceLow: string; priceHigh: string; popular: string }; loadMore: string };
  auth: { signIn: string; signUp: string; email: string; password: string; name: string; loginBtn: string; registerBtn: string; noAccount: string; hasAccount: string };
  home: {
    newCollection: string;
    featFreeShipping: string; featFreeShippingDesc: string;
    featEasyReturns: string; featEasyReturnsDesc: string;
    featSecurePayment: string; featSecurePaymentDesc: string;
    essentials: string; essentialsDesc: string; viewAllCats: string;
    newArrivalsBanner: string; newArrivalsDesc: string; shopNew: string;
    latestDrops: string; latestDropsDesc: string; viewAllProducts: string;
    whySeenstore: string;
    qualityMaterials: string; qualityMaterialsDesc: string;
    fastDelivery: string; fastDeliveryDesc: string;
    exclusiveDesigns: string; exclusiveDesignsDesc: string;
    easyReturns: string; easyReturnsDesc: string;
    joinMovement: string; joinMovementDesc: string;
    emailPlaceholder: string; subscribe: string;
    shopNowInBanner: string;
  };
  categories: { tShirts: string; pants: string; hoodies: string; accessories: string };
  breadcrumb: { home: string; shop: string };
  productDetail: {
    size: string; color: string; addToCart: string; sizeGuide: string;
    inStock: string; customerReviews: string; verified: string;
    youMayAlsoLike: string; viewAll: string; moreFrom: string;
    freeShipping: string; returns: string; secure: string; addCartShort: string;
    reviewsCount: string;
  };
  cartPage: {
    title: string; empty: string; emptyDesc: string; startShopping: string;
    product: string; price: string; quantity: string; total: string;
    orderSummary: string; promoPlaceholder: string; apply: string; applied: string;
    subtotal: string; discount: string; shipping: string; grandTotal: string;
    checkout: string; secureCheckout: string; size: string; color: string;
    remove: string; continueShopping: string; free: string;
  };
}

const en: Translations = {
  nav: { home: "Home", shop: "Shop", about: "About", contact: "Contact", login: "Login / Register", logout: "Logout" },
  hero: { label: "SEENSTORE", cta1: "SHOP NOW", cta2: "EXPLORE ALL" },
  footer: { tagline: "Premium men's urban casual clothing brand. Defining the future of streetwear.", shop: "Shop", support: "Support", contact: "Contact", rights: "All rights reserved." },
  shopLinks: ["All Products", "T-Shirts", "Hoodies", "Pants", "Accessories", "New Arrivals"],
  supportLinks: ["FAQ", "Shipping & Delivery", "Returns Policy", "Track Order", "Size Guide", "Contact Us"],
  cart: { title: "Shopping Cart", empty: "Your cart is empty", subtotal: "Subtotal", checkout: "Proceed to Checkout", continueShopping: "Continue Shopping", remove: "Remove" },
  product: { addToCart: "ADD TO CART", sizeGuide: "Size Guide", inStock: "In Stock", reviews: "Reviews", youMayLike: "YOU MAY ALSO LIKE", viewAll: "View all", freeShipping: "Free Shipping over 500 EGP", returns: "30-Day Returns", secure: "Secure Checkout" },
  shop: { title: "SHOP COLLECTION", filters: "Filters", clearAll: "Clear all filters", categories: "Categories", priceRange: "Price Range", size: "Size", color: "Color", noResults: "No products found", clearFilters: "Clear Filters", sort: { latest: "Latest", priceLow: "Price Low-High", priceHigh: "Price High-Low", popular: "Most Popular" }, loadMore: "LOAD MORE" },
  auth: { signIn: "Sign In", signUp: "Create Account", email: "Email address", password: "Password", name: "Full Name", loginBtn: "SIGN IN", registerBtn: "CREATE ACCOUNT", noAccount: "Don't have an account?", hasAccount: "Already have an account?" },
  home: {
    newCollection: "NEW COLLECTION",
    featFreeShipping: "Free Shipping", featFreeShippingDesc: "On orders over 500 EGP",
    featEasyReturns: "Easy Returns", featEasyReturnsDesc: "30-day return policy",
    featSecurePayment: "Secure Payment", featSecurePaymentDesc: "100% safe checkout",
    essentials: "THE ESSENTIALS", essentialsDesc: "Build your wardrobe from the ground up.", viewAllCats: "VIEW ALL CATEGORIES",
    newArrivalsBanner: "NEW ARRIVALS JUST DROPPED", newArrivalsDesc: "Cop them before they're gone.", shopNew: "SHOP NEW",
    latestDrops: "LATEST DROPS", latestDropsDesc: "Fresh fits engineered for the modern streets.", viewAllProducts: "VIEW ALL PRODUCTS",
    whySeenstore: "WHY SEENSTORE?",
    qualityMaterials: "Quality Materials", qualityMaterialsDesc: "Premium fabrics that last.",
    fastDelivery: "Fast Delivery", fastDeliveryDesc: "Get it within 2-3 days.",
    exclusiveDesigns: "Exclusive Designs", exclusiveDesignsDesc: "Stand out from the crowd.",
    easyReturns: "Easy Returns", easyReturnsDesc: "No questions asked.",
    joinMovement: "JOIN THE MOVEMENT",
    joinMovementDesc: "Subscribe to our newsletter for exclusive drops, early access to sales, and insider content.",
    emailPlaceholder: "Enter your email address", subscribe: "SUBSCRIBE",
    shopNowInBanner: "SHOP NOW",
  },
  categories: { tShirts: "T-Shirts", pants: "Pants", hoodies: "Hoodies", accessories: "Accessories" },
  breadcrumb: { home: "Home", shop: "Shop" },
  productDetail: {
    size: "Size", color: "Color", addToCart: "ADD TO CART", sizeGuide: "Size Guide",
    inStock: "In Stock", customerReviews: "CUSTOMER REVIEWS", verified: "Verified",
    youMayAlsoLike: "YOU MAY ALSO LIKE", viewAll: "View all", moreFrom: "More from",
    freeShipping: "Free Shipping over 500 EGP", returns: "30-Day Returns", secure: "Secure Checkout",
    addCartShort: "+ Cart", reviewsCount: "Reviews",
  },
  cartPage: {
    title: "SHOPPING CART", empty: "Your cart is empty",
    emptyDesc: "Looks like you haven't added anything to your cart yet. Discover our latest drops.",
    startShopping: "START SHOPPING", product: "Product", price: "Price",
    quantity: "Quantity", total: "Total", orderSummary: "ORDER SUMMARY",
    promoPlaceholder: "Promo code (try SEEN10)", apply: "APPLY", applied: "APPLIED",
    subtotal: "Subtotal", discount: "Discount (10%)", shipping: "Shipping",
    grandTotal: "Total", checkout: "PROCEED TO CHECKOUT",
    secureCheckout: "Secure encrypted checkout", size: "Size", color: "Color",
    remove: "Remove", continueShopping: "Continue Shopping", free: "FREE",
  },
};

const ar: Translations = {
  nav: { home: "الرئيسية", shop: "المتجر", about: "من نحن", contact: "تواصل معنا", login: "تسجيل الدخول", logout: "تسجيل الخروج" },
  hero: { label: "سين ستور", cta1: "تسوق الآن", cta2: "استعرض الكل" },
  footer: { tagline: "علامة تجارية رجالية عصرية. نُعيد تعريف ستايل الشارع.", shop: "المتجر", support: "الدعم", contact: "تواصل معنا", rights: "جميع الحقوق محفوظة." },
  shopLinks: ["جميع المنتجات", "تيشيرتات", "هوديز", "بناطيل", "إكسسوارات", "وصل حديثاً"],
  supportLinks: ["الأسئلة الشائعة", "الشحن والتوصيل", "سياسة الإرجاع", "تتبع الطلب", "دليل المقاسات", "تواصل معنا"],
  cart: { title: "سلة التسوق", empty: "سلتك فارغة", subtotal: "المجموع", checkout: "إتمام الشراء", continueShopping: "متابعة التسوق", remove: "حذف" },
  product: { addToCart: "أضف للسلة", sizeGuide: "دليل المقاسات", inStock: "متوفر", reviews: "تقييمات", youMayLike: "قد يعجبك أيضاً", viewAll: "عرض الكل", freeShipping: "شحن مجاني فوق 500 جنيه", returns: "إرجاع خلال 30 يوم", secure: "دفع آمن" },
  shop: { title: "تسوق المجموعة", filters: "الفلاتر", clearAll: "مسح الكل", categories: "الأقسام", priceRange: "نطاق السعر", size: "المقاس", color: "اللون", noResults: "لا توجد منتجات", clearFilters: "مسح الفلاتر", sort: { latest: "الأحدث", priceLow: "السعر: من الأقل", priceHigh: "السعر: من الأعلى", popular: "الأكثر مبيعاً" }, loadMore: "عرض المزيد" },
  auth: { signIn: "تسجيل الدخول", signUp: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", name: "الاسم الكامل", loginBtn: "دخول", registerBtn: "إنشاء الحساب", noAccount: "ليس لديك حساب؟", hasAccount: "لديك حساب بالفعل؟" },
  home: {
    newCollection: "مجموعة جديدة",
    featFreeShipping: "شحن مجاني", featFreeShippingDesc: "على طلبات فوق 500 جنيه",
    featEasyReturns: "إرجاع سهل", featEasyReturnsDesc: "سياسة إرجاع 30 يوم",
    featSecurePayment: "دفع آمن", featSecurePaymentDesc: "دفع مئة بالمئة آمن",
    essentials: "الأساسيات", essentialsDesc: "ابنِ خزانة ملابسك من الصفر.", viewAllCats: "عرض كل الأقسام",
    newArrivalsBanner: "وصلت مجموعة جديدة", newArrivalsDesc: "اشتريها قبل ما تخلص.", shopNew: "تسوق الجديد",
    latestDrops: "أحدث الإصدارات", latestDropsDesc: "قطع بتناسب الشارع العصري.", viewAllProducts: "عرض كل المنتجات",
    whySeenstore: "ليه سين ستور؟",
    qualityMaterials: "خامات عالية الجودة", qualityMaterialsDesc: "أقمشة فاخرة تدوم.",
    fastDelivery: "توصيل سريع", fastDeliveryDesc: "وصول خلال 2-3 أيام.",
    exclusiveDesigns: "تصاميم حصرية", exclusiveDesignsDesc: "تميّز عن الباقين.",
    easyReturns: "إرجاع سهل", easyReturnsDesc: "بدون أسئلة.",
    joinMovement: "انضم للحركة",
    joinMovementDesc: "اشترك في النشرة البريدية للحصول على إصدارات حصرية وعروض مبكرة.",
    emailPlaceholder: "أدخل بريدك الإلكتروني", subscribe: "اشترك",
    shopNowInBanner: "تسوق الآن",
  },
  categories: { tShirts: "تيشيرتات", pants: "بناطيل", hoodies: "هوديز", accessories: "إكسسوارات" },
  breadcrumb: { home: "الرئيسية", shop: "المتجر" },
  productDetail: {
    size: "المقاس", color: "اللون", addToCart: "أضف للسلة", sizeGuide: "دليل المقاسات",
    inStock: "متوفر", customerReviews: "آراء العملاء", verified: "موثّق",
    youMayAlsoLike: "قد يعجبك أيضاً", viewAll: "عرض الكل", moreFrom: "المزيد من",
    freeShipping: "شحن مجاني فوق 500 جنيه", returns: "إرجاع خلال 30 يوم", secure: "دفع آمن",
    addCartShort: "+ سلة", reviewsCount: "تقييم",
  },
  cartPage: {
    title: "سلة التسوق", empty: "سلتك فارغة",
    emptyDesc: "يبدو أنك لم تضف أي منتج بعد. اكتشف أحدث مجموعاتنا.",
    startShopping: "ابدأ التسوق", product: "المنتج", price: "السعر",
    quantity: "الكمية", total: "الإجمالي", orderSummary: "ملخص الطلب",
    promoPlaceholder: "كود خصم (جرّب SEEN10)", apply: "تطبيق", applied: "تم التطبيق",
    subtotal: "المجموع الفرعي", discount: "خصم (10%)", shipping: "الشحن",
    grandTotal: "الإجمالي", checkout: "إتمام الشراء",
    secureCheckout: "دفع آمن ومشفّر", size: "المقاس", color: "اللون",
    remove: "حذف", continueShopping: "متابعة التسوق", free: "مجاني",
  },
};

const translations = { en, ar };

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en", setLang: () => {}, t: en, isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "en");

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const isRTL = lang === "ar";

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang, isRTL]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
