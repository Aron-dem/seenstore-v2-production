import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, Truck, RefreshCcw, ShieldCheck, Star, Heart, Flame, Palette, ChevronDown } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { useWishlist } from "../context/WishlistContext";
import { deriveProductVariants, getColorHex, type ColorVariant } from "../lib/productVariants";
import SeenstoreLogo from "../components/SeenstoreLogo";
import { useSEO } from "../hooks/useSEO";

type ApiProduct = {
  id: number; name: string; nameAr: string;
  price: number; originalPrice: number | null;
  category: string; badge: string | null;
  sizes: string[]; colors: string[]; images: string[];
  variants?: ColorVariant[];
  inStock: boolean;
};

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'%3E%3Crect fill='%23f3f4f6' width='400' height='533'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESEENSTORE%3C/text%3E%3C/svg%3E";

import heroImg from "../assets/hero.png";
import catSummer from "../assets/cat-tshirts.png";
import catWinter from "../assets/cat-hoodies.png";

const faqsEn = [
  { q: "How long does shipping take?",           a: "Standard shipping takes 2–5 business days. Express (1–2 days) is available at checkout." },
  { q: "Can I return or exchange an item?",       a: "Yes — unworn items in original packaging within 14 days. Sale items and custom pieces are final sale." },
  { q: "How do I track my order?",               a: "After shipping you'll receive a tracking link by email/SMS. You can also visit the Track Order page." },
  { q: "Are your sizes true to size?",           a: "Our pieces are generally oversized streetwear cuts. Check the Size Guide on each product page." },
  { q: "Do you ship outside Egypt?",             a: "Not yet — we currently ship within Egypt only. International shipping is coming soon." },
  { q: "How does custom design work?",           a: "Upload your artwork on the Custom Design page, choose your base item, and we'll produce it in 5–7 days." },
];

const faqsAr = [
  { q: "كم يستغرق وقت الشحن؟",                  a: "الشحن العادي يستغرق 2–5 أيام عمل. الشحن السريع (1–2 يوم) متاح عند الدفع." },
  { q: "هل يمكنني الإرجاع أو الاستبدال؟",         a: "نعم — القطع غير المستخدمة في تغليفها الأصلي خلال 14 يوم. منتجات التخفيضات والتصاميم المخصصة غير قابلة للإرجاع." },
  { q: "كيف أتابع طلبي؟",                        a: "بعد الشحن ستصلك رسالة تتبع على بريدك الإلكتروني أو رقم هاتفك. يمكنك أيضاً زيارة صفحة تتبع الطلب." },
  { q: "هل المقاسات مناسبة للمقاسات العادية؟",     a: "قطعنا مصممة بشكل عام على قصة Oversized الواسعة. راجع دليل المقاسات في صفحة كل منتج." },
  { q: "هل تشحنون خارج مصر؟",                   a: "ليس بعد — نشحن حالياً داخل مصر فقط. الشحن الدولي قادم قريباً." },
  { q: "كيف يعمل التصميم المخصص؟",               a: "ارفع تصميمك من صفحة التصميم المخصص، اختر القطعة المناسبة وسنجهزها في 5–7 أيام." },
];

function FaqSection({ isRTL }: { isRTL: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = isRTL ? faqsAr : faqsEn;

  return (
    <section id="faq" className="py-24 bg-black" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block bg-[#E63946]/10 text-[#E63946] text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest mb-4">
            {isRTL ? "الأسئلة الشائعة" : "FAQ"}
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">
            {isRTL ? "أسئلة مهمة؟" : "Got Questions?"}
          </h2>
          <p className="text-gray-400 mt-3 text-lg">
            {isRTL ? "كل ما تحتاج معرفته في مكان واحد" : "Everything you need to know, in one place"}
          </p>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={`w-full ${isRTL ? "text-right" : "text-left"} bg-white/5 rounded-xl px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/10 transition-all border border-white/10 ${open === i ? "border-[#E63946]/40" : ""}`}
              >
                <span className="font-semibold text-white text-base">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform duration-300 ${open === i ? "rotate-180 text-[#E63946]" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 px-6 pb-5 text-gray-300 leading-relaxed rounded-b-xl border border-t-0 border-white/10">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { t, isRTL } = useLang();
  const { toggleWishlist, isWishlisted } = useWishlist();
  useSEO({
    title:       "SEENSTORE | ملابس ستريت وير مصر — Egyptian Streetwear Brand",
    description: "SEENSTORE — أحدث تشكيلات الستريت وير المصري. هوديز، كارجو بانت، وتيشيرتات بجودة عالية. شحن لجميع أنحاء مصر. تصاميم مخصصة على الطلب.",
    keywords:    "seenstore, ستريت وير مصر, streetwear egypt, ملابس شبابية مصر, هوديز مصر, كارجو بانت, تيشيرتات, urban fashion egypt, egyptian streetwear",
    canonical:   "https://seenstore.com/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "SEENSTORE — Egyptian Streetwear Brand",
      "description": "أحدث تشكيلات الستريت وير المصري. هوديز، كارجو، وتيشيرتات.",
      "url": "https://seenstore.com/",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://seenstore.com/" }],
      },
    },
  });

  const categories = [
    { id: 1, name: isRTL ? "كولكشن الصيف" : "Summer Collection", image: catSummer, href: "/shop/summer" },
    { id: 2, name: isRTL ? "كولكشن الشتاء" : "Winter Collection", image: catWinter, href: "/shop/winter" },
  ];

  const [featuredProducts, setFeaturedProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts((data.products ?? []).slice(0, 4));
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const features = [
    { icon: Truck, title: t.home.featFreeShipping, desc: t.home.featFreeShippingDesc },
    { icon: RefreshCcw, title: t.home.featEasyReturns, desc: t.home.featEasyReturnsDesc },
    { icon: ShieldCheck, title: t.home.featSecurePayment, desc: t.home.featSecurePaymentDesc },
  ];

  const reasons = [
    { title: t.home.qualityMaterials, desc: t.home.qualityMaterialsDesc, icon: ShieldCheck },
    { title: t.home.fastDelivery, desc: t.home.fastDeliveryDesc, icon: Truck },
    { title: t.home.exclusiveDesigns, desc: t.home.exclusiveDesignsDesc, icon: Star },
    { title: t.home.easyReturns, desc: t.home.easyReturnsDesc, icon: RefreshCcw },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[100dvh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />
          <img src={heroImg} alt="Urban streetwear model" className="w-full h-full object-cover" style={{ objectPosition: "50% 15%" }} />
        </div>
        <div className="container relative z-20 mx-auto px-6 md:px-12 max-w-[1400px] mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`max-w-2xl text-white ${isRTL ? "text-right" : "text-left"}`}
          >
            <p className="text-[#E63946] font-semibold text-xs tracking-[0.4em] uppercase mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-[#E63946]" />
              SEENSTORE
            </p>
            <h1 className="font-display text-[5.5rem] md:text-[8rem] lg:text-[10rem] leading-[0.9] mb-10 text-white">
              {t.home.newCollection.split(" ").map((word, i) => (<span key={i}>{word}<br/></span>))}
            </h1>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop" className="bg-[#E63946] text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(230,57,70,0.3)] transform hover:-translate-y-1 block text-center">
                {t.hero.cta1}
              </Link>
              <Link href="/custom-design" className="bg-white/10 backdrop-blur-sm text-white border border-white/20 font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-black transition-all duration-300 block text-center flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {isRTL ? "تصميمك الخاص" : "Custom Design"}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-black py-8 border-y border-white/10 relative z-30">
        <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-white/10 text-white">
            {features.map((feature, idx) => (
              <div key={idx} className={`flex items-center gap-4 ${idx !== 0 ? 'pt-8 md:pt-0 md:px-8' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-[#E63946]/10 flex items-center justify-center text-[#E63946] flex-shrink-0">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm tracking-wide">{feature.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-white">{t.home.essentials}</h2>
              <p className="text-gray-400 mt-2">{t.home.essentialsDesc}</p>
            </div>
            <Link href="/shop" className="group flex items-center text-sm font-semibold hover:text-[#E63946] transition-colors block">
              {t.home.viewAllCats}
              <ChevronRight className={`w-4 h-4 ${isRTL ? "mr-1 rotate-180" : "ml-1"} group-hover:translate-x-1 transition-transform`} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map((cat, idx) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: idx * 0.1 }}>
                <Link href={cat.href} className="group relative h-[400px] rounded-xl overflow-hidden cursor-pointer block">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 z-10" />
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 z-20 flex flex-col justify-end p-6">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="font-heading text-2xl font-bold text-white mb-2">{cat.name}</h3>
                      <span className="inline-flex items-center text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {t.home.shopNowInBanner} <ChevronRight className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Banner */}
      <section className="bg-[#E63946] py-16 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-heading font-bold mb-4">{t.home.newArrivalsBanner}</h2>
          <p className="mb-6">{t.home.newArrivalsDesc}</p>
          <Link href="/shop" className="inline-block bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-black hover:text-white transition">
            {t.home.shopNew}
          </Link>
        </div>
      </section>

      {/* Featured Products — Best This Month */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Flame className="w-4 h-4" />
              {isRTL ? "الأكثر طلباً هذا الشهر" : "Best Orders This Month"}
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">{t.home.latestDrops}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t.home.latestDropsDesc}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.map((product, idx) => {
              const img = product.images[0] ?? PLACEHOLDER;
              const displayName = isRTL && product.nameAr ? product.nameAr : product.name;
              const variants = deriveProductVariants(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
                    {product.badge && (
                      <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 rounded text-white ${product.badge === "SALE" ? "bg-[#E63946]" : "bg-black"}`}>
                        {product.badge}
                      </span>
                    )}
                    <Link href={`/product/${product.id}`} className="block w-full h-full">
                      <img src={img} alt={displayName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                    </Link>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className={`absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center z-10 transition-all hover:scale-110 ${isWishlisted(product.id) ? "text-[#E63946]" : "text-gray-400 hover:text-[#E63946]"}`}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted(product.id) ? "fill-[#E63946]" : ""}`} />
                    </button>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-heading font-semibold text-sm md:text-base text-white mb-1 line-clamp-1">{displayName}</h3>
                    {variants.length > 0 && (
                      <div className="flex items-center gap-1 mb-2 flex-wrap">
                        {variants.slice(0, 3).map((variant) => (
                          <span key={variant.color} title={variant.color} className="w-2.5 h-2.5 rounded-full inline-block border border-gray-600" style={{ backgroundColor: getColorHex(variant.color, variant.hex) }} />
                        ))}
                        <span className="text-xs text-gray-400">{variants[0]?.color}</span>
                      </div>
                    )}
                    <p className="font-heading font-bold text-sm md:text-lg text-white">{product.price} EGP</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-16 flex justify-center">
            <Link href="/shop" className="border-2 border-white text-white font-semibold px-10 py-4 rounded-lg hover:bg-white hover:text-black transition-colors inline-block text-center">
              {t.home.viewAllProducts}
            </Link>
          </div>
        </div>
      </section>

      {/* Custom Design Banner */}
      <section className="bg-black py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnpNMTIgMzR2NmgtNnYtNmg2ek0xMiAxMHY2aC02di02aDZ6TTM2IDEwdjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="container relative z-10 mx-auto px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 bg-[#E63946]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Palette className="w-8 h-8 text-[#E63946]" />
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {isRTL ? "صمّم قطعتك بنفسك" : "Design Your Own Piece"}
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              {isRTL
                ? "ارفع تصميمك واحنا نطبعه على أي قطعة تختارها — تيشيرت، هودي، وأكتر"
                : "Upload your design and we'll print it on any item you choose — T-shirt, hoodie, and more"}
            </p>
            <Link href="/custom-design" className="inline-block bg-[#E63946] text-white font-bold px-10 py-4 rounded-lg hover:bg-white hover:text-black transition-colors">
              {isRTL ? "اطلب تصميمك الآن" : "Start Custom Order"}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why SEENSTORE */}
      <section id="about" className="py-24 bg-black">
        <div className="container mx-auto px-6 max-w-[1400px]">
          <div className="flex items-center justify-center gap-4 mb-16">
            <span className="font-heading text-3xl md:text-4xl font-bold text-white">{isRTL ? "لماذا" : "WHY"}</span>
            <div style={{ direction: "ltr" }}><SeenstoreLogo size="lg" /></div>
            <span className="font-heading text-3xl md:text-4xl font-bold text-white">{isRTL ? "؟" : "?"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {reasons.map((r, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-[#E63946] mb-4">
                  <r.icon className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-semibold mb-2 text-white">{r.title}</h3>
                <p className="text-gray-400 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection isRTL={isRTL} />

    </>
  );
}
