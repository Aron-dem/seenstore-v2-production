import { useLang } from "../context/LanguageContext";
import { Link } from "wouter";

interface Section {
  title: string;
  content: string[];
}

const sectionsEn: Section[] = [
  {
    title: "1. Introduction",
    content: [
      "Welcome to SEENSTORE. We are committed to protecting your personal information and your right to privacy. This Privacy Policy and Terms of Use explain how we collect, use, and safeguard your data when you visit our website or make a purchase.",
      "By using our website, you agree to the terms described in this document.",
    ],
  },
  {
    title: "2. Information We Collect",
    content: [
      "Personal identification information (name, email address, phone number, shipping address) when you create an account or place an order.",
      "Payment information (processed securely through our payment partners — we do not store card numbers).",
      "Usage data such as pages visited, time spent, browser type, and device information to improve your experience.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    content: [
      "To process and fulfill your orders, including shipping notifications and delivery updates.",
      "To send promotional emails and offers (you can unsubscribe at any time).",
      "To improve our website, products, and customer service based on usage data.",
      "To comply with legal obligations and resolve any disputes.",
    ],
  },
  {
    title: "4. Data Security",
    content: [
      "We implement industry-standard security measures including SSL encryption to protect your personal data during transmission.",
      "Access to your personal information is restricted to authorized personnel only and on a need-to-know basis.",
    ],
  },
  {
    title: "5. Cookies",
    content: [
      "We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze site traffic.",
      "You can control cookie settings through your browser. Note that disabling cookies may affect certain website features.",
    ],
  },
  {
    title: "6. Third-Party Sharing",
    content: [
      "We do not sell, trade, or rent your personal information to third parties.",
      "We share data only with trusted service providers (shipping companies, payment processors) strictly for fulfilling your orders.",
    ],
  },
  {
    title: "7. Your Rights",
    content: [
      "You have the right to access, correct, or delete your personal data at any time.",
      "You may opt out of marketing communications by clicking the unsubscribe link in any email we send.",
      "To exercise your rights, contact us at privacy@seenstore.com.",
    ],
  },
  {
    title: "8. Terms of Use",
    content: [
      "All content on this website (text, images, logos, product designs) is the exclusive property of SEENSTORE and protected by copyright law.",
      "You may not reproduce, distribute, or use our content without written permission.",
      "We reserve the right to suspend or terminate accounts that violate our terms.",
      "Prices and product availability are subject to change without prior notice.",
    ],
  },
  {
    title: "9. Governing Law",
    content: [
      "These terms are governed by the laws of the Arab Republic of Egypt. Any disputes shall be subject to the exclusive jurisdiction of Egyptian courts.",
    ],
  },
  {
    title: "10. Contact",
    content: [
      "For any privacy-related questions, contact us at: privacy@seenstore.com",
    ],
  },
];

const sectionsAr: Section[] = [
  {
    title: "١. المقدمة",
    content: [
      "مرحباً بك في سين ستور. نحن ملتزمون بحماية معلوماتك الشخصية وحقك في الخصوصية. توضح سياسة الخصوصية وشروط الاستخدام هذه كيفية جمع بياناتك واستخدامها وحمايتها عند زيارتك لموقعنا أو إجراء عملية شراء.",
      "باستخدام موقعنا، فإنك توافق على الشروط الموضحة في هذه الوثيقة.",
    ],
  },
  {
    title: "٢. المعلومات التي نجمعها",
    content: [
      "معلومات التعريف الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف، عنوان الشحن) عند إنشاء حساب أو تقديم طلب.",
      "معلومات الدفع (تتم المعالجة بأمان عبر شركاء الدفع — نحن لا نخزن أرقام البطاقات).",
      "بيانات الاستخدام مثل الصفحات التي تمت زيارتها، والوقت المستغرق، ونوع المتصفح، ومعلومات الجهاز لتحسين تجربتك.",
    ],
  },
  {
    title: "٣. كيف نستخدم معلوماتك",
    content: [
      "لمعالجة طلباتك وتنفيذها، بما في ذلك إشعارات الشحن وتحديثات التسليم.",
      "لإرسال رسائل إلكترونية ترويجية وعروض (يمكنك إلغاء الاشتراك في أي وقت).",
      "لتحسين موقعنا ومنتجاتنا وخدمة العملاء استناداً إلى بيانات الاستخدام.",
      "للامتثال للالتزامات القانونية وحل النزاعات.",
    ],
  },
  {
    title: "٤. أمان البيانات",
    content: [
      "نطبق معايير أمان صناعية تشمل تشفير SSL لحماية بياناتك الشخصية أثناء الإرسال.",
      "الوصول إلى معلوماتك الشخصية مقتصر على الموظفين المصرح لهم فقط وعلى أساس الحاجة إلى المعرفة.",
    ],
  },
  {
    title: "٥. ملفات تعريف الارتباط (Cookies)",
    content: [
      "نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وتذكر تفضيلاتك وتحليل حركة الموقع.",
      "يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك. لاحظ أن تعطيلها قد يؤثر على بعض ميزات الموقع.",
    ],
  },
  {
    title: "٦. مشاركة الطرف الثالث",
    content: [
      "لا نبيع معلوماتك الشخصية أو نتداولها أو نؤجرها لأطراف ثالثة.",
      "نشارك البيانات فقط مع مزودي الخدمات الموثوق بهم (شركات الشحن، معالجو الدفع) لتنفيذ طلباتك فقط.",
    ],
  },
  {
    title: "٧. حقوقك",
    content: [
      "يحق لك الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها في أي وقت.",
      "يمكنك إلغاء الاشتراك في الاتصالات التسويقية بالنقر على رابط إلغاء الاشتراك في أي بريد إلكتروني نرسله.",
      "لممارسة حقوقك، تواصل معنا على privacy@seenstore.com.",
    ],
  },
  {
    title: "٨. شروط الاستخدام",
    content: [
      "جميع المحتوى على هذا الموقع (النصوص والصور والشعارات وتصاميم المنتجات) هو الملكية الحصرية لسين ستور ومحمي بموجب قانون حقوق النشر.",
      "لا يجوز لك إعادة إنتاج محتوانا أو توزيعه أو استخدامه دون إذن كتابي.",
      "نحتفظ بالحق في تعليق الحسابات أو إنهائها التي تنتهك شروطنا.",
      "الأسعار وتوفر المنتجات عرضة للتغيير دون إشعار مسبق.",
    ],
  },
  {
    title: "٩. القانون الحاكم",
    content: [
      "تخضع هذه الشروط لقوانين جمهورية مصر العربية. تخضع أي نزاعات للاختصاص القضائي الحصري للمحاكم المصرية.",
    ],
  },
  {
    title: "١٠. التواصل",
    content: [
      "لأي أسئلة تتعلق بالخصوصية، تواصل معنا على: privacy@seenstore.com",
    ],
  },
];

export default function PrivacyPage() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const sections = isAr ? sectionsAr : sectionsEn;

  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isAr ? "سياسة الخصوصية وشروط الاستخدام" : "Privacy Policy & Terms of Use"}
        </h1>
        <p className="text-gray-400 text-sm">
          {isAr ? "آخر تحديث: يونيو ٢٠٢٥" : "Last updated: June 2025"}
        </p>
      </div>

      {/* Quick nav */}
      <div className="bg-gray-50 text-gray-900 rounded-2xl p-6 mb-12 border border-gray-200">
        <p className="font-semibold text-sm text-gray-700 mb-3">{isAr ? "محتويات هذه الصفحة" : "On this page"}</p>
        <div className="flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <a
              key={i}
              href={`#section-${i}`}
              className="text-xs text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-[#E63946] hover:text-[#E63946] transition-colors"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section, i) => (
          <div key={i} id={`section-${i}`} className="scroll-mt-24">
            <h2 className="font-heading font-bold text-xl mb-4 text-[#E63946]">{section.title}</h2>
            <div className="space-y-3">
              {section.content.map((para, j) => (
                <p key={j} className="text-gray-600 leading-relaxed text-sm">{para}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500 mb-4">
          {isAr ? "هل لديك سؤال؟" : "Have a question?"}
        </p>
        <Link href="/contact" className="inline-block bg-[#E63946] text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors text-sm">
          {isAr ? "تواصل معنا" : "Contact Us"}
        </Link>
      </div>
    </div>
  );
}
