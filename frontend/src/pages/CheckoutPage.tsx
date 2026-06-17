import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  ChevronRight, MapPin, Truck, Tag, Star, Smartphone,
  CheckCircle2, Loader2, ArrowLeft, Upload, X, Phone, LogIn,
} from "lucide-react";
import { toast } from "../components/ui/sonner";

type Step = "address" | "shipping" | "review" | "vf_payment" | "post_confirm";

interface ShippingAddress {
  fullName: string; phone: string;
  governorate: string; city: string;
  street: string; postalCode: string;
}

const SHIPPING_METHODS = [
  { id: "standard",  nameAr: "شحن عادي",        nameEn: "Standard Shipping",  cost: 50,  daysAr: "3-5 أيام عمل",  daysEn: "3-5 business days" },
  { id: "express",   nameAr: "شحن سريع",        nameEn: "Express Shipping",   cost: 150, daysAr: "1-2 يوم عمل",   daysEn: "1-2 business days" },
  { id: "overnight", nameAr: "توصيل في اليوم",  nameEn: "Overnight Delivery", cost: 300, daysAr: "اليوم التالي",  daysEn: "Next business day" },
];

const GOVS = [
  "Cairo","Alexandria","Giza","Qalyubia","Monufia","Dakahlia","Damietta",
  "Port Said","Ismailia","Suez","Beheira","Kafr El-Sheikh","Gharbia",
  "Aswan","Luxor","Qena","Sohag","Assiut","Minya","Beni Suef","Fayoum",
  "New Cairo","6th of October","New Administrative Capital",
];

const VF_NUMBER = "01018957428";
const DRAFT_KEY = "seenstore_checkout_draft";
const STEP_ORDER: Step[] = ["address", "shipping", "review", "vf_payment", "post_confirm"];

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 900;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { isAuthenticated, currentUser } = useAuth();
  const { lang } = useLang();
  const [, setLocation] = useLocation();
  const ar = lang === "ar";

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: currentUser?.name || "", phone: "",
    governorate: "", city: "", street: "", postalCode: "",
  });
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [couponInput,   setCouponInput]   = useState("");
  const [couponCode,    setCouponCode]    = useState("");
  const [couponRate,    setCouponRate]    = useState(0);
  const [vfPhone,        setVfPhone]        = useState("");
  const [screenshotB64,  setScreenshotB64]  = useState("");
  const [orderId,        setOrderId]        = useState<string | null>(null);
  const [guestPhone,     setGuestPhone]     = useState("");
  const [phoneSent,      setPhoneSent]      = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [couponLoading,  setCouponLoading]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.address)          setAddress(a => ({ ...a, ...d.address }));
      if (d.selectedShipping) setSelectedShipping(d.selectedShipping);
      if (d.couponCode)       { setCouponCode(d.couponCode); setCouponInput(d.couponCode); setCouponRate(d.couponRate || 0); }
    } catch {}
  }, []);

  useEffect(() => {
    if (step !== "post_confirm") {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ address, selectedShipping, couponCode, couponRate }));
    }
  }, [address, selectedShipping, couponCode, couponRate, step]);

  const shippingFee    = cartTotal > 500 ? 0 : (SHIPPING_METHODS.find(s => s.id === selectedShipping)?.cost ?? 50);
  const couponDiscount = Math.round(cartTotal * couponRate);
  const loginDiscount  = (isAuthenticated && couponRate === 0) ? Math.round(cartTotal * 0.10) : 0;
  const finalTotal     = Math.max(0, cartTotal + shippingFee - couponDiscount - loginDiscount);
  const depositAmount  = Math.ceil(finalTotal * 0.25);

  if (items.length === 0 && !orderId) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-3xl text-center">
        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <MapPin className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-3xl font-bold mb-4">{ar ? "سلتك فارغة" : "Your cart is empty"}</h1>
        <button onClick={() => setLocation("/shop")} className="inline-flex items-center gap-2 bg-[#E63946] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors">
          {ar ? "تسوق الآن" : "Shop Now"} <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const res  = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        toast.error(ar ? (data.error ?? "الكوبون غير صالح") : (data.error ?? "Invalid coupon code"));
        return;
      }
      const rate = data.discountRate / 100;
      setCouponCode(data.code); setCouponRate(rate);
      toast.success(ar ? `✓ تم تطبيق كوبون ${data.code} (خصم ${data.discountRate}%)` : `✓ Coupon ${data.code} applied (${data.discountRate}% off)`);
    } catch {
      toast.error(ar ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong");
    } finally { setCouponLoading(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { toast.error(ar ? "الصورة أكبر من 12MB" : "File too large (max 12MB)"); return; }
    try {
      const b64 = await compressImage(file);
      setScreenshotB64(b64);
    } catch {
      toast.error(ar ? "فشل تحميل الصورة" : "Failed to load image");
    }
  };

  const handlePlaceOrder = async () => {
    if (!screenshotB64) { toast.error(ar ? "يرجى رفع اسكرين شوت الدفع أولاً" : "Please upload payment screenshot first"); return; }
    if (!vfPhone.trim() || vfPhone.trim().length < 10) { toast.error(ar ? "يرجى إدخال رقم المحفظة الصحيح" : "Please enter your Vodafone Cash number"); return; }
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = localStorage.getItem("seen_access_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/orders", {
        method: "POST", headers,
        body: JSON.stringify({
          items, subtotal: cartTotal, shippingFee, total: finalTotal,
          shippingAddress: address, paymentMethod: "vodafone_cash",
          customerName: address.fullName,
          customerEmail: currentUser?.email || "guest@seenstore.com",
          couponCode: couponCode || null, couponDiscount,
          depositAmount, paymentScreenshot: screenshotB64,
          vfSenderPhone: vfPhone.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const order = await res.json();
      setOrderId(order.id);
      clearCart();
      localStorage.removeItem(DRAFT_KEY);
      setStep("post_confirm");
    } catch {
      toast.error(ar ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again");
    } finally { setIsLoading(false); }
  };

  const handleGuestPhoneSubmit = async () => {
    if (!guestPhone.trim() || guestPhone.trim().length < 10) {
      toast.error(ar ? "يرجى إدخال رقم صحيح" : "Please enter a valid number"); return;
    }
    try {
      await fetch(`/api/orders/${orderId}/guest-phone`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestPhone: guestPhone.trim() }),
      });
    } catch {}
    setPhoneSent(true);
  };

  const STEPS_UI = [
    { key: "address",    labelAr: "العنوان",  labelEn: "Address" },
    { key: "shipping",   labelAr: "الشحن",    labelEn: "Shipping" },
    { key: "review",     labelAr: "المراجعة", labelEn: "Review" },
    { key: "vf_payment", labelAr: "الدفع",    labelEn: "Payment" },
  ] as const;

  const stepIdx = (s: Step) => STEP_ORDER.indexOf(s);

  const OrderSidebar = () => (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 sticky top-24">
      <h3 className="font-bold mb-4">{ar ? "ملخص الطلب" : "Order Summary"}</h3>
      <div className="space-y-2 mb-4 pb-4 border-b text-sm">
        {items.map(it => (
          <div key={it.id} className="flex justify-between gap-2">
            <span className="text-gray-600 truncate">{it.name} ×{it.quantity}</span>
            <span className="font-bold whitespace-nowrap">{(it.price * it.quantity)} EGP</span>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between"><span className="text-gray-500">{ar ? "المجموع الفرعي" : "Subtotal"}</span><span>{cartTotal} EGP</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{ar ? "الشحن" : "Shipping"}</span><span>{shippingFee === 0 ? (ar ? "مجاني 🎉" : "FREE 🎉") : `${shippingFee} EGP`}</span></div>
        {couponDiscount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>{ar ? "خصم الكوبون" : "Coupon discount"}</span><span>−{couponDiscount} EGP</span></div>}
        {loginDiscount  > 0 && <div className="flex justify-between text-green-600 font-bold"><span>{ar ? "🎁 خصم أول طلب" : "🎁 First order"}</span><span>−{loginDiscount} EGP</span></div>}
      </div>
      <div className="flex justify-between font-bold text-lg pt-3 border-t">
        <span>{ar ? "الإجمالي" : "Total"}</span>
        <span className="text-[#E63946]">{finalTotal} EGP</span>
      </div>
      {step === "vf_payment" && (
        <div className="mt-4 bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">{ar ? "المطلوب الآن (ربع الإجمالي)" : "Due now (25% deposit)"}</p>
          <p className="text-3xl font-black text-[#E63946]">{depositAmount} <span className="text-lg">EGP</span></p>
        </div>
      )}
    </div>
  );

  if (step === "post_confirm" && orderId) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{ar ? "تم استلام طلبك! 🎉" : "Order Received! 🎉"}</h1>
          <p className="text-gray-500 text-sm mb-1">{ar ? "رقم الطلب" : "Order ID"}: <span className="font-mono font-bold text-[#E63946]">{orderId}</span></p>
          <p className="text-gray-400 text-sm">{ar ? "جاري مراجعة الدفع — سيتم التواصل معك خلال 2-3 ساعات." : "Payment is being reviewed — we'll contact you within 2-3 hours."}</p>
        </div>

        {!phoneSent ? (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-7 flex flex-col">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-2">{ar ? "سجل دخولك" : "Sign In"}</h3>
              <p className="text-gray-300 text-sm mb-4 flex-1">{ar ? "تابع حالة طلبك في أي وقت من حسابك الشخصي." : "Track your order status anytime from your account."}</p>
              <div className="bg-[#E63946]/25 border border-[#E63946]/50 rounded-xl p-3 mb-5">
                <p className="text-[#E63946] font-bold text-sm">🎁 {ar ? "خصم 10% على أول طلب!" : "10% off your first order!"}</p>
                <p className="text-gray-300 text-xs mt-1">{ar ? "بالإضافة لأي كوبون خصم آخر" : "Stacks on top of any coupon"}</p>
              </div>
              <button
                onClick={() => setLocation(`/auth?redirect=/track-order`)}
                className="w-full bg-[#E63946] text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                {ar ? "سجل الدخول الآن ←" : "Sign In Now →"}
              </button>
            </div>

            <div className="bg-white text-gray-900 border-2 border-gray-100 rounded-2xl p-7 flex flex-col">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-5">
                <Phone className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">{ar ? "استمر بدون تسجيل" : "Continue as Guest"}</h3>
              <p className="text-gray-500 text-sm mb-4 flex-1">
                {ar ? "اكتب رقم تليفونك وهنتواصل معاك خلال 2-3 ساعات لتأكيد الطلب." : "Enter your phone and we'll contact you within 2-3 hours to confirm."}
              </p>
              <input
                type="tel"
                value={guestPhone}
                onChange={e => setGuestPhone(e.target.value)}
                placeholder={ar ? "01xxxxxxxxx" : "01xxxxxxxxx"}
                className="w-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 p-3 rounded-xl text-sm focus:border-[#E63946] outline-none mb-3"
                dir="ltr"
              />
              <button
                onClick={handleGuestPhoneSubmit}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
              >
                {ar ? "تأكيد الرقم" : "Confirm Number"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-2xl mb-3">{ar ? "تم! 🎉" : "Done! 🎉"}</h3>
            <p className="text-gray-600 mb-2">{ar ? "سيتم التواصل معك خلال 2-3 ساعات لتأكيد طلبك وترتيب التسليم." : "We'll contact you within 2-3 hours to confirm your order and arrange delivery."}</p>
            <p className="text-gray-400 text-sm">رقم الطلب: <span className="font-mono font-bold text-[#E63946]">{orderId}</span></p>
            <button onClick={() => setLocation("/")} className="mt-6 bg-[#E63946] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors">
              {ar ? "العودة للرئيسية" : "Back to Home"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16 max-w-[1200px]">
      <h1 className="text-3xl font-bold mb-8">{ar ? "إتمام الشراء" : "Checkout"}</h1>

      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
        {STEPS_UI.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              step === s.key          ? "bg-[#E63946] text-white shadow-md shadow-red-200" :
              stepIdx(step) > i      ? "bg-green-500 text-white" :
              "bg-gray-100 text-gray-400"}`}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {stepIdx(step) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </span>
              <span>{ar ? s.labelAr : s.labelEn}</span>
            </div>
            {i < STEPS_UI.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {step === "address" && (
            <div className="bg-white text-gray-900 p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#E63946]" />
                {ar ? "عنوان الشحن" : "Shipping Address"}
              </h2>

              {!isAuthenticated && (
                <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">🎁 {ar ? "سجل دخولك واحصل على خصم 10% على أول طلب!" : "Sign in & get 10% off your first order!"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ar ? "بالإضافة لأي كوبون خصم" : "Stacks with any coupon discount"}</p>
                    <button onClick={() => setLocation("/auth")} className="text-[#E63946] text-xs font-bold mt-2 hover:underline">
                      {ar ? "سجل الدخول الآن ←" : "Sign in now →"}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={e => {
                e.preventDefault();
                if (!address.fullName || !address.phone || !address.governorate || !address.street) {
                  toast.error(ar ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields"); return;
                }
                setStep("shipping");
              }} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">{ar ? "الاسم الكامل *" : "Full Name *"}</label>
                    <input type="text" value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 p-3 rounded-xl focus:border-[#E63946] outline-none transition-colors"
                      placeholder={ar ? "أحمد محمد" : "Ahmed Mohamed"} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">{ar ? "رقم الهاتف *" : "Phone *"}</label>
                    <input type="tel" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })}
                      className="w-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 p-3 rounded-xl focus:border-[#E63946] outline-none transition-colors"
                      placeholder="01xxxxxxxxx" dir="ltr" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">{ar ? "المحافظة *" : "Governorate *"}</label>
                    <select value={address.governorate} onChange={e => setAddress({ ...address, governorate: e.target.value })}
                      className="w-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 p-3 rounded-xl focus:border-[#E63946] outline-none transition-colors">
                      <option value="">{ar ? "اختر المحافظة" : "Select governorate"}</option>
                      {GOVS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">{ar ? "المدينة / الحي" : "City / District"}</label>
                    <input type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })}
                      className="w-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 p-3 rounded-xl focus:border-[#E63946] outline-none transition-colors"
                      placeholder={ar ? "مدينة نصر" : "Nasr City"} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">{ar ? "عنوان الشارع *" : "Street Address *"}</label>
                  <input type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })}
                    className="w-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 p-3 rounded-xl focus:border-[#E63946] outline-none transition-colors"
                    placeholder={ar ? "مثال: 15 شارع النيل، عمارة 3، شقة 5" : "e.g. 15 Nile St, Building 3, Apt 5"} />
                </div>
                <button type="submit" className="w-full bg-[#E63946] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors mt-2">
                  {ar ? "متابعة للشحن ←" : "Continue to Shipping →"}
                </button>
              </form>
            </div>
          )}

          {step === "shipping" && (
            <div className="bg-white text-gray-900 p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#E63946]" />
                {ar ? "طريقة الشحن" : "Shipping Method"}
              </h2>
              <div className="space-y-3">
                {SHIPPING_METHODS.map(m => (
                  <label key={m.id} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedShipping === m.id ? "border-[#E63946] bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="shipping" value={m.id} checked={selectedShipping === m.id} onChange={e => setSelectedShipping(e.target.value)} className="w-4 h-4" />
                    <div className="flex-1 mx-4">
                      <div className="font-bold">{ar ? m.nameAr : m.nameEn}</div>
                      <div className="text-sm text-gray-500">{ar ? m.daysAr : m.daysEn}</div>
                    </div>
                    <div className="font-bold">{(m.cost === 0 || cartTotal > 500) ? (ar ? "مجاني 🎉" : "FREE 🎉") : `${m.cost} EGP`}</div>
                  </label>
                ))}
              </div>
              {cartTotal > 500 && (
                <p className="text-green-600 text-sm font-bold mt-3 text-center">🎉 {ar ? "مبروك! الشحن مجاني على طلبات أكثر من 500 جنيه" : "Free shipping on orders over 500 EGP!"}</p>
              )}
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep("address")} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold hover:border-gray-400 transition-colors">{ar ? "→ رجوع" : "← Back"}</button>
                <button onClick={() => setStep("review")} className="flex-1 bg-[#E63946] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">{ar ? "مراجعة الطلب ←" : "Review Order →"}</button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="bg-white text-gray-900 p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6">{ar ? "مراجعة طلبك" : "Review Your Order"}</h2>
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 mb-2">{ar ? "عنوان الشحن" : "Shipping Address"}</p>
                  <p className="font-bold">{address.fullName}</p>
                  <p className="text-sm text-gray-600">{address.street}{address.city ? `، ${address.city}` : ""}، {address.governorate}</p>
                  <p className="text-sm text-gray-500">{address.phone}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-400 mb-1">{ar ? "طريقة الشحن" : "Shipping Method"}</p>
                  <p className="font-bold">{ar ? SHIPPING_METHODS.find(s => s.id === selectedShipping)?.nameAr : SHIPPING_METHODS.find(s => s.id === selectedShipping)?.nameEn} — {shippingFee === 0 ? (ar ? "مجاني" : "FREE") : `${shippingFee} EGP`}</p>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <p className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#E63946]" />
                  {ar ? "كوبون الخصم (اختياري)" : "Discount Coupon (Optional)"}
                </p>
                {couponCode ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-bold text-green-700 flex-1">{couponCode} — خصم {Math.round(couponRate * 100)}% (−{couponDiscount} EGP)</span>
                    <button onClick={() => { setCouponCode(""); setCouponRate(0); setCouponInput(""); }} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)} onKeyDown={e => e.key === "Enter" && applyCoupon()}
                      placeholder={ar ? "أدخل كود الخصم هنا" : "Enter discount code"}
                      className="flex-1 border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl focus:border-[#E63946] outline-none uppercase text-sm transition-colors" />
                    <button onClick={applyCoupon} disabled={couponLoading} className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-black transition-colors text-sm disabled:opacity-60 flex items-center gap-2">
                      {couponLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {ar ? "تطبيق" : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {isAuthenticated && loginDiscount > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-yellow-800">
                    🎁 {ar ? `خصم أول طلب 10% — تم خصم ${loginDiscount} جنيه!` : `First order 10% discount — ${loginDiscount} EGP saved!`}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep("shipping")} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold hover:border-gray-400 transition-colors">{ar ? "→ رجوع" : "← Back"}</button>
                <button onClick={() => setStep("vf_payment")} className="flex-1 bg-[#E63946] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">{ar ? "الدفع ←" : "Payment →"}</button>
              </div>
            </div>
          )}

          {step === "vf_payment" && (
            <div className="bg-white text-gray-900 p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#E63946]" />
                {ar ? "الدفع عبر فودافون كاش" : "Pay via Vodafone Cash"}
              </h2>
              <p className="text-gray-500 text-sm mb-7">
                {ar ? "ادفع ربع المبلغ مقدماً لتأكيد طلبك، والباقي يُدفع عند الاستلام." : "Pay 25% deposit to confirm your order. The rest is paid on delivery."}
              </p>

              <div className="bg-gradient-to-br from-red-50 to-red-100/40 border border-red-200 rounded-2xl p-7 mb-7 text-center">
                <p className="text-sm text-gray-500 mb-1">{ar ? "حوّل هذا المبلغ على فودافون كاش" : "Transfer via Vodafone Cash"}</p>
                <p className="text-5xl font-black text-[#E63946] my-3">{depositAmount}</p>
                <p className="text-gray-600 font-bold text-lg mb-4">EGP</p>
                <p className="text-sm text-gray-500 mb-2">{ar ? "على الرقم" : "To this number"}</p>
                <div className="inline-block bg-white border-2 border-[#E63946] rounded-2xl px-8 py-4">
                  <p className="text-3xl font-black font-mono tracking-widest text-gray-900">{VF_NUMBER}</p>
                </div>
                <p className="text-xs text-gray-400 mt-4">{ar ? "الباقي ({remaining} EGP) يُدفع عند استلام الطلب" : `Remaining (${finalTotal - depositAmount} EGP) paid on delivery`}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">
                  {ar ? "ارفع اسكرين شوت الدفع *" : "Upload Payment Screenshot *"}
                </label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {screenshotB64 ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-400">
                    <img src={screenshotB64} alt="payment proof" className="w-full max-h-64 object-contain bg-gray-50" />
                    <button
                      onClick={() => { setScreenshotB64(""); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {ar ? "تم رفع الصورة ✓" : "Uploaded ✓"}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-[#E63946] hover:bg-red-50/50 transition-all flex flex-col items-center gap-3 group"
                  >
                    <div className="w-14 h-14 bg-gray-100 group-hover:bg-red-100 rounded-full flex items-center justify-center transition-colors">
                      <Upload className="w-7 h-7 text-gray-400 group-hover:text-[#E63946] transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-gray-600 group-hover:text-[#E63946] transition-colors">{ar ? "اضغط هنا لرفع الاسكرين شوت" : "Click to upload screenshot"}</span>
                    <span className="text-xs text-gray-400">{ar ? "JPG, PNG, WEBP — أقصى 12MB" : "JPG, PNG, WEBP — max 12MB"}</span>
                  </button>
                )}
              </div>

              <div className="mb-7">
                <label className="block text-sm font-bold mb-2">
                  {ar ? "رقم المحفظة اللي حولت منه *" : "Your Vodafone Cash sender number *"}
                </label>
                <input
                  type="tel" value={vfPhone} onChange={e => setVfPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 p-3 rounded-xl focus:border-[#E63946] outline-none transition-colors text-lg font-mono"
                  dir="ltr"
                />
                <p className="text-xs text-gray-400 mt-1">{ar ? "الرقم المسجل على فودافون كاش اللي حولت منه" : "The registered Vodafone Cash number you sent from"}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("review")} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold hover:border-gray-400 transition-colors">{ar ? "→ رجوع" : "← Back"}</button>
                <button onClick={handlePlaceOrder} disabled={isLoading} className="flex-1 bg-[#E63946] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading
                    ? <><Loader2 className="w-5 h-5 animate-spin" />{ar ? "جاري الإرسال..." : "Submitting..."}</>
                    : (ar ? "تأكيد وإنشاء الطلب ✓" : "Confirm Order ✓")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <OrderSidebar />
        </div>
      </div>
    </div>
  );
}
