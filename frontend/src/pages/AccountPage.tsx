import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";
import { useLang } from "../context/LanguageContext";
import { LogOut, Package, User, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: any;
  createdAt: string;
  updatedAt: string;
}

export default function AccountPage() {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { lang, isRTL } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("orders");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/me/orders", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("seen_access_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
    toast.success(lang === "en" ? "Logged out successfully" : "تم تسجيل الخروج بنجاح");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      en: {
        pending: "Pending",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
      },
      ar: {
        pending: "قيد الانتظار",
        processing: "قيد المعالجة",
        shipped: "تم الشحن",
        delivered: "تم التسليم",
        cancelled: "ملغى",
      },
    };
    return labels[lang]?.[status] || status;
  };

  return (
    <div className="container mx-auto px-6 py-24 max-w-[1400px]">
      <h1 className="text-4xl font-bold mb-12">{lang === "en" ? "My Account" : "حسابي"}</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg border border-gray-200 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <div className="w-12 h-12 bg-[#E63946] rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{currentUser?.name}</p>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "profile"
                    ? "bg-[#E63946] text-white"
                    : "hover:bg-gray-50"
                }`}
              >
                <User className="w-5 h-5" />
                {lang === "en" ? "Profile" : "الملف الشخصي"}
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "orders"
                    ? "bg-[#E63946] text-white"
                    : "hover:bg-gray-50"
                }`}
              >
                <Package className="w-5 h-5" />
                {lang === "en" ? "My Orders" : "طلباتي"} ({orders.length})
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
              >
                <LogOut className="w-5 h-5" />
                {lang === "en" ? "Logout" : "تسجيل الخروج"}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">{lang === "en" ? "Profile Information" : "معلومات الملف الشخصي"}</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">{lang === "en" ? "Full Name" : "الاسم الكامل"}</label>
                  <p className="text-lg">{currentUser?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">{lang === "en" ? "Email Address" : "البريد الإلكتروني"}</label>
                  <p className="text-lg">{currentUser?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">{lang === "en" ? "Member Since" : "عضو منذ"}</label>
                  <p className="text-lg">{new Date(currentUser?.createdAt || "").toLocaleDateString(lang === "en" ? "en-US" : "ar-EG")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E63946]" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{lang === "en" ? "No Orders Yet" : "لا توجد طلبات"}</h3>
                  <p className="text-gray-500 mb-6">
                    {lang === "en"
                      ? "You haven't placed any orders yet. Start shopping to see your orders here."
                      : "لم تقم بأي طلبات بعد. ابدأ التسوق لرؤية طلباتك هنا."}
                  </p>
                  <button
                    onClick={() => setLocation("/shop")}
                    className="inline-flex items-center gap-2 bg-[#E63946] text-white px-8 py-3 rounded-lg font-bold hover:bg-black transition-colors"
                  >
                    {lang === "en" ? "Start Shopping" : "ابدأ التسوق"} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b">
                        <div>
                          <p className="text-sm text-gray-500">{lang === "en" ? "Order ID" : "رقم الطلب"}</p>
                          <p className="font-bold text-lg text-[#E63946]">{order.id}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg border text-sm font-bold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">{lang === "en" ? "Date" : "التاريخ"}</p>
                          <p className="font-bold">{new Date(order.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "ar-EG")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{lang === "en" ? "Items" : "المنتجات"}</p>
                          <p className="font-bold">{order.items.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{lang === "en" ? "Total" : "الإجمالي"}</p>
                          <p className="font-bold">{order.total} EGP</p>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => setLocation(`/track-order?id=${order.id}`)}
                            className="text-[#E63946] font-bold hover:underline flex items-center gap-1"
                          >
                            {lang === "en" ? "Track" : "تتبع"} <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-bold text-gray-600 mb-3">{lang === "en" ? "Items" : "المنتجات"}:</p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.name} ({item.size}, {item.color}) x{item.quantity}
                              </span>
                              <span className="font-bold">{(item.price * item.quantity).toFixed(0)} EGP</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
