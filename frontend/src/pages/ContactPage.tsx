import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook } from "react-icons/si";
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
  const [sent,     setSent]     = useState(false);
  const [sending,  setSending]  = useState(false);
  const [sendError, setSendError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setSendError("");
    try {
      const res = await fetch("/api/messages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
    } catch {
      setSendError(isAr ? "حدث خطأ، حاول مجدداً." : "Something went wrong, please try again.");
    } finally {
      setSending(false);
    }
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
          {[
            { icon: Mail,  title: isAr ? "البريد الإلكتروني" : "Email",         value: "hello@seenstore.com" },
            { icon: Phone, title: isAr ? "الهاتف" : "Phone",                    value: "+20 123 456 7890" },
            { icon: MapPin,title: isAr ? "العنوان" : "Address",                 value: isAr ? "١٢٣ شارع الحضري، القاهرة، مصر" : "123 Urban Street, Cairo, Egypt" },
            { icon: Clock, title: isAr ? "ساعات العمل" : "Working Hours",       value: isAr ? "السبت – الخميس، ١٠ص – ٧م" : "Sat – Thu, 10 AM – 7 PM" },
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-[#E63946]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-[#E63946]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">{item.title}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-zinc-800">
            <p className="text-sm text-gray-500 mb-4">{isAr ? "تابعنا على" : "Follow us on"}</p>
            <div className="flex gap-3">
              {[SiInstagram, SiTiktok, SiFacebook].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400 hover:bg-[#E63946] hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm p-8 text-white">
          {sent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-heading font-bold text-2xl mb-2">
                {isAr ? "تم الإرسال!" : "Message Sent!"}
              </h3>
              <p className="text-gray-500">
                {isAr ? "شكراً لتواصلك معنا. سنرد عليك خلال 24 ساعة." : "Thanks for reaching out. We'll get back to you within 24 hours."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="font-heading font-bold text-xl mb-6">{isAr ? "أرسل لنا رسالة" : "Send us a message"}</h2>
              {sendError && (
                <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{sendError}</p>
              )}
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
              <button type="submit" disabled={sending}
                className="w-full bg-[#E63946] text-white py-4 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAr ? "إرسال الرسالة" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
