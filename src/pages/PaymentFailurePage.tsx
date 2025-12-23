// src/pages/PaymentFailurePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  XCircle,
  RefreshCw,
  Home,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { PaymentService } from "../services/paymentService";
import { showToast } from "../components/ui/Toast";

const PaymentFailurePage: React.FC = () => {
  const navigate = useNavigate();
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Get pending payment info
    const pendingPayment = PaymentService.getPendingPayment();
    setOrderInfo(pendingPayment);
  }, []);

  const handleRetryPayment = async () => {
    if (!orderInfo) {
      showToast("შეკვეთის ინფორმაცია ვერ მოიძებნა", "error");
      navigate("/cart");
      return;
    }

    setIsRetrying(true);

    try {
      // Retry payment with same order info
      const paymentRequest = {
        orderId: orderInfo.orderId,
        amount: orderInfo.amount,
        customerEmail: orderInfo.customerEmail || "customer@lifestore.ge",
        customerName: orderInfo.customerName || "Customer",
        description: `LifeStore Order #${orderInfo.orderId} (Retry)`,
      };

      await PaymentService.processPayment(paymentRequest);
    } catch (error) {
      console.error("Retry payment error:", error);
      showToast("გადახდის განმეორების შეცდომა", "error");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoToCart = () => {
    // Clear any pending payment info
    PaymentService.clearPendingPayment();
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-stone-900 mb-4">
            გადახდა ვერ დასრულდა
          </h1>

          <p className="text-lg text-stone-600 mb-8">
            მტკივნეულია, მაგრამ თქვენი გადახდა ვერ დაესრულა წარმატებით.
          </p>

          {/* Error Details */}
          <div className="bg-red-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span className="text-lg font-semibold text-red-800">
                შესაძლო მიზეზები
              </span>
            </div>

            <ul className="text-left text-red-700 space-y-2 max-w-md mx-auto">
              <li>• არასაკმარისი თანხა ბარათზე</li>
              <li>• ბარათი დაბლოკილია ონლაინ გადახდებისთვის</li>
              <li>• სერვისის დროებითი შეფერხება</li>
              <li>• ქსელის კავშირის პრობლემა</li>
            </ul>
          </div>

          {/* Order Info */}
          {orderInfo && (
            <div className="bg-stone-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-stone-800 mb-3">
                შეკვეთის ინფორმაცია
              </h3>

              <div className="space-y-2 text-stone-700">
                <p>
                  <strong>შეკვეთის ნომერი:</strong> {orderInfo.orderId}
                </p>
                <p>
                  <strong>თანხა:</strong> ₾{orderInfo.amount.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleRetryPayment}
              disabled={isRetrying}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {isRetrying ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              გადახდის განმეორება
            </button>

            <button
              onClick={handleGoToCart}
              className="flex items-center justify-center gap-2 bg-stone-100 text-stone-900 px-6 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              კალათაში დაბრუნება
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-stone-700 transition-colors w-full sm:w-auto"
          >
            <Home className="w-5 h-5" />
            მთავარი გვერდი
          </button>

          {/* Alternative Payment */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-sm text-stone-600 mb-3">
              ალტერნატიული გადახდის მეთოდი:
            </p>
            <p className="text-sm text-stone-800 font-medium">
              📞 დაგვირეკეთ +995 511 72 72 57
              <br />
              და შეკვეთა გაფორმდება ტელეფონურად
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
