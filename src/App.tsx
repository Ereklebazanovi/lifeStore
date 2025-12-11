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
import CartPage from "./pages/CartPage";
import AdminPage from "./pages/admin/AdminPage";
import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/PageTransition";
import { useAuthStore } from "./store/authStore";
import { useCartStore } from "./store/cartStore";
import { ToastContainer } from "./components/ui/Toast";
import ProductDetailsPage from "./pages/ProductDetailsPage";
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
          path="/cart"
          element={
            <PageTransition>
              <CartPage />
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
        <Route
          path="/product/:id"
          element={
            <PageTransition>
              <ProductDetailsPage />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { initializeAuth, user, isLoading } = useAuthStore();
  const { loadUserCart } = useCartStore();

  useEffect(() => {
    // Initialize authentication
    initializeAuth();

    // Simulate initial loading time
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Load user-specific cart when auth state changes
  useEffect(() => {
    const loadCart = async () => {
      if (!isLoading) {
        // Load cart based on user state
        await loadUserCart(user?.id || null);
      }
    };
    loadCart();
  }, [user?.id, isLoading, loadUserCart]);

  if (isInitialLoading) {
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
