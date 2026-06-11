// src/App.tsx

import React, { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import i18n from "./i18n";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import AboutPage from "./pages/AboutPage";
import CartPage from "./pages/CartPage";
// Admin panel is lazy-loaded: it pulls in heavy admin-only libraries (recharts,
// xlsx) that must NOT ship in the main customer bundle. Loaded only on /admin.
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderFailedPage from "./pages/OrderFailedPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/PageTransition";
import RefundPolicy from "./pages/RefundPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CategoryPage from "./pages/CategoryPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import { useAuthStore } from "./store/authStore";
import { useCartStore } from "./store/cartStore";
import { ToastContainer } from "./components/ui/Toast";
import { initGoogleAnalytics, trackPageView } from "./utils/analytics";
import { initFacebookPixel, trackPixelEvent } from "./utils/pixel";
const LANG_PREFIXES = ["en", "ru"] as const;
type LangPrefix = (typeof LANG_PREFIXES)[number];

const LanguageRoute: React.FC<{ lang: LangPrefix }> = ({ lang }) => {
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);
  return <Outlet />;
};

///
const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    initGoogleAnalytics();
    initFacebookPixel();
  }, []);

  useEffect(() => {
    if (isAdminRoute) return;
    if (new URLSearchParams(location.search).has('_spa')) return;
    trackPageView(`${location.pathname}${location.search}`);
    trackPixelEvent("PageView");
  }, [isAdminRoute, location.pathname, location.search]);

  return null;
};

const CheckAndRenderLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Strip _spa marker (added by api/product/[id].ts redirect for non-bots) from the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('_spa')) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  if (isAdminRoute) {
    return <AnimatedRoutes />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="grow">
        <AnimatedRoutes />
      </main>
      <Footer />
    </div>
  );
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />
        <Route
          path="/products"
          element={
            <PageTransition>
              <ProductsPage />
            </PageTransition>
          }
        />
        <Route
          path="/category/:slug"
          element={
            <PageTransition>
              <CategoryPage />
            </PageTransition>
          }
        />
        <Route
          path="/blog"
          element={
            <PageTransition>
              <BlogPage />
            </PageTransition>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <PageTransition>
              <BlogPostPage />
            </PageTransition>
          }
        />
        <Route
          path="/about"
          element={
            <PageTransition>
              <AboutPage />
            </PageTransition>
          }
        />
        <Route
          path="/product/:id"
          element={
            <PageTransition>
              <ProductDetailsPage />
            </PageTransition>
          }
        />
        <Route
          path="/product/:id/review"
          element={
            <PageTransition>
              <ProductDetailsPage />
            </PageTransition>
          }
        />
        <Route
          path="/refund-policy"
          element={
            <PageTransition>
              <RefundPolicy />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition>
              <TermsAndConditions />
            </PageTransition>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <PageTransition>
              <PrivacyPolicy />
            </PageTransition>
          }
        />
        <Route
          path="/cart"
          element={
            <PageTransition>
              <CartPage />
            </PageTransition>
          }
        />
        <Route
          path="/checkout"
          element={
            <PageTransition>
              <CheckoutPage />
            </PageTransition>
          }
        />
        <Route
          path="/order-success/:orderId"
          element={
            <PageTransition>
              <OrderSuccessPage />
            </PageTransition>
          }
        />
        <Route
          path="/order-success"
          element={
            <PageTransition>
              <OrderSuccessPage />
            </PageTransition>
          }
        />
        <Route
          path="/order-failed/:orderId"
          element={
            <PageTransition>
              <OrderFailedPage />
            </PageTransition>
          }
        />
        <Route
          path="/order-failed"
          element={
            <PageTransition>
              <OrderFailedPage />
            </PageTransition>
          }
        />
        <Route
          path="/order-history"
          element={
            <PageTransition>
              <OrderHistoryPage />
            </PageTransition>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <PageTransition>
                <Suspense fallback={<LoadingScreen />}>
                  <AdminPage />
                </Suspense>
              </PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Multilingual routes: /en/... and /ru/... */}
        {LANG_PREFIXES.map((lang) => (
          <Route key={lang} path={`/${lang}`} element={<LanguageRoute lang={lang} />}>
            <Route index element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="products" element={<PageTransition><ProductsPage /></PageTransition>} />
            <Route path="category/:slug" element={<PageTransition><CategoryPage /></PageTransition>} />
            <Route path="blog" element={<PageTransition><BlogPage /></PageTransition>} />
            <Route path="blog/:slug" element={<PageTransition><BlogPostPage /></PageTransition>} />
            <Route path="about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="product/:id" element={<PageTransition><ProductDetailsPage /></PageTransition>} />
            <Route path="product/:id/review" element={<PageTransition><ProductDetailsPage /></PageTransition>} />
          </Route>
        ))}
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  // Auth სტორის მონაცემები (isLoading-ს გადავარქვით სახელი კონფლიქტის თავიდან ასაცილებლად)
  const { initializeAuth, user, isLoading: isAuthLoading } = useAuthStore();
  const { loadUserCart } = useCartStore();

  // 1. აპლიკაციის ინიციალიზაცია (Auth)
  // ვიზუალურ "splash"-ს აღარ ვაჩერებთ JS-ით: index.html-ის სტატიკური skeleton
  // უკვე ფარავს საწყის ჩატვირთვას და React mount-ზე ავტომატურად ინაცვლება.
  // ამით LCP-დან ~1.5 წამი იჭრება. Auth ფონურად ინიციალდება.
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 2. კალათის ჩატვირთვა (მხოლოდ მას შემდეგ, რაც Auth გაირკვევა)
  useEffect(() => {
    const loadCart = async () => {
      // სანამ ავტორიზაცია იტვირთება, კალათას ხელს არ ვახლებთ
      if (!isAuthLoading) {
        // მხოლოდ authenticated users-ისთვის ვტვირთავთ cart-ს Firestore-დან
        // guest users-ისთვის loadUserCart(null) ტვირთავს localStorage-დან
        await loadUserCart(user?.id || null);
      }
    };
    loadCart();
  }, [user?.id, isAuthLoading, loadUserCart]);

  return (
    <Router>
      <ScrollToTop />
      <AnalyticsTracker />
      <CheckAndRenderLayout />
      {/* Toast Notifications */}
      <ToastContainer />
    </Router>
  );
}

export default App;
