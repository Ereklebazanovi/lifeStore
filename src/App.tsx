// src/App.tsx

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import AboutPage from "./pages/AboutPage";
import CartPage from "./pages/CartPage";
import AdminPage from "./pages/admin/AdminPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderFailedPage from "./pages/OrderFailedPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";

import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/PageTransition";
import RefundPolicy from "./pages/RefundPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { useAuthStore } from "./store/authStore";
import { useCartStore } from "./store/cartStore";
import { ToastContainer } from "./components/ui/Toast";

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
          path="/order-failed/:orderId"
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
            <PageTransition>
              <AdminPage />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  // ვიზუალური "სპლეშ სქრინის" სტეიტი
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  // Auth სტორის მონაცემები (isLoading-ს გადავარქვით სახელი კონფლიქტის თავიდან ასაცილებლად)
  const { initializeAuth, user, isLoading: isAuthLoading } = useAuthStore();
  const { loadUserCart } = useCartStore();

  // 1. აპლიკაციის ინიციალიზაცია (Auth & Splash Timer)
  useEffect(() => {
    initializeAuth();

    // ეს მხოლოდ ვიზუალური ეფექტისთვისაა (2.5 წამი აჩვენებს ლოგოს)
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
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

  // სანამ ტაიმერი არ გასულა, ვაჩვენებთ LoadingScreen-ს
  if (isSplashLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />

        <main className="grow">
          <AnimatedRoutes />
        </main>

        <Footer />
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </Router>
  );
}

export default App;
