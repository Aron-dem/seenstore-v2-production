import { useLang } from "../context/LanguageContext";

const summerSizes = [
  { size: "M",   chest_cm: "58", length_cm: "68" },
  { size: "L",   chest_cm: "60", length_cm: "70" },
  { size: "XL",  chest_cm: "62", length_cm: "72" },
  { size: "XXL", chest_cm: "64", length_cm: "74" },
];

export default function SizeGuidePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div className="container mx-auto px-6 py-24 max-w-3xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isAr ? "دليل المقاسات" : "Size Guide"}
        </h1>
        <p className="text-gray-500">
          {isAr ? "اختر مقاسك الصح من أول مرة" : "Find your perfect fit every time"}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-black text-white px-6 py-4 text-center">
          <h2 className="font-heading font-bold text-lg tracking-widest uppercase">
            {isAr ? "جدول مقاسات الصيف (سم)" : "Summer Size Chart (CM)"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 text-center font-semibold">{isAr ? "المقاس" : "Size"}</th>
                <th className="px-6 py-4 text-center font-semibold">{isAr ? "عرض الصدر" : "Chest Width"}</th>
                <th className="px-6 py-4 text-center font-semibold">{isAr ? "الطول الكلي" : "Total Length"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summerSizes.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#E63946] text-center text-lg">{row.size}</td>
                  <td className="px-6 py-4 text-gray-700 text-center">{row.chest_cm} CM</td>
                  <td className="px-6 py-4 text-gray-700 text-center">{row.length_cm} CM</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
        {isAr
          ? "إذا كانت قياساتك بين مقاسين، نوصي باختيار المقاس الأكبر للحصول على راحة أفضل."
          : "If your measurements fall between two sizes, we recommend sizing up for a more comfortable fit."}
      </div>
    </div>
  );
}
