import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { showToast } from "../components/ui/Toast";
import { OrderService } from "../services/orderService";
import PhoneInput from "../components/ui/PhoneInput";
import {
  MapPin,
  User,
  Mail,
  CreditCard,
  Banknote,
  ArrowRight,
  Package,
} from "lucide-react";
import type { DeliveryInfo, CreateOrderRequest } from "../types";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getCartTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  // 1. პროდუქტების ჯამი
  const subtotal = getCartTotal();

  const [formData, setFormData] = useState<DeliveryInfo>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "თბილისი", // Default
    address: "",
    comment: "",
    paymentMethod: "cash",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. დინამიური მიტანის ფასი
  // თუ თბილისია - 0, სხვა შემთხვევაში - 7
  const shippingCost = formData.city === "თბილისი" ? 0 : 7;

  // 3. საბოლოო ჯამი (პროდუქტები + გზა)
  const grandTotal = subtotal + shippingCost;

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

  useEffect(() => {
    // Only redirect to cart if not currently submitting an order
    // Add small delay to prevent race condition with navigation
    if (items.length === 0 && !isSubmitting) {
      const timeoutId = setTimeout(() => {
        navigate("/cart");
      }, 100); // 100ms delay

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

  const handlePhoneChange = (phoneValue: string) => {
    setFormData((prev) => ({ ...prev, phone: phoneValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone || formData.phone.length !== 9 || !formData.phone.startsWith('5')) {
      showToast("გთხოვთ ჩაწეროთ სწორი ქართული მობილურის ნომერი", "error");
      return;
    }
    if (!formData.address) {
      showToast("მისამართი სავალდებულოა", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data for OrderService
      const orderRequest: CreateOrderRequest = {
        userId: user?.id || null,
        items,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
        deliveryInfo: {
          city: formData.city,
          address: formData.address,
          comment: formData.comment,
        },
        paymentMethod: formData.paymentMethod as 'cash' | 'tbc_bank',
      };

      console.log("შეკვეთა იგზავნება:", orderRequest);

      // Create order using OrderService
      const createdOrder = await OrderService.createOrder(orderRequest);

      console.log("🎯 Created order:", createdOrder);
      console.log("🎯 Order ID:", createdOrder.id);
      console.log("🎯 Navigating to:", `/order-success/${createdOrder.id}`);

      // Try both navigation methods for debugging
      console.log("🔍 Testing navigation...");

      // Method 1: React Router navigate
      navigate(`/order-success/${createdOrder.id}`);

      // Method 2: Force navigation with window.location (fallback)
      setTimeout(() => {
        window.location.href = `/order-success/${createdOrder.id}`;
      }, 500);

      // Then clear cart and show success
      clearCart();
      showToast(`შეკვეთა წარმატებით გაფორმდა! ნომერი: ${createdOrder.orderNumber}`, "success");

    } catch (error) {
      console.error("Order failed:", error);
      showToast("შეკვეთის გაფორმება ვერ მოხერხდა", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-8 text-center lg:text-left">
          შეკვეთის გაფორმება
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* --- LEFT SIDE: FORM --- */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                საკონტაქტო ინფორმაცია
              </h2>

              <form
                id="checkout-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* ... Name & Contact Rows (იგივე რჩება) ... */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      სახელი *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
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
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      მობილური *
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                    />
                  </div>
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
                        className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="example@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                {/* City Selection - Trigger for Shipping Cost */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    ქალაქი / რაიონი *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all mb-4 bg-white"
                  >
                    <option value="თბილისი">თბილისი (უფასო)</option>
                    <option value="ბათუმი">ბათუმი (+7₾)</option>
                    <option value="ქუთაისი">ქუთაისი (+7₾)</option>
                    <option value="რუსთავი">რუსთავი (+7₾)</option>
                    <option value="სხვა">სხვა რეგიონები (+7₾)</option>
                  </select>

                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    ზუსტი მისამართი *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="ჭავჭავაძის გამზ. 15, ბინა 4, სართული 2"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    კომენტარი კურიერისთვის (არასავალდებულო)
                  </label>
                  <textarea
                    name="comment"
                    rows={3}
                    value={formData.comment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="მაგ: შლაგბაუმის კოდია..."
                  />
                </div>
              </form>
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
                <label className="flex items-center p-4 border border-stone-200 rounded-xl opacity-60 cursor-not-allowed">
                  <input
                    type="radio"
                    name="paymentMethod"
                    disabled
                    className="w-5 h-5 text-stone-400"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-stone-500">
                      ონლაინ გადახდა (მალე დაემატება)
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* --- RIGHT SIDE: ORDER SUMMARY --- */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-lg border border-stone-100 sticky top-24">
              <h2 className="text-xl font-bold text-stone-800 mb-6">
                შეკვეთის დეტალები
              </h2>

              {/* Items List */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 items-start">
                    <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
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

              {/* Totals */}
              <div className="border-t border-stone-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-stone-600">
                  <span>პროდუქტები</span>
                  <span>₾{subtotal.toFixed(2)}</span>
                </div>

                {/* DYNAMIC SHIPPING COST */}
                <div className="flex justify-between items-center text-stone-600">
                  <span>მიწოდება ({formData.city})</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-sm">
                      უფასო
                    </span>
                  ) : (
                    <span className="text-stone-900 font-medium">
                      + ₾{shippingCost.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-xl font-bold text-stone-900 pt-3 border-t border-stone-100 mt-2">
                  <span>სულ გადასახდელი</span>
                  <span className="text-emerald-700">
                    ₾{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full bg-stone-900 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>მუშავდება...</span>
                ) : (
                  <>
                    <span>შეკვეთის დადასტურება</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-stone-400 text-center mt-4">
                ღილაკზე დაჭერით თქვენ ეთანხმებით მომსახურების პირობებს
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
