import { useState } from "react";
import { Mail, Phone, Clock, Send } from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";
import { useLang } from "../context/LanguageContext";
import { useSEO } from "../hooks/useSEO";

export default function ContactPage() {
  useSEO({
    title:       "تواصل معنا — Contact Us",
    description: "تواصل مع فريق SEENSTORE لأي استفسار عن منتجاتنا أو طلباتك. نرد خلال 24 ساعة. Contact SEENSTORE team for inquiries about orders and products.",
    keywords:    "تواصل seenstore, contact seenstore egypt, customer service seenstore",
    canonical:   "https://seenstore.com/contact",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "تواصل معنا — SEENSTORE",
      "url": "https://seenstore.com/contact",
    },
  });
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [form,     setForm]     = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = isAr
      ? `مرحباً SEENSTORE 👋\n\nالاسم: ${form.name}\nالبريد: ${form.email}\nالموضوع: ${form.subject}\n\nالرسالة:\n${form.message}`
      : `Hello SEENSTORE 👋\n\nName: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\nMessage:\n${form.message}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/201018957428?text=${encoded}`, "_blank");
  };

  return (
    <div className="container mx-auto px-6 py-24 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {isAr ? "تواصل معنا" : "Contact Us"}
        </h1>
        <p className="text-gray-500">
          {isAr ? "نحن هنا لمساعدتك في أي وقت" : "We're here to help you anytime"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-[#E63946]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">{isAr ? "البريد الإلكتروني" : "Email"}</p>
              <a href="mailto:seenstore329@gmail.com" className="font-medium hover:text-[#E63946] transition-colors">seenstore329@gmail.com</a>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-[#E63946]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">{isAr ? "واتساب" : "WhatsApp"}</p>
              <a href="https://wa.me/201018957428" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-[#E63946] transition-colors">
                01018957428
              </a>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-[#E63946]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#E63946]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">{isAr ? "ساعات العمل" : "Working Hours"}</p>
              <p className="font-medium">{isAr ? "السبت – الخميس، ١٠ص – ٧م" : "Sat – Thu, 10 AM – 7 PM"}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <p className="text-sm text-gray-500 mb-4">{isAr ? "تابعنا على" : "Follow us on"}</p>
            <div className="flex gap-3">
              <a href="https://instagram.com/seen_store.20" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400 hover:bg-[#E63946] hover:text-white transition-colors">
                <SiInstagram className="w-4 h-4" />
              </a>
              <a href="https://www.tiktok.com/@seen.store.20?_r=1&_t=ZS-91yKwhOlbx1" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400 hover:bg-[#E63946] hover:text-white transition-colors">
                <SiTiktok className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm p-8 text-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="font-heading font-bold text-xl mb-6">{isAr ? "أرسل لنا رسالة" : "Send us a message"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{isAr ? "الاسم" : "Name"}</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border-2 border-zinc-700 bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                  placeholder={isAr ? "اسمك الكامل" : "Your full name"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{isAr ? "البريد الإلكتروني" : "Email"}</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border-2 border-zinc-700 bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                  placeholder={isAr ? "بريدك الإلكتروني" : "your@email.com"} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{isAr ? "الموضوع" : "Subject"}</label>
              <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full border-2 border-zinc-700 bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                placeholder={isAr ? "موضوع رسالتك" : "What's this about?"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{isAr ? "الرسالة" : "Message"}</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full border-2 border-zinc-700 bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-[#E63946] focus:outline-none transition-colors resize-none placeholder:text-gray-500"
                placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."} />
            </div>
            <button type="submit"
              className="w-full bg-[#E63946] text-white py-4 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              {isAr ? "إرسال عبر واتساب" : "Send via WhatsApp"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
