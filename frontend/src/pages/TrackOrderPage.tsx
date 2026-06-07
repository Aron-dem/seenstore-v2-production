import { useState } from "react";
import { Search, Package, Truck, CheckCircle, MapPin } from "lucide-react";
import { useLang } from "../context/LanguageContext";

const mockStatuses = [
  { icon: CheckCircle, label_en: "Order Confirmed", label_ar: "تم تأكيد الطلب", date: "Jun 1, 2025 — 10:00 AM", done: true },
  { icon: Package, label_en: "Packed & Ready", label_ar: "تم التعبئة والتجهيز", date: "Jun 1, 2025 — 2:30 PM", done: true },
  { icon: Truck, label_en: "Out for Delivery", label_ar: "في الطريق إليك", date: "Jun 2, 2025 — 9:00 AM", done: true },
  { icon: MapPin, label_en: "Delivered", label_ar: "تم التسليم", date: "Jun 2, 2025 — 1:45 PM", done: false },
];

export default function TrackOrderPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [orderNum, setOrderNum] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNum.trim()) setSearched(true);
  };

  return (
    <div className="container mx-auto px-6 py-24 max-w-2xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isAr ? "تتبع الطلب" : "Track Your Order"}
        </h1>
        <p className="text-gray-500">
          {isAr ? "أدخل رقم طلبك لمعرفة حالته الآن" : "Enter your order number to see its current status"}
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-12">
        <input
          type="text"
          value={orderNum}
          onChange={e => setOrderNum(e.target.value)}
          placeholder={isAr ? "مثال: SS-20250601-1234" : "e.g. SS-20250601-1234"}
          className="flex-1 border-2 border-gray-200 rounded-xl px-5 py-4 text-sm focus:border-[#E63946] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="bg-[#E63946] text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-colors flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          {isAr ? "بحث" : "Track"}
        </button>
      </form>

      {searched && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-black text-white px-6 py-5">
            <p className="text-xs text-gray-400 mb-1">{isAr ? "رقم الطلب" : "Order Number"}</p>
            <p className="font-heading font-bold text-xl">{orderNum}</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {mockStatuses.map((status, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status.done ? "bg-[#E63946] text-white" : "bg-gray-100 text-gray-400"}`}>
                    <status.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-semibold ${status.done ? "text-black" : "text-gray-400"}`}>
                      {isAr ? status.label_ar : status.label_en}
                    </p>
                    <p className={`text-xs mt-0.5 ${status.done ? "text-gray-500" : "text-gray-300"}`}>{status.date}</p>
                  </div>
                  {i < mockStatuses.length - 1 && (
                    <div className={`absolute ${isAr ? "right-[60px]" : "left-[60px]"} w-0.5 h-6 ${status.done ? "bg-[#E63946]" : "bg-gray-200"} mt-10`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 text-sm text-gray-500">
            {isAr
              ? "لديك سؤال؟ تواصل مع فريق الدعم على hello@seenstore.com"
              : "Have a question? Contact support at hello@seenstore.com"}
          </div>
        </div>
      )}

      {!searched && (
        <div className="bg-gray-50 rounded-2xl p-6 text-sm text-gray-600">
          <p className="font-semibold text-black mb-2">{isAr ? "أين أجد رقم طلبي؟" : "Where to find your order number?"}</p>
          <ul className="space-y-2 list-disc list-inside">
            {(isAr ? [
              "في رسالة تأكيد الطلب المرسلة على بريدك الإلكتروني",
              "في صفحة حسابك تحت قسم الطلبات",
              "في رسالة SMS التي أرسلناها عند تأكيد الطلب",
            ] : [
              "In the order confirmation email we sent you",
              "In your account page under Orders",
              "In the SMS confirmation we sent when your order was placed",
            ]).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
