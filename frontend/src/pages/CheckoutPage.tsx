import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useLocation } from "wouter";
import {
  ChevronRight, MapPin, Truck, Tag, Star, X,
  CheckCircle2, Loader2, ArrowLeft,
} from "lucide-react";
import { toast } from "../components/ui/sonner";

type Step = "address" | "shipping" | "review" | "post_confirm";

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

const DRAFT_KEY = "seenstore_checkout_draft";
const STEP_ORDER: Step[] = ["address", "shipping", "review", "post_confirm"];

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
  const [orderId,       setOrderId]       = useState<string | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

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

  const shippingFee    = SHIPPING_METHODS.find(s => s.id === selectedShipping)?.cost ?? 50;
  const couponDiscount = Math.round(cartTotal * couponRate);
  const loginDiscount  = (isAuthenticated && couponRate === 0) ? Math.round(cartTotal * 0.10) : 0;
  const finalTotal     = Math.max(0, cartTotal + shippingFee - couponDiscount - loginDiscount);

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

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = localStorage.getItem("seen_access_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/orders", {
        method: "POST", headers,
        body: JSON.stringify({
          items,
          subtotal: cartTotal,
          shippingFee,
          total: finalTotal,
          shippingAddress: address,
          paymentMethod: "cash_on_delivery",
          customerName: address.fullName,
          customerEmail: currentUser?.email || `guest-${address.phone.replace(/\D/g, "") || "order"}@seenstore.local`,
          couponCode: couponCode || null,
          couponDiscount,
          depositAmount: 0,
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

  const STEPS_UI = [
    { key: "address",  labelAr: "العنوان",  labelEn: "Address" },
    { key: "shipping", labelAr: "الشحن",    labelEn: "Shipping" },
    { key: "review",   labelAr: "المراجعة", labelEn: "Review" },
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
        <div className="flex justify-between"><span className="text-gray-500">{ar ? "الشحن" : "Shipping"}</span><span>{shippingFee} EGP</span></div>
        {couponDiscount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>{ar ? "خصم الكوبون" : "Coupon discount"}</span><span>−{couponDiscount} EGP</span></div>}
        {loginDiscount  > 0 && <div className="flex justify-between text-green-600 font-bold"><span>{ar ? "🎁 خصم أول طلب" : "🎁 First order"}</span><span>−{loginDiscount} EGP</span></div>}
      </div>
      <div className="flex justify-between font-bold text-lg pt-3 border-t">
        <span>{ar ? "الإجمالي" : "Total"}</span>
        <span className="text-[#E63946]">{finalTotal} EGP</span>
      </div>
    </div>
  );

  if (step === "post_confirm" && orderId) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{ar ? "تم استلام طلبك! 🎉" : "Order Received! 🎉"}</h1>
          <p className="text-gray-600 text-sm mb-2">{ar ? "رقم الطلب" : "Order ID"}: <span className="font-mono font-bold text-[#E63946]">{orderId}</span></p>
          <p className="text-gray-600 text-sm mb-6">
            {ar ? "هنرن عليك على الرقم المسجل لتأكيد الطلب وترتيب الشحن." : "We will call the phone number you entered to confirm your order and arrange shipping."}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setLocation("/")} className="bg-[#E63946] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors">
              {ar ? "العودة للرئيسية" : "Back to Home"}
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => setLocation(`/auth?redirect=/track-order`)}
                className="border-2 border-black text-black px-8 py-3 rounded-xl font-bold hover:bg-black hover:text-white transition-colors"
              >
                {ar ? "سجل الدخول لمتابعة طلبك" : "Sign in to track your order"}
              </button>
            )}
          </div>
        </div>
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
                    <div className="font-bold">{m.cost} EGP</div>
                  </label>
                ))}
              </div>
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
                  <p className="font-bold">{ar ? SHIPPING_METHODS.find(s => s.id === selectedShipping)?.nameAr : SHIPPING_METHODS.find(s => s.id === selectedShipping)?.nameEn} — {shippingFee} EGP</p>
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
                <button onClick={handlePlaceOrder} disabled={isLoading} className="flex-1 bg-[#E63946] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />{ar ? "جاري التأكيد..." : "Confirming..."}</> : (ar ? "تأكيد الطلب ✓" : "Confirm Order ✓")}</button>
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
