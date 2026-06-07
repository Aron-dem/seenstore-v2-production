import { Route, Switch } from "wouter";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CustomOrdersProvider } from "./context/CustomOrdersContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ShippingPage from "./pages/ShippingPage";
import ReturnsPage from "./pages/ReturnsPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import SizeGuidePage from "./pages/SizeGuidePage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import WishlistPage from "./pages/WishlistPage";
import CustomDesignPage from "./pages/CustomDesignPage";
import AdminPage from "./pages/AdminPage";
import PhoneCollectionPage from "./pages/PhoneCollectionPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <WishlistProvider>
      <CartProvider>
      <CustomOrdersProvider>
        <Layout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/shop" component={ShopPage} />
            <Route path="/product/:id" component={ProductDetailPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/auth/callback" component={AuthCallbackPage} />
            <Route path="/shipping" component={ShippingPage} />
            <Route path="/returns" component={ReturnsPage} />
            <Route path="/track-order" component={TrackOrderPage} />
            <Route path="/size-guide" component={SizeGuidePage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/wishlist" component={WishlistPage} />
            <Route path="/custom-design" component={CustomDesignPage} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/auth/phone" component={PhoneCollectionPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/account" component={AccountPage} />
            <Route>
              <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            </Route>
          </Switch>
        </Layout>
      </CustomOrdersProvider>
      </CartProvider>
      </WishlistProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
