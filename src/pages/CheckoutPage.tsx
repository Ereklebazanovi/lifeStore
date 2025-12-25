// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { showToast } from "../components/ui/Toast";
import { OrderService } from "../services/orderService";
import { PaymentService } from "../services/paymentService";
import PhoneInput from "../components/ui/PhoneInput";
import {
  MapPin,
  User,
  CreditCard,
  Banknote,
  ArrowRight,
  Package,
  ShieldCheck,
  Smartphone,
  Mail,
} from "lucide-react";
import type { CreateOrderRequest, CreatePaymentRequest } from "../types";

// ადგილობრივი ინტერფეისი ფორმისთვის
interface CheckoutFormData {
  firstName: string;
  lastName: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  city: string;
  address: string;
  comment: string;
  paymentMethod: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getCartTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const subtotal = getCartTotal();

  // --- STATE ---
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    secondaryPhone: "", // ✅ მეორე ნომერი დაბრუნდა
    email: "",
    city: "თბილისი",
    address: "",
    comment: "",
    paymentMethod: "cash",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); // ✅ თანხმობა
  const [showConfirmModal, setShowConfirmModal] = useState(false); // ✅ მოდალი დაბრუნდა

  const shippingCost = formData.city === "თბილისი" ? 0 : 7;
  const grandTotal = subtotal + shippingCost;

  // მომხმარებლის ინფორმაციის ავტომატური შევსება
  useEffect(() => {
    if (user) {
      const names = user.displayName?.split(" ") || ["", ""];
      setFormData((prev) => ({
        ...prev,
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // ცარიელი კალათის შემოწმება
  useEffect(() => {
    if (items.length === 0 && !isSubmitting) {
      const timeoutId = setTimeout(() => {
        navigate("/cart");
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [items, navigate, isSubmitting]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- HANDLERS ---

  // 1. "შეკვეთის დადასტურებაზე" დაჭერა (ვალიდაცია)
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ა) თანხმობის შემოწმება
    if (!isAgreed) {
      showToast("გთხოვთ, დაეთანხმოთ წესებსა და პირობებს", "error");
      const checkboxArea = document.getElementById("terms-container");
      if (checkboxArea) {
        checkboxArea.classList.add("ring-2", "ring-red-500");
        setTimeout(
          () => checkboxArea.classList.remove("ring-2", "ring-red-500"),
          2000
        );
      }
      return;
    }

    // ბ) ტელეფონის ვალიდაცია
    if (
      !formData.phone ||
      formData.phone.length !== 9 ||
      !formData.phone.startsWith("5")
    ) {
      showToast(
        "გთხოვთ ჩაწეროთ სწორი ქართული მობილურის ნომერი (9 ციფრი)",
        "error"
      );
      return;
    }

    // გ) სხვა ველები
    if (!formData.address || !formData.firstName || !formData.lastName) {
      showToast("გთხოვთ შეავსოთ სავალდებულო ველები", "error");
      return;
    }

    // ✅ ყველაფერი რიგზეა -> ვხსნით მოდალს
    setShowConfirmModal(true);
  };

  // 2. მოდალში "კი"-ს დაჭერა (რეალური გაგზავნა)
  const handleConfirmOrder = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const orderRequest: CreateOrderRequest = {
        userId: user?.id || null,
        items,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          // @ts-expect-error - secondaryPhone might not be in types yet, but we send it
          secondaryPhone: formData.secondaryPhone,
          email: formData.email,
        },
        deliveryInfo: {
          city: formData.city,
          address: formData.address,
          comment: formData.comment,
        },
        paymentMethod: formData.paymentMethod as "cash" | "tbc_bank" | "flitt",
      };

      const createdOrder = await OrderService.createOrder(orderRequest);

      // Check if it's a Flitt payment
      if (formData.paymentMethod === "flitt") {
        // Create payment request for Flitt
        const paymentRequest: CreatePaymentRequest = {
          orderId: createdOrder.orderNumber,
          amount: grandTotal,
          customerEmail: formData.email,
          description: `LifeStore Order #${createdOrder.orderNumber}`,
        };

        try {
          // Process Flitt payment (will redirect to Flitt)
          await PaymentService.processPayment(paymentRequest);
          // Note: User will be redirected, so clear cart here
          clearCart();
        } catch (paymentError) {
          console.error("Flitt payment error:", paymentError);
          showToast("ონლაინ გადახდის შეცდომა. სცადეთ თავიდან.", "error");
          return;
        }
      } else {
        // Cash payment - normal flow
        navigate(`/order-success/${createdOrder.id}`);

        // Fallback
        setTimeout(() => {
          window.location.href = `/order-success/${createdOrder.id}`;
        }, 500);

        clearCart();
        showToast(`შეკვეთა წარმატებით გაფორმდა!`, "success");
      }
    } catch (error) {
      console.error("Order failed:", error);
      showToast("შეკვეთის გაფორმება ვერ მოხერხდა", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-8 text-center lg:text-left font-bpg-arial">
          შეკვეთის გაფორმება
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* --- LEFT SIDE: FORMS --- */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Info */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                საკონტაქტო ინფორმაცია
              </h2>

              <form
                id="checkout-form"
                onSubmit={handlePreSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      სახელი *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      გვარი *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Phone */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      მობილური *
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, phone: val }))
                      }
                      required
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      კურიერი დაგიკავშირდებათ ამ ნომერზე
                    </p>
                  </div>

                  {/* ✅ Secondary Phone - დაბრუნდა! */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      დამატებითი ნომერი{" "}
                      <span className="text-stone-400 text-xs font-normal">
                        (არასავალდებულო)
                      </span>
                    </label>
                    <PhoneInput
                      value={formData.secondaryPhone}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          secondaryPhone: val,
                        }))
                      }
                      placeholder="მაგ: ოჯახის წევრის"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    ელ-ფოსტა *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                მიწოდება
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    ქალაქი / რაიონი *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="თბილისი">თბილისი (უფასო)</option>
                    <option value="ბათუმი">ბათუმი (+7₾)</option>
                    <option value="ქუთაისი">ქუთაისი (+7₾)</option>
                    <option value="რუსთავი">რუსთავი (+7₾)</option>
                    <option value="სხვა">სხვა რეგიონები (+7₾)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    ზუსტი მისამართი *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="მაგ: ჭავჭავაძის გამზ. 15, ბინა 4"
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    კომენტარი (არასავალდებულო)
                  </label>
                  <textarea
                    name="comment"
                    rows={3}
                    value={formData.comment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    placeholder="მაგ: შლაგბაუმის კოდი..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                გადახდის მეთოდი
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-emerald-200 bg-emerald-50 rounded-xl cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === "cash"}
                    onChange={handleChange}
                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-700" />
                    <span className="font-medium text-stone-900">
                      ადგილზე გადახდა (ქეში/ბარათი)
                    </span>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-blue-200 bg-blue-50 rounded-xl cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="flitt"
                    checked={formData.paymentMethod === "flitt"}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-700" />
                    <span className="font-medium text-stone-900">
                      ონლაინ გადახდა (Flitt)
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      TBC Bank
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* --- RIGHT SIDE: SUMMARY --- */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-lg border border-stone-100 sticky top-24">
              <h2 className="text-xl font-bold text-stone-800 mb-6">
                შეკვეთის დეტალები
              </h2>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 items-start">
                    <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-full h-full p-4 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-stone-900 line-clamp-2">
                        {item.product.name}
                      </h4>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-stone-500">
                          {item.quantity} x ₾{item.product.price}
                        </span>
                        <span className="text-sm font-semibold text-stone-700">
                          ₾{(item.quantity * item.product.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-stone-600">
                  <span>პროდუქტები</span>
                  <span>₾{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>მიწოდება ({formData.city})</span>
                  <span
                    className={
                      shippingCost === 0
                        ? "text-green-600 font-bold"
                        : "text-stone-900 font-medium"
                    }
                  >
                    {shippingCost === 0
                      ? "უფასო"
                      : `+ ₾${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-stone-900 pt-3 border-t border-stone-100 mt-2">
                  <span>სულ გადასახდელი</span>
                  <span className="text-emerald-700">
                    ₾{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* ✅ Terms Checkbox */}
              <div
                id="terms-container"
                className="flex items-start gap-3 mb-6 p-4 bg-stone-50 rounded-xl border border-stone-100 transition-all hover:border-emerald-100"
              >
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <label
                  htmlFor="terms-checkbox"
                  className="text-sm text-stone-600 cursor-pointer select-none leading-relaxed"
                >
                  ვეთანხმები{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-stone-900 font-bold hover:text-emerald-600 underline"
                  >
                    მომსახურების პირობებს*
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                form="checkout-form" // ეს ღილაკი ატრიგერებს handlePreSubmit-ს
                disabled={isSubmitting || !isAgreed}
                className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg active:scale-95
                  ${
                    isSubmitting || !isAgreed
                      ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                      : "bg-stone-900 hover:bg-emerald-600 text-white"
                  }`}
              >
                {isSubmitting ? (
                  <span>მუშავდება...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>შეკვეთის დადასტურება</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {!isAgreed && (
                <p className="text-xs text-red-400 text-center mt-3 font-medium animate-pulse">
                  * შეკვეთის გასაფორმებლად სავალდებულოა წესებზე თანხმობა
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CONFIRMATION MODAL - დაბრუნდა! */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-emerald-600" />
            </div>

            <h3 className="text-lg font-bold text-center text-stone-900 mb-2">
              გთხოვთ გადაამოწმოთ ნომერი
            </h3>

            <p className="text-center text-stone-600 text-sm mb-6">
              კურიერი დაგიკავშირდებათ ამ ნომერზე:
              <br />
              <span className="block mt-2 text-2xl font-bold text-stone-900 tracking-wider">
                {formData.phone.replace(
                  /(\d{3})(\d{2})(\d{2})(\d{2})/,
                  "$1 $2 $3 $4"
                )}
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 text-stone-600 font-medium bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                არა, შესწორება
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-3 text-white font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 transition-colors"
              >
                კი, სწორია
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
