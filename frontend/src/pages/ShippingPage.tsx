import { Truck, Clock, MapPin, Package } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { useSEO } from "../hooks/useSEO";

export default function ShippingPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  useSEO({
    title:       "الشحن والتوصيل — Shipping & Delivery",
    description: "اعرف كل التفاصيل عن الشحن والتوصيل في SEENSTORE. توصيل لجميع محافظات مصر خلال 3-5 أيام عمل. شحن مجاني على الطلبات فوق 500 جنيه.",
    keywords:    "شحن seenstore, توصيل مصر, shipping egypt seenstore, free shipping egypt",
    canonical:   "https://seenstore.com/shipping",
  });

  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isAr ? "الشحن والتوصيل" : "Shipping & Delivery"}
        </h1>
        <p className="text-gray-500">
          {isAr ? "كل ما تحتاج معرفته عن توصيل طلباتك" : "Everything you need to know about getting your order"}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {[
          {
            icon: Truck,
            title: isAr ? "شحن مجاني" : "Free Shipping",
            desc: isAr ? "على جميع الطلبات التي تزيد عن 500 جنيه في جميع أنحاء مصر." : "On all orders over 500 EGP anywhere in Egypt.",
          },
          {
            icon: Clock,
            title: isAr ? "وقت التوصيل" : "Delivery Time",
            desc: isAr ? "2–3 أيام عمل في القاهرة والجيزة، و3–5 أيام للمحافظات." : "2–3 business days in Cairo & Giza, 3–5 days for other governorates.",
          },
          {
            icon: MapPin,
            title: isAr ? "التغطية الجغرافية" : "Coverage",
            desc: isAr ? "نوصل لجميع محافظات مصر عبر شركاء الشحن الموثوقين." : "We deliver to all Egyptian governorates via trusted courier partners.",
          },
          {
            icon: Package,
            title: isAr ? "التغليف" : "Packaging",
            desc: isAr ? "جميع الطلبات تُعبّأ بعناية في أكياس مخصصة لضمان وصولها سليمة." : "All orders are carefully packed in branded bags to ensure safe delivery.",
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4">
            <div className="w-12 h-12 bg-[#E63946]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <card.icon className="w-6 h-6 text-[#E63946]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg mb-1">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-16">
        <div className="bg-black text-white px-6 py-4">
          <h2 className="font-heading font-bold text-lg">{isAr ? "جدول الشحن" : "Shipping Rates"}</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(isAr ? [
            ["القاهرة والجيزة", "مجاني (فوق 500 جنيه) / 35 جنيه", "2–3 أيام"],
            ["الإسكندرية", "مجاني (فوق 500 جنيه) / 40 جنيه", "2–4 أيام"],
            ["باقي المحافظات", "مجاني (فوق 500 جنيه) / 50 جنيه", "3–5 أيام"],
            ["المناطق النائية", "60 جنيه", "5–7 أيام"],
          ] : [
            ["Cairo & Giza", "Free (over 500 EGP) / 35 EGP", "2–3 days"],
            ["Alexandria", "Free (over 500 EGP) / 40 EGP", "2–4 days"],
            ["Other Governorates", "Free (over 500 EGP) / 50 EGP", "3–5 days"],
            ["Remote Areas", "60 EGP", "5–7 days"],
          ]).map(([region, cost, time], i) => (
            <div key={i} className="grid grid-cols-3 px-6 py-4 text-sm">
              <span className="font-medium">{region}</span>
              <span className="text-gray-600">{cost}</span>
              <span className="text-gray-600">{time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 text-sm text-gray-600 leading-relaxed">
        <h3 className="font-bold text-black mb-2">{isAr ? "ملاحظات مهمة" : "Important Notes"}</h3>
        <ul className="space-y-2 list-disc list-inside">
          {isAr ? [
            "أوقات التسليم تبدأ بعد تأكيد الطلب خلال يوم عمل.",
            "الطلبات المقدّمة بعد الساعة 3 مساءً تُعالج في اليوم التالي.",
            "في أيام العطلات الرسمية قد يتأخر التوصيل يوم إضافي.",
            "في حالة عدم التواجد، سيتواصل معك مندوب الشحن لتحديد موعد.",
          ] : [
            "Delivery times start after order confirmation within one business day.",
            "Orders placed after 3 PM are processed the next business day.",
            "During public holidays, delivery may be delayed by one extra day.",
            "If you're unavailable, the courier will contact you to reschedule.",
          ].map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
