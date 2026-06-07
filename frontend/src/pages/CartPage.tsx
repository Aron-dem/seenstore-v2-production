import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { Link, useLocation } from "wouter";
import { Trash2, ShieldCheck, ArrowRight, ShoppingBag, Star } from "lucide-react";
import { SiVisa, SiMastercard } from "react-icons/si";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const [, setLocation] = useLocation();
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  const shippingCost = cartTotal > 500 ? 0 : 50;
  const discount = isPromoApplied ? cartTotal * 0.1 : 0;
  const finalTotal = cartTotal + shippingCost - discount;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === "SEEN10") {
      setIsPromoApplied(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-32 text-center max-w-[1400px] flex flex-col items-center">
        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-3xl font-heading font-bold mb-4">{t.cartPage.empty}</h1>
        <p className="text-gray-500 mb-8 max-w-md">{t.cartPage.emptyDesc}</p>
        <Link 
          href="/shop" 
          className="inline-flex items-center gap-2 bg-[#E63946] text-white px-8 py-4 rounded-lg font-bold hover:bg-black transition-colors"
        >
          {t.cartPage.startShopping} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-24 max-w-[1400px]">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl md:text-4xl font-heading font-bold">{t.cartPage.title}</h1>
        <Link href="/shop" className="text-sm font-semibold underline hover:text-[#E63946] hidden sm:block">
          {t.cartPage.continueShopping}
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-6 bg-gray-50 border-b font-bold text-sm">
              <div className="col-span-5">{t.cartPage.product}</div>
              <div className="col-span-2 text-center">{t.cartPage.price}</div>
              <div className="col-span-2 text-center">{t.cartPage.quantity}</div>
              <div className="col-span-2 text-right">{t.cartPage.total}</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            <div className="divide-y">
              {items.map(item => (
                <div key={item.id} className="p-6 grid md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-5 flex gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-bold text-sm md:text-base">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.size} / {item.color}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2 text-center">
                    <p className="md:hidden text-xs text-gray-500 mb-1">{t.cartPage.price}</p>
                    <p className="font-bold">{item.price} EGP</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="md:hidden text-xs text-gray-500 mb-1">{t.cartPage.quantity}</div>
                    <div className="flex items-center justify-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-50">−</button>
                      <span className="px-3 py-1 font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-50">+</button>
                    </div>
                  </div>
                  <div className="md:col-span-2 text-right">
                    <p className="md:hidden text-xs text-gray-500 mb-1">{t.cartPage.total}</p>
                    <p className="font-bold">{(item.price * item.quantity).toFixed(0)} EGP</p>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-700 p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo Code */}
          <form onSubmit={handleApplyPromo} className="mt-6 flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              placeholder={t.cartPage.promoPlaceholder}
              className="flex-1 border-2 border-gray-200 px-4 py-3 rounded-lg focus:border-[#E63946] outline-none"
            />
            <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors">
              {isPromoApplied ? t.cartPage.applied : t.cartPage.apply}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-24">
            <h3 className="font-heading font-bold text-lg mb-6">{t.cartPage.orderSummary}</h3>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.cartPage.subtotal}</span>
                <span className="font-bold">{cartTotal.toFixed(0)} EGP</span>
              </div>
              {isPromoApplied && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.cartPage.discount}</span>
                  <span className="font-bold text-green-600">-{discount.toFixed(0)} EGP</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">{t.cartPage.shipping}</span>
                <span className="font-bold">{shippingCost === 0 ? t.cartPage.free : `${shippingCost} EGP`}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-2xl mb-8">
              <span>{t.cartPage.grandTotal}</span>
              <span>{finalTotal.toFixed(0)} EGP</span>
            </div>

            {!isAuthenticated && (
              <div className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-800">🎁 {ar ? "سجل دخولك واحصل على خصم 10% على أول طلب!" : "Sign in & get 10% off your first order!"}</p>
                  <button onClick={() => setLocation("/auth")} className="text-[#E63946] text-xs font-bold mt-0.5 hover:underline">
                    {ar ? "سجل الدخول ←" : "Sign in →"}
                  </button>
                </div>
              </div>
            )}
            <Link
              href="/checkout"
              className="w-full bg-[#E63946] text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 mb-4 block text-center"
            >
              {t.cartPage.checkout}
            </Link>
            
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6">
              <ShieldCheck className="w-4 h-4" /> {t.cartPage.secureCheckout}
            </div>

            <div className="flex justify-center items-center gap-4 text-gray-400 pt-6 border-t border-gray-200">
              <SiVisa className="w-12 h-8" />
              <SiMastercard className="w-10 h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
