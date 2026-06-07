import { useState } from "react";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { api } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

export default function PhoneCollectionPage() {
  const { refreshUser } = useAuth();
  const [phone,   setPhone]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, "");
    if (!/^\+?\d{7,15}$/.test(cleaned)) {
      setError("رقم الهاتف غير صحيح. استخدم صيغة دولية مثل +201xxxxxxxxx");
      return;
    }
    setSaving(true); setError("");
    try {
      await api.patch("/me/profile", { phone: cleaned });
      await refreshUser();
      window.location.replace("/");
    } catch {
      setError("حدث خطأ، يرجى المحاولة مجدداً.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E63946]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-[#E63946]" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">أدخل رقم هاتفك</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            نحتاج رقم هاتفك للتواصل معك بشأن طلباتك وتوصيل المنتجات.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+201xxxxxxxxx"
              required
              dir="ltr"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#E63946] focus:outline-none transition-colors text-left"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-[#E63946] transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            متابعة
          </button>
        </form>
      </div>
    </div>
  );
}
