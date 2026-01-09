// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { showToast } from "../components/ui/Toast";
import { getCartItemDisplayName } from "../utils/displayHelpers";
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
  CheckCircle2,
  Truck,
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
  const { items, getCartTotal, clearCart, validateAndCleanCart, getItemPrice } =
    useCartStore();
  const { user } = useAuthStore();

  const subtotal = getCartTotal();

  // --- STATE ---
  // ✅ Payment method defaults to "flitt" (Online)
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    secondaryPhone: "",
    email: "",
    city: "თბილისი",
    address: "",
    comment: "",
    paymentMethod: "flitt", 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  // Cart validation on page load
  useEffect(() => {
    const validateCart = async () => {
      if (items.length === 0) return;
      try {
        await validateAndCleanCart();
      } catch (error) {
        console.error("Checkout cart validation failed:", error);
      }
    };
    validateCart();
  }, [items.length, validateAndCleanCart]);

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

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!formData.address || !formData.firstName || !formData.lastName) {
      showToast("გთხოვთ შეავსოთ სავალდებულო ველები", "error");
      return;
    }

    setShowConfirmModal(true);
  };

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
          // @ts-expect-error - secondaryPhone handling
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

      if (formData.paymentMethod === "flitt") {
        const paymentRequest: CreatePaymentRequest = {
          orderId: createdOrder.orderNumber,
          amount: grandTotal,
          customerEmail: formData.email,
          description: `LifeStore Order #${createdOrder.orderNumber}`,
        };

        try {
          await PaymentService.processPayment(paymentRequest);
        } catch (paymentError) {
          console.error("Flitt payment error:", paymentError);
          showToast("ონლაინ გადახდის შეცდომა. სცადეთ თავიდან.", "error");
          return;
        }
      } else {
        navigate(`/order-success/${createdOrder.id}`);
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

  // Helper for input styles
  const inputBaseStyle = "w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all duration-200 text-stone-900 placeholder:text-stone-400";
  const labelStyle = "block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-20 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 text-center lg:text-left">
           <h1 className="text-2xl lg:text-3xl font-bold text-stone-900 font-bpg-arial">
            შეკვეთის გაფორმება
          </h1>
          <p className="text-stone-500 mt-2 text-sm">
            შეავსეთ მონაცემები და მიიღეთ ნივთი სწრაფად
          </p>
        </div>

        <form id="checkout-form" onSubmit={handlePreSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* --- LEFT SIDE: INPUTS --- */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. PAYMENT METHOD (Moved to top for priority) */}
            <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-stone-100">
               <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                გადახდის მეთოდი
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Online Payment Option */}
                <label 
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.paymentMethod === "flitt" 
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm" 
                      : "border-stone-100 hover:border-emerald-200 bg-stone-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="flitt"
                    checked={formData.paymentMethod === "flitt"}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {formData.paymentMethod === "flitt" && (
                    <div className="absolute top-3 right-3 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                    </div>
                  )}
                  <CreditCard className={`w-8 h-8 mb-3 ${formData.paymentMethod === "flitt" ? "text-emerald-600" : "text-stone-400"}`} />
                  <span className="font-bold text-sm text-stone-900">ონლაინ გადახდა</span>
                  <span className="text-[11px] text-stone-500 mt-1 text-center leading-tight">
                    Visa / Mastercard / Amex <br/> ნებისმიერი ბანკით
                  </span>
                </label>

                {/* Cash Payment Option */}
                <label 
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.paymentMethod === "cash" 
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm" 
                      : "border-stone-100 hover:border-emerald-200 bg-stone-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === "cash"}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {formData.paymentMethod === "cash" && (
                     <div className="absolute top-3 right-3 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                    </div>
                  )}
                  <Banknote className={`w-8 h-8 mb-3 ${formData.paymentMethod === "cash" ? "text-emerald-600" : "text-stone-400"}`} />
                  <span className="font-bold text-sm text-stone-900">ადგილზე გადახდა</span>
                  <span className="text-[11px] text-stone-500 mt-1 text-center leading-tight">
                    ქეშით ან ბარათით<br/>კურიერთან
                  </span>
                </label>
              </div>
            </div>

            {/* 2. COMBINED INFO (Contact + Delivery) */}
            <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-stone-100">
              <h2 className="text-lg font-bold text-stone-800 mb-5 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                პირადი ინფორმაცია
              </h2>

              <div className="space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>სახელი</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className={inputBaseStyle}
                      // placeholder="გიორგი"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>გვარი</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className={inputBaseStyle}
                      // placeholder="ბერიძე"
                    />
                  </div>
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>მობილური</label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>ელ-ფოსტა</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={inputBaseStyle}
                      placeholder="mail@example.com"
                    />
                  </div>
                </div>

                 {/* Secondary Phone (Optional, full width for clean look) */}
                 <div>
                    <label className={labelStyle}>
                      დამატებითი ნომერი <span className="text-stone-300 normal-case font-normal">(არასავალდებულო)</span>
                    </label>
                    <PhoneInput
                      value={formData.secondaryPhone}
                      onChange={(val) => setFormData((prev) => ({ ...prev, secondaryPhone: val }))}
                      placeholder="მაგ: ოჯახის წევრის"
                    />
                  </div>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-stone-100"></div>

              <h2 className="text-lg font-bold text-stone-800 mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                მისამართი
              </h2>

              <div className="space-y-4">
                 {/* City & Address */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="sm:col-span-1">
                      <label className={labelStyle}>ქალაქი</label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`${inputBaseStyle} appearance-none cursor-pointer`}
                      >
                        <option value="თბილისი">თბილისი</option>
                        <option value="ბათუმი">ბათუმი</option>
                        <option value="ქუთაისი">ქუთაისი</option>
                        <option value="რუსთავი">რუსთავი</option>
                        <option value="სხვა">სხვა</option>
                      </select>
                   </div>
                   <div className="sm:col-span-2">
                      <label className={labelStyle}>ზუსტი მისამართი</label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="ქუჩა, კორპუსი, ბინა"
                        className={inputBaseStyle}
                      />
                   </div>
                 </div>

                 {/* Comment */}
                 <div>
                    <label className={labelStyle}>კომენტარი კურიერისთვის</label>
                    <textarea
                      name="comment"
                      rows={2}
                      value={formData.comment}
                      onChange={handleChange}
                      className={inputBaseStyle}
                      placeholder="მაგ: სადარბაზოს კოდი, ეზოში შესასვლელი..."
                    />
                 </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT SIDE: SUMMARY (Sticky) --- */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-lg border border-stone-100 sticky top-4 lg:top-8 overflow-hidden">
              <div className="p-5 bg-stone-50 border-b border-stone-100">
                <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-stone-400" />
                  თქვენი შეკვეთა
                  <span className="ml-auto bg-stone-200 text-stone-600 text-xs py-1 px-2 rounded-full">
                    {items.length} ნივთი
                  </span>
                </h2>
              </div>

              {/* Items List (Compact) */}
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-5 space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-3 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {getCartItemDisplayName(item)}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-stone-500">
                          {item.quantity} x {getItemPrice(item).toFixed(2)}₾
                        </p>
                        <p className="text-sm font-bold text-stone-800">
                          {(item.quantity * getItemPrice(item)).toFixed(2)}₾
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-5 bg-stone-50/50 border-t border-stone-100 space-y-2">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>ჯამი</span>
                  <span>₾{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3" /> 
                    მიწოდება ({formData.city})
                  </span>
                  <span className={shippingCost === 0 ? "text-emerald-600 font-bold" : "text-stone-900"}>
                    {shippingCost === 0 ? "უფასო" : `+ ₾${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="my-3 border-t border-stone-200 border-dashed"></div>

                <div className="flex justify-between items-end">
                  <span className="text-base font-bold text-stone-900">სულ გადასახდელი</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    ₾{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions Area */}
              <div className="p-5 pt-0">
                {/* Terms */}
                <div id="terms-container" className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="terms-checkbox" className="text-xs text-stone-500 leading-snug cursor-pointer select-none">
                    ვეთანხმები <Link to="/terms" target="_blank" className="text-stone-800 font-bold underline decoration-stone-300 underline-offset-2 hover:text-emerald-600">წესებსა და პირობებს</Link>
                  </label>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting || !isAgreed}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]
                    ${isSubmitting || !isAgreed
                      ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                    }`}
                >
                  {isSubmitting ? (
                    "მუშავდება..."
                  ) : (
                    <>
                      <span>შეკვეთის დადასტურება</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* აქ შეგიძლია ჩასვა ბანკების ლოგოები სურვილისამებრ */}
                <div className="flex items-center gap-1 text-xs text-stone-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>დაცული გადახდა</span>
                </div>
            </div>
          </div>
        </form>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-emerald-600" />
            </div>

            <h3 className="text-lg font-bold text-center text-stone-900">
              ნომრის გადამოწმება
            </h3>
            
            <p className="text-center text-stone-500 text-sm mt-2 mb-6">
              დარწმუნდით რომ ნომერი სწორია, კურიერი დაგიკავშირდებათ:
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-6 text-center">
               <span className="text-2xl font-bold text-stone-900 tracking-wider">
                {formData.phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-3 text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                შესწორება
              </button>
              <button
                onClick={handleConfirmOrder}
                className="py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 transition-colors"
              >
                დადასტურება
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;