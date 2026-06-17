import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useCustomOrders } from "../context/CustomOrdersContext";
import { useLang } from "../context/LanguageContext";
import { Link } from "wouter";
import { Upload, CheckCircle2, Palette, Shirt, Package, FileText, User, Mail } from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { motion, AnimatePresence } from "framer-motion";

const ITEM_TYPES = [
  { value: "T-Shirt", label: "T-Shirt", labelAr: "تيشيرت" },
  { value: "Hoodie", label: "Hoodie", labelAr: "هودي" },
  { value: "Sweatshirt", label: "Sweatshirt", labelAr: "سويت شيرت" },
  { value: "Tank Top", label: "Tank Top", labelAr: "تانك توب" },
  { value: "Polo", label: "Polo", labelAr: "بولو" },
  { value: "Jacket", label: "Jacket", labelAr: "جاكيت" },
  { value: "Shorts", label: "Shorts", labelAr: "شورت" },
  { value: "Cargo Pants", label: "Cargo Pants", labelAr: "كارجو بانت" },
];

const COLORS = ["Black", "White", "Grey", "Navy", "Red", "Olive", "Beige", "Khaki", "Blue"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function CustomDesignPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const { addOrder } = useCustomOrders();
  const { isRTL } = useLang();
  useSEO({
    title:       "تصميم مخصص — Custom Design Order",
    description: "اطلب تصميمك الخاص مع SEENSTORE. ارفع تصميمك وأنشئ ملابس ستريت وير مخصصة 100%. Custom streetwear design orders with SEENSTORE Egypt.",
    keywords:    "تصميم مخصص ملابس مصر, custom design egypt, طباعة ملابس مصر, print on demand egypt, seenstore custom",
    canonical:   "https://seenstore.com/custom-design",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "SEENSTORE Custom Design — تصميم مخصص",
      "description": "خدمة تصميم ملابس ستريت وير مخصصة بالكامل حسب طلبك",
      "provider": { "@type": "Organization", "name": "SEENSTORE" },
      "areaServed": { "@type": "Country", "name": "Egypt" },
      "serviceType": "Custom Clothing Design",
    },
  });

  const [guestName,  setGuestName]  = useState(currentUser?.name  ?? "");
  const [guestEmail, setGuestEmail] = useState(currentUser?.email ?? "");
  const [itemType, setItemType] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [details, setDetails] = useState("");
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDesignFile(file);
    const url = URL.createObjectURL(file);
    setDesignPreview(url);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isAuthenticated) {
      if (!guestName.trim()) errs.guestName = isRTL ? "اكتب اسمك" : "Enter your name";
      if (!guestEmail.trim()) errs.guestEmail = isRTL ? "اكتب بريدك الإلكتروني" : "Enter your email";
    }
    if (!itemType) errs.itemType = isRTL ? "اختر نوع القطعة" : "Choose an item type";
    if (!size) errs.size = isRTL ? "اختر المقاس" : "Choose a size";
    if (!color) errs.color = isRTL ? "اختر اللون" : "Choose a color";
    if (!details.trim()) errs.details = isRTL ? "اكتب تفاصيل التصميم" : "Describe your design";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const name  = isAuthenticated ? (currentUser?.name  ?? guestName)  : guestName;
      const email = isAuthenticated ? (currentUser?.email ?? guestEmail) : guestEmail;
      const id = await addOrder({
        customerName: name,
        customerEmail: email,
        itemType,
        size,
        color,
        designUrl: designPreview,
        details,
      });
      setOrderId(id);
    } catch {
      setErrors({ submit: "Failed to submit order. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3">
            {isRTL ? "تم استلام طلبك!" : "Order Received!"}
          </h2>
          <p className="text-gray-500 mb-2">
            {isRTL ? "رقم طلبك هو:" : "Your order number is:"}
          </p>
          <p className="font-heading text-2xl font-bold text-[#E63946] mb-6">{orderId}</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left mb-8 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{isRTL ? "القطعة:" : "Item:"}</span>
              <span className="font-semibold">{itemType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{isRTL ? "المقاس:" : "Size:"}</span>
              <span className="font-semibold">{size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{isRTL ? "اللون:" : "Color:"}</span>
              <span className="font-semibold">{color}</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-8">
            {isRTL
              ? "هيتواصل معاك فريقنا على بريدك الإلكتروني لتأكيد الطلب والتفاصيل."
              : "Our team will contact you via email to confirm your order and discuss the details."}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="border-2 border-black px-6 py-3 rounded-lg font-bold hover:bg-black hover:text-white transition-colors">
              {isRTL ? "الرئيسية" : "Home"}
            </Link>
            <Link href="/shop" className="bg-[#E63946] text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors">
              {isRTL ? "تسوق المزيد" : "Shop More"}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-24 max-w-3xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isRTL ? "تصميمك الخاص" : "Custom Design"}
        </h1>
        <p className="text-gray-500">
          {isRTL
            ? "ارفع تصميمك واحنا نطبعه على القطعة اللي تختارها"
            : "Upload your design and we'll print it on the item of your choice"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Guest contact info — only shown when not logged in */}
        {!isAuthenticated && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50">
            <p className="sm:col-span-2 text-sm text-gray-500">
              {isRTL ? "اكتب بياناتك عشان نتواصل معاك على طلبك" : "Enter your details so we can contact you about your order"}
            </p>
            <div>
              <label className="flex items-center gap-2 font-heading font-bold text-sm mb-2">
                <User className="w-4 h-4 text-[#E63946]" />
                {isRTL ? "الاسم" : "Name"}
              </label>
              <input
                type="text"
                value={guestName}
                onChange={e => { setGuestName(e.target.value); setErrors(er => ({ ...er, guestName: "" })); }}
                placeholder={isRTL ? "اسمك الكامل" : "Your full name"}
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E63946] transition-colors bg-zinc-900 text-white placeholder:text-gray-500 ${errors.guestName ? "border-[#E63946]" : "border-zinc-700"}`}
              />
              {errors.guestName && <p className="text-[#E63946] text-xs mt-1">{errors.guestName}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 font-heading font-bold text-sm mb-2">
                <Mail className="w-4 h-4 text-[#E63946]" />
                {isRTL ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={e => { setGuestEmail(e.target.value); setErrors(er => ({ ...er, guestEmail: "" })); }}
                placeholder={isRTL ? "بريدك الإلكتروني" : "your@email.com"}
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E63946] transition-colors bg-zinc-900 text-white placeholder:text-gray-500 ${errors.guestEmail ? "border-[#E63946]" : "border-zinc-700"}`}
              />
              {errors.guestEmail && <p className="text-[#E63946] text-xs mt-1">{errors.guestEmail}</p>}
            </div>
          </div>
        )}

        {/* Item Type */}
        <div>
          <label className="flex items-center gap-2 font-heading font-bold text-lg mb-4">
            <Shirt className="w-5 h-5 text-[#E63946]" />
            {isRTL ? "نوع القطعة" : "Item Type"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ITEM_TYPES.map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => { setItemType(item.value); setErrors(e => ({ ...e, itemType: "" })); }}
                className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                  itemType === item.value
                    ? "border-[#E63946] bg-[#E63946] text-white"
                    : "border-gray-200 hover:border-[#E63946] hover:text-[#E63946]"
                }`}
              >
                {isRTL ? item.labelAr : item.label}
              </button>
            ))}
          </div>
          {errors.itemType && <p className="text-[#E63946] text-sm mt-2">{errors.itemType}</p>}
        </div>

        {/* Size */}
        <div>
          <label className="flex items-center gap-2 font-heading font-bold text-lg mb-4">
            <Package className="w-5 h-5 text-[#E63946]" />
            {isRTL ? "المقاس" : "Size"}
          </label>
          <div className="flex flex-wrap gap-3">
            {SIZES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setSize(s); setErrors(e => ({ ...e, size: "" })); }}
                className={`w-16 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                  size === s
                    ? "border-[#E63946] bg-[#E63946] text-white"
                    : "border-gray-200 hover:border-[#E63946] hover:text-[#E63946]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.size && <p className="text-[#E63946] text-sm mt-2">{errors.size}</p>}
        </div>

        {/* Color */}
        <div>
          <label className="flex items-center gap-2 font-heading font-bold text-lg mb-4">
            <Palette className="w-5 h-5 text-[#E63946]" />
            {isRTL ? "لون القطعة" : "Item Color"}
          </label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setErrors(e => ({ ...e, color: "" })); }}
                className={`px-4 py-2 rounded-xl border-2 font-medium text-sm transition-all ${
                  color === c
                    ? "border-[#E63946] bg-[#E63946] text-white"
                    : "border-gray-200 hover:border-[#E63946] hover:text-[#E63946]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {errors.color && <p className="text-[#E63946] text-sm mt-2">{errors.color}</p>}
        </div>

        {/* Design Upload */}
        <div>
          <label className="flex items-center gap-2 font-heading font-bold text-lg mb-4">
            <Upload className="w-5 h-5 text-[#E63946]" />
            {isRTL ? "ارفع التصميم" : "Upload Design"}
            <span className="text-sm font-normal text-gray-400">({isRTL ? "اختياري" : "Optional"})</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#E63946] transition-colors group"
          >
            {designPreview ? (
              <div className="flex flex-col items-center gap-3">
                <img src={designPreview} alt="Design preview" className="max-h-40 max-w-full rounded-lg object-contain" />
                <p className="text-sm text-gray-500">{designFile?.name}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDesignFile(null); setDesignPreview(null); }}
                  className="text-xs text-[#E63946] hover:underline"
                >
                  {isRTL ? "إزالة" : "Remove"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-[#E63946] transition-colors">
                <Upload className="w-10 h-10" />
                <p className="font-semibold">{isRTL ? "اضغط لرفع التصميم" : "Click to upload design"}</p>
                <p className="text-xs">{isRTL ? "PNG، JPG، SVG — حجم أقصى 10MB" : "PNG, JPG, SVG — Max 10MB"}</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Details */}
        <div>
          <label className="flex items-center gap-2 font-heading font-bold text-lg mb-4">
            <FileText className="w-5 h-5 text-[#E63946]" />
            {isRTL ? "تفاصيل التصميم" : "Design Details"}
          </label>
          <textarea
            value={details}
            onChange={e => { setDetails(e.target.value); setErrors(er => ({ ...er, details: "" })); }}
            placeholder={isRTL
              ? "اكتب بالتفصيل التصميم اللي عايزه، الألوان، المكان على القطعة، أي ملاحظات إضافية..."
              : "Describe your design in detail — colors, placement on the item, any special notes..."}
            rows={5}
            className={`w-full border-2 rounded-2xl px-5 py-4 text-sm resize-none focus:outline-none focus:border-[#E63946] transition-colors bg-zinc-900 text-white placeholder:text-gray-500 ${
              errors.details ? "border-[#E63946]" : "border-zinc-700"
            }`}
          />
          {errors.details && <p className="text-[#E63946] text-sm mt-1">{errors.details}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#E63946] text-white font-bold py-4 rounded-xl text-lg hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {isRTL ? "جاري الإرسال..." : "Submitting..."}
            </>
          ) : (
            isRTL ? "أرسل الطلب" : "Submit Order"
          )}
        </button>
      </form>
    </div>
  );
}
