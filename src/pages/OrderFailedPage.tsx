//OrderFailedPage.tsx
import React, { useEffect, useState } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  Phone,
  Mail,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { OrderService } from "../services/orderService";
import { showToast } from "../components/ui/Toast";
import type { Order } from "../types";

const OrderFailedPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🔧 Get orderId from URL path parameter OR query parameter
    let orderIdToUse = orderId;
    if (!orderIdToUse) {
      // Try to get from query parameters (Flitt callback format)
      orderIdToUse = searchParams.get('order_id');
    }

    console.log("🔍 OrderFailedPage Debug:", {
      pathOrderId: orderId,
      queryOrderId: searchParams.get('order_id'),
      finalOrderId: orderIdToUse,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (!orderIdToUse) {
      console.error("❌ No orderId found in path or query parameters");
      showToast("შეკვეთის ID არ მოიძებნა", "error");
      navigate("/");
      return;
    }

    const fetchOrder = async () => {
      try {
        console.log("📊 Fetching failed order:", orderIdToUse);
        const orderData = await OrderService.getOrderById(orderIdToUse);
        if (!orderData) {
          showToast("შეკვეთა არ მოიძებნა", "error");
          navigate("/");
          return;
        }
        setOrder(orderData);
        console.log("✅ Failed order loaded successfully:", orderData.orderNumber);
      } catch (error) {
        console.error("Error fetching order:", error);
        showToast("მონაცემების ჩატვირთვა ვერ მოხერხდა", "error");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, searchParams, navigate]);

  const handleRetryPayment = () => {
    if (order) {
      // Redirect to checkout page with pre-filled order data
      navigate(`/checkout?retry=${order.orderNumber}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "ადგილზე გადახდა";
      case "flitt":
        return "Flitt (TBC Bank)";
      case "tbc_bank":
        return "TBC Bank";
      default:
        return "საბანკო გადარიცხვა";
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-pulse shadow-sm">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            გადახდა ვერ მოხერხდა
          </h1>
          <p className="text-stone-600 max-w-lg mx-auto mb-8 text-lg">
            თქვენი გადახდა ვერ დასრულდა წარმატებით. შეკვეთა შექმნილია, მაგრამ
            საჭიროა გადახდის განმეორება.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRetryPayment}
              className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 group"
            >
              <div className="p-2 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span>გადახდის განმეორება</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-3 bg-white border-2 border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-300 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>მთავარზე დაბრუნება</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Details */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-bold text-stone-900">
                  გადახდის პრობლემა
                </h3>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-red-800 font-medium">
                  შესაძლო მიზეზები:
                </p>
                <ul className="text-red-700 mt-2 space-y-1 text-sm">
                  <li>• არასაკმარისი ნაშთი ბარათზე</li>
                  <li>• ინტერნეტ კავშირის პრობლემა</li>
                  <li>• ბანკის სერვისის დროებითი შეფერხება</li>
                  <li>• ბარათის ვალიდურობის ვადის ამოწურვა</li>
                </ul>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-stone-600" />
                შეკვეთის დეტალები
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">
                    შეკვეთის ნომერი
                  </p>
                  <p className="font-bold text-stone-900 text-xl tracking-wider">
                    {order.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">
                    თარიღი
                  </p>
                  <p className="font-medium text-stone-900 text-lg">
                    {order.createdAt.toLocaleDateString("ka-GE")}
                    <span className="text-sm text-stone-400 ml-2">
                      {order.createdAt.toLocaleTimeString("ka-GE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">
                    გადახდის მეთოდი
                  </p>
                  <p className="font-medium text-stone-900">
                    {getPaymentMethodText(order.paymentMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mb-1.5">
                    ღირებულება
                  </p>
                  <p className="font-bold text-stone-900 text-2xl">
                    ₾{order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="text-amber-800 font-medium text-sm">
                  💡 შენიშვნა: შეკვეთა შექმნილია და შენახულია. თქვენ შეგიძლიათ
                  განაგრძოთ გადახდის პროცესი ან დაუკავშირდეთ ჩვენს მხარდაჭერას.
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                დახმარება საჭიროა?
              </h3>
              <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                თუ გადახდასთან პრობლემა გრძელდება, ჩვენი გუნდი მზადაა
                დაგეხმაროთ:
              </p>
              <div className="space-y-3">
                <a
                  href="tel:+995 511 72 72 57"
                  className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-all group border border-transparent hover:border-emerald-100"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 block font-bold uppercase tracking-wider">
                      დაგვირეკეთ
                    </span>
                    <span className="font-bold text-stone-800 text-lg group-hover:text-emerald-700">
                      +995 511 72 72 57
                    </span>
                  </div>
                </a>
                <a
                  href="mailto:info@lifestore.ge"
                  className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl hover:bg-emerald-50 hover:text-emerald-700 transition-all group border border-transparent hover:border-emerald-100"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 block font-bold uppercase tracking-wider">
                      მოგვწერეთ
                    </span>
                    <span className="font-bold text-stone-800 group-hover:text-emerald-700">
                      info@lifestore.ge
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                შემდეგი ნაბიჯები
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleRetryPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  გადახდის განმეორება
                </button>
                <Link
                  to="/products"
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  მთავარზე დაბრუნება
                </Link>
              </div>
            </div>

            {/* Alternative Payment */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
              <h4 className="font-bold text-stone-900 mb-3">
                ალტერნატიული გადახდა
              </h4>
              <p className="text-stone-600 text-sm mb-4">
                შეგიძლიათ აირჩიოთ სხვა გადახდის მეთოდი:
              </p>
              <ul className="text-stone-700 text-sm space-y-2">
                <li>• ადგილზე გადახდა (ნაღდი ანგარიშსწორება)</li>
                <li>• სხვა ბანკის ბარათი</li>
                <li>• ონლაინ ბანკინგი</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFailedPage;