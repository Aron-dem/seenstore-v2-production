import { useLang } from "../context/LanguageContext";

export default function SizeGuidePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isAr ? "دليل المقاسات" : "Size Guide"}
        </h1>
        <p className="text-gray-500">
          {isAr ? "اختر مقاسك الصح من أول مرة" : "Find your perfect fit every time"}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-3 md:p-5">
        <img
          src="/size-guide-tshirt.jpg"
          alt={isAr ? "دليل مقاسات التيشيرت" : "T-shirt size guide"}
          className="w-full h-auto rounded-xl object-contain"
        />
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
        {isAr
          ? "إذا كانت قياساتك بين مقاسين، نوصي باختيار المقاس الأكبر للحصول على راحة أفضل."
          : "If your measurements fall between two sizes, we recommend sizing up for a more comfortable fit."}
      </div>
    </div>
  );
}
