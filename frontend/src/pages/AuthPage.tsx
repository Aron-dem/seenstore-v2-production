import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import heroImg from "../assets/hero.png";
import { ApiError } from "../lib/apiClient";
import { useLang } from "../context/LanguageContext";

const T = {
  en: {
    brand:       "SEENSTORE",
    tagline:     "JOIN THE CULTURE.",
    taglineDesc: "Create an account to track orders, save items to your wishlist, and get exclusive access to limited drops.",
    login:       "LOGIN",
    register:    "REGISTER",
    welcomeBack: "Welcome Back",
    createAcc:   "Create an Account",
    fullName:    "Full Name",
    namePh:      "Ahmed Mohamed",
    email:       "Email Address",
    emailPh:     "you@example.com",
    phone:       "Phone (optional)",
    phonePh:     "+20 10x xxxx xxxx",
    password:    "Password",
    passPh:      "••••••••",
    confirmPass: "Confirm Password",
    terms:       "I agree to the",
    tos:         "Terms of Service",
    and:         "and",
    privacy:     "Privacy Policy",
    loginBtn:    "LOGIN SECURELY",
    createBtn:   "CREATE ACCOUNT",
    or:          "OR",
    google:      "CONTINUE WITH GOOGLE",
    successTitle:"Account Created!",
    successDesc: "Welcome to SEENSTORE. Redirecting you to shop...",
    errFill:     "Please fill in all fields",
    errMatch:    "Passwords do not match",
    errLen:      "Password must be at least 6 characters",
    errLogin:    "Login failed. Please try again.",
    errRegister: "Registration failed. Please try again.",
    forgotPass:  "Forgot Password?",
  },
  ar: {
    brand:       "SEENSTORE",
    tagline:     "كن جزءاً من الحركة.",
    taglineDesc: "أنشئ حساباً لتتبع طلباتك وحفظ المفضلة والحصول على وصول حصري لأحدث الإصدارات.",
    login:       "تسجيل الدخول",
    register:    "إنشاء حساب",
    welcomeBack: "أهلاً بعودتك",
    createAcc:   "إنشاء حساب جديد",
    fullName:    "الاسم بالكامل",
    namePh:      "أحمد محمد",
    email:       "البريد الإلكتروني",
    emailPh:     "you@example.com",
    phone:       "رقم الهاتف (اختياري)",
    phonePh:     "+20 10x xxxx xxxx",
    password:    "كلمة المرور",
    passPh:      "••••••••",
    confirmPass: "تأكيد كلمة المرور",
    terms:       "أوافق على",
    tos:         "شروط الاستخدام",
    and:         "و",
    privacy:     "سياسة الخصوصية",
    loginBtn:    "دخول آمن",
    createBtn:   "إنشاء الحساب",
    or:          "أو",
    google:      "متابعة بـ Google",
    successTitle:"تم إنشاء الحساب!",
    successDesc: "أهلاً بك في SEENSTORE. جارٍ التوجيه للمتجر...",
    errFill:     "يرجى ملء جميع الحقول",
    errMatch:    "كلمتا المرور غير متطابقتين",
    errLen:      "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    errLogin:    "فشل تسجيل الدخول. حاول مرة أخرى.",
    errRegister: "فشل إنشاء الحساب. حاول مرة أخرى.",
    forgotPass:  "نسيت كلمة المرور؟",
  },
};

export default function AuthPage() {
  const { lang, isRTL } = useLang();
  const c = T[lang];

  const [isLogin, setIsLogin] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();

  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [name,            setName]            = useState("");
  const [phone,           setPhone]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      if (!email || !password) { setError(c.errFill); return; }
      setLoading(true);
      try {
        await login(email, password);
        setLocation("/");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : c.errLogin);
      } finally { setLoading(false); }
    } else {
      if (!name || !email || !password || !confirmPassword) { setError(c.errFill); return; }
      if (password !== confirmPassword) { setError(c.errMatch); return; }
      if (password.length < 6) { setError(c.errLen); return; }
      setLoading(true);
      try {
        await register(name, email, password, phone || undefined);
        setIsSuccess(true);
        setTimeout(() => setLocation("/"), 2000);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : c.errRegister);
      } finally { setLoading(false); }
    }
  };

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3 : 2;

  return (
    <div className="min-h-[calc(100dvh-64px)] flex mt-16" dir={isRTL ? "rtl" : "ltr"}>
      {/* Brand Panel */}
      <div className={`hidden md:flex w-1/2 bg-black relative overflow-hidden flex-col justify-between p-12 ${isRTL ? "items-end text-right" : ""}`}>
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black to-transparent z-10" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-10" />
          <img src={heroImg} alt="Brand" className="w-full h-full object-cover object-top opacity-50 grayscale" />
        </div>
        <div className="relative z-20">
          <h1 className="text-white text-3xl font-heading font-bold tracking-tighter">{c.brand}</h1>
        </div>
        <div className="relative z-20">
          <div className={`w-20 h-2 bg-[#E63946] mb-8 ${isRTL ? "mr-0" : ""}`} />
          <h2 className="text-5xl lg:text-6xl font-heading font-bold text-white leading-tight mb-6">
            {c.tagline}
          </h2>
          <p className="text-gray-400 text-lg max-w-md">{c.taglineDesc}</p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-black relative text-white">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full max-w-md">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-heading font-bold mb-2">{c.successTitle}</h2>
              <p className="text-gray-500">{c.successDesc.replace("{name}", name)}</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-md">
              <div className="md:hidden mb-10 text-center">
                <h1 className="text-3xl font-heading font-bold tracking-tighter text-white">{c.brand}</h1>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/20 mb-8">
                <button onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 pb-4 text-center font-heading font-bold text-lg transition-colors relative ${isLogin ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {c.login}
                  {isLogin && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#E63946]" />}
                </button>
                <button onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 pb-4 text-center font-heading font-bold text-lg transition-colors relative ${!isLogin ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
                  {c.register}
                  {!isLogin && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#E63946]" />}
                </button>
              </div>

              <h2 className="text-2xl font-bold mb-6 text-white">{isLogin ? c.welcomeBack : c.createAcc}</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">{c.fullName}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full border-2 border-white/20 bg-white/10 text-white p-3 rounded-lg focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                      placeholder={c.namePh} />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">{c.email}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr"
                    className="w-full border-2 border-white/20 bg-white/10 text-white p-3 rounded-lg focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                    placeholder={c.emailPh} />
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">{c.phone}</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                      className="w-full border-2 border-white/20 bg-white/10 text-white p-3 rounded-lg focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                      placeholder={c.phonePh} />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-300">{c.password}</label>
                    {isLogin && (
                      <button type="button" onClick={() => toast.info(isRTL ? "ميزة استعادة كلمة المرور قيد التطوير" : "Password recovery feature is under development")} 
                        className="text-xs font-semibold text-gray-400 hover:text-[#E63946] transition-colors">
                        {c.forgotPass}
                      </button>
                    )}
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full border-2 border-white/20 bg-white/10 text-white p-3 rounded-lg focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                    placeholder={c.passPh} />
                  {!isLogin && password.length > 0 && (
                    <div className="mt-2 flex gap-1 h-1">
                      <div className={`flex-1 rounded-full ${strength >= 1 ? (strength === 1 ? "bg-red-500" : strength === 2 ? "bg-yellow-500" : "bg-green-500") : "bg-gray-200"}`} />
                      <div className={`flex-1 rounded-full ${strength >= 2 ? (strength === 2 ? "bg-yellow-500" : "bg-green-500") : "bg-gray-200"}`} />
                      <div className={`flex-1 rounded-full ${strength >= 3 ? "bg-green-500" : "bg-gray-200"}`} />
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">{c.confirmPass}</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full border-2 border-white/20 bg-white/10 text-white p-3 rounded-lg focus:border-[#E63946] focus:outline-none transition-colors placeholder:text-gray-500"
                      placeholder={c.passPh} />
                  </div>
                )}

                {!isLogin && (
                  <label className="flex items-start gap-2 cursor-pointer mt-4">
                    <input type="checkbox" required className="w-4 h-4 accent-[#E63946] rounded border-white/20 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-400 font-medium leading-relaxed">
                      {c.terms}{" "}
                      <a href="#" className="text-white underline">{c.tos}</a>{" "}
                      {c.and}{" "}
                      <a href="#" className="text-white underline">{c.privacy}</a>
                    </span>
                  </label>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#E63946] text-white py-4 rounded-lg font-bold text-lg hover:bg-black transition-colors shadow-lg mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLogin ? c.loginBtn : c.createBtn}
                </button>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-sm text-gray-500 font-medium">{c.or}</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <a href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 border-2 border-white/20 bg-white/5 text-white py-3 rounded-lg font-bold hover:bg-white/10 hover:border-white/40 transition-colors">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {c.google}
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
