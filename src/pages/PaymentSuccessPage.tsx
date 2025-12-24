// Path: src/pages/PaymentSuccessPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Home, ShoppingBag, Loader } from "lucide-react";
import { PaymentService } from "../services/paymentService";
import { showToast } from "../components/ui/Toast";

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const pendingPayment = PaymentService.getPendingPayment();

        if (!pendingPayment) {
          showToast("გადახდის ინფორმაცია ვერ მოიძებნა", "error");
          navigate("/");
          return;
        }

        if (pendingPayment.paymentId) {
          const paymentStatus = await PaymentService.getPaymentStatus(
            pendingPayment.paymentId
          );

          if (paymentStatus.success && paymentStatus.status === "approved") {
            setPaymentVerified(true);
            setOrderInfo(pendingPayment);
            showToast("გადახდა წარმატებით დასრულდა!", "success");
            PaymentService.clearPendingPayment();
          } else {
            showToast("გადახდის ვერიფიკაცია ვერ მოხერხდა", "error");
            navigate("/payment/failure");
            return;
          }
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        showToast("გადახდის ვერიფიკაციის შეცდომა", "error");
        navigate("/payment/failure");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-stone-800 mb-2">
            გადახდის ვერიფიკაცია
          </h1>
          <p className="text-stone-600">გთხოვთ დაელოდოთ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-stone-900 mb-4">
            გადახდა წარმატებით დასრულდა!
          </h1>

          <p className="text-lg text-stone-600 mb-8">
            თქვენი შეკვეთა წარმატებით გადახდილია და მუშავდება.
          </p>

          {orderInfo && (
            <div className="bg-stone-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Package className="w-6 h-6 text-stone-600" />
                <span className="text-lg font-semibold text-stone-800">
                  შეკვეთის დეტალები
                </span>
              </div>

              <div className="space-y-2 text-stone-700">
                <p>
                  <strong>შეკვეთის ნომერი:</strong> {orderInfo.orderId}
                </p>
                <p>
                  <strong>თანხა:</strong> ₾{orderInfo.amount.toFixed(2)}
                </p>
                <p>
                  <strong>გადახდის მეთოდი:</strong> Flitt (TBC Bank)
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              რა მოხდება შემდეგ?
            </h3>
            <ul className="text-left text-blue-800 space-y-2">
              <li>• კურიერი დაგიკავშირდებათ 24 საათში</li>
              <li>• მიწოდება გაფორმდება 1-3 სამუშაო დღეში</li>
              <li>• ელ-ფოსტაზე მიიღებთ დეტალურ ინვოისს</li>
              <li>• შეკვეთის სტატუსს ნახავთ "შეკვეთების ისტორიაში"</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/order-history")}
              className="flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-stone-700 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              შეკვეთების ისტორია
            </button>

            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 bg-stone-100 text-stone-900 px-6 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              <Home className="w-5 h-5" />
              მთავარი გვერდი
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-sm text-stone-500">
              კითხვების შემთხვევაში დაგვიკავშირდით:
              <br />
              📞 +995 511 72 72 57 | ✉️ info@lifestore.ge
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;