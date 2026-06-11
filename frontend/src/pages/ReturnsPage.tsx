import { RefreshCcw, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLang } from "../context/LanguageContext";

export default function ReturnsPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isAr ? "سياسة الإرجاع" : "Returns Policy"}
        </h1>
        <p className="text-gray-400">
          {isAr ? "نضمن رضاك التام أو نسترد لك المبلغ" : "We guarantee your satisfaction or your money back"}
        </p>
      </div>

      {/* Highlight */}
      <div className="bg-[#E63946] text-white rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        <RefreshCcw className="w-16 h-16 flex-shrink-0" />
        <div>
          <h2 className="font-heading text-3xl font-bold mb-2">
            {isAr ? "14 يوماً لإرجاع المنتج" : "14-Day Return Window"}
          </h2>
          <p className="text-white/90">
            {isAr
              ? "لديك 14 يوماً كاملاً من تاريخ الاستلام لإرجاع أي منتج غير راضٍ عنه."
              : "You have a full 14 days from delivery to return any item you're not satisfied with."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Accepted */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="font-heading font-bold text-lg text-white">{isAr ? "يُقبل الإرجاع" : "Eligible for Return"}</h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-300">
            {(isAr ? [
              "منتجات غير مستخدمة وغير مغسولة",
              "منتجات في عبوتها الأصلية مع العلامات",
              "خلال 14 يوماً من تاريخ الاستلام",
              "منتجات معيبة أو تالفة عند الاستلام",
            ] : [
              "Unused and unwashed items",
              "Items in original packaging with tags attached",
              "Within 14 days of delivery date",
              "Defective or damaged items upon receipt",
            ]).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Not Accepted */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <XCircle className="w-6 h-6 text-[#E63946]" />
            <h3 className="font-heading font-bold text-lg text-white">{isAr ? "لا يُقبل الإرجاع" : "Not Eligible"}</h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-300">
            {(isAr ? [
              "منتجات مستخدمة أو مغسولة",
              "منتجات بدون علامات أو عبوة أصلية",
              "بعد مرور أكثر من 14 يوماً",
              "منتجات العروض والتخفيضات الخاصة",
            ] : [
              "Used or washed items",
              "Items without tags or original packaging",
              "After 14 days from delivery",
              "Sale or special promotion items",
            ]).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-[#E63946] mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Process */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
        <h2 className="font-heading font-bold text-2xl mb-6 text-white">{isAr ? "خطوات الإرجاع" : "How to Return"}</h2>
        <div className="space-y-6">
          {(isAr ? [
            { step: "1", title: "تواصل معنا", desc: "أرسل بريداً إلكترونياً إلى returns@seenstore.com مع رقم طلبك وسبب الإرجاع." },
            { step: "2", title: "تأكيد الإرجاع", desc: "سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الإرجاع وتحديد موعد الاستلام." },
            { step: "3", title: "شحن المنتج", desc: "أعد تعبئة المنتج في عبوته الأصلية وسلّمه للمندوب في الموعد المحدد." },
            { step: "4", title: "الاسترداد", desc: "بعد استلام المنتج وفحصه، يُسترد المبلغ خلال 5–7 أيام عمل." },
          ] : [
            { step: "1", title: "Contact Us", desc: "Email returns@seenstore.com with your order number and reason for return." },
            { step: "2", title: "Confirmation", desc: "Our team will contact you within 24 hours to confirm and schedule a pickup." },
            { step: "3", title: "Ship It Back", desc: "Repack the item in its original packaging and hand it to the courier at the scheduled time." },
            { step: "4", title: "Refund", desc: "Once received and inspected, your refund will be processed within 5–7 business days." },
          ]).map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-[#E63946] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {step.step}
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-white">{step.title}</h4>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-400">
        <Clock className="w-5 h-5 text-[#E63946] flex-shrink-0" />
        {isAr
          ? "يتم استرداد المبلغ إلى نفس طريقة الدفع الأصلية خلال 5–7 أيام عمل."
          : "Refunds are issued to the original payment method within 5–7 business days."}
      </div>
    </div>
  );
}
