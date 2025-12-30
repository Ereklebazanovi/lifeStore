// src/components/admin/CreateManualOrderModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Save,
  ShoppingBag,
  User,
  MapPin,
  DollarSign,
  Globe,
} from "lucide-react";
import { OrderService } from "../../../services/orderService";
import { showToast } from "../../../components/ui/Toast";
import type {
  CreateManualOrderRequest,
  ManualOrderItem,
  OrderSource,
} from "../../../types";
// ✅ 1. იმპორტი
import PhoneInput from "../../../components/ui/PhoneInput";
import ProductAutocomplete, {
  ProductSelection,
} from "../../../components/admin/ProductAutocomplete";
import { useProductStore } from "../../../store/productStore";

interface CreateManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const CreateManualOrderModal: React.FC<CreateManualOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { products } = useProductStore(); // ✅ დავამატოთ products access

  // --- Form State ---
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const [deliveryInfo, setDeliveryInfo] = useState({
    city: "თბილისი",
    address: "",
    comment: "",
  });

  const [items, setItems] = useState<ManualOrderItem[]>([
    { name: "", price: 0, quantity: 1 },
  ]);

  const [source, setSource] = useState<OrderSource>("instagram");
  const [status, setStatus] = useState<"pending" | "shipped" | "delivered">(
    "shipped"
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "other" | "bank_transfer"
  >("cash");
  const [shippingCost, setShippingCost] = useState(0);

  // --- Calculations ---
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (isOpen) {
      setCustomerInfo({ firstName: "", lastName: "", phone: "", email: "" });
      setDeliveryInfo({ city: "თბილისი", address: "", comment: "" });
      setItems([{ name: "", price: 0, quantity: 1 }]);
      setSource("instagram");
      setStatus("shipped");
      setPaymentMethod("cash");
      setShippingCost(0);
    }
  }, [isOpen]);

  // --- Handlers ---
  const handleItemChange = (
    index: number,
    field: keyof ManualOrderItem,
    value: string | number
  ) => {
    const newItems = [...items];
    if (field === "price" || field === "quantity") {
      newItems[index] = { ...newItems[index], [field]: Number(value) };
    } else {
      // ✅ აქ დავამატეთ "as string", რაც ასწორებს error-ს
      newItems[index] = { ...newItems[index], [field]: value as string };
    }
    setItems(newItems);
  };

  const handleProductSelect = (index: number, selection: ProductSelection) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selection.product?.id,
      variantId: selection.variantId, // 👈 ვამატებთ variant ID-ს
      name: selection.name,
      price: selection.price,
    };
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { name: "", price: 0, quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerInfo.firstName || !customerInfo.phone) {
      showToast("შეავსეთ კლიენტის სახელი და ტელეფონი", "error");
      return;
    }
    // დამატებითი შემოწმება ტელეფონის სიგრძეზე (9 ციფრი)
    if (customerInfo.phone.length !== 9) {
      showToast("ტელეფონის ნომერი არასწორია (საჭიროა 9 ციფრი)", "error");
      return;
    }

    if (items.some((item) => !item.name || item.price < 0)) {
      showToast("შეავსეთ პროდუქტის მონაცემები სწორად", "error");
      return;
    }

    // ✅ Enhanced Stock Validation - Support variants
    const itemsWithProductId = items.filter(
      (item) => item.productId && !item.productId.startsWith("manual_")
    );

    for (const item of itemsWithProductId) {
      if (item.productId) {
        const currentProduct = products.find((p) => p.id === item.productId);
        if (currentProduct) {
          let availableStock = 0;
          let stockSource = "";

          // Check if this is a variant or simple product
          if (item.variantId && currentProduct.hasVariants) {
            const variant = currentProduct.variants?.find(
              (v) => v.id === item.variantId
            );
            if (variant) {
              availableStock = variant.stock || 0;
              stockSource = `ვარიანტი: ${variant.name}`;
            } else {
              showToast(`ვარიანტი არ მოიძებნა: "${item.name}"`, "error");
              return;
            }
          } else {
            availableStock = currentProduct.stock || 0;
            stockSource = "მთავარი პროდუქტი";
          }

          if (availableStock < item.quantity) {
            showToast(
              `არასაკმარისი მარაგი: "${item.name}" (${stockSource})\nმოთხოვნილია: ${item.quantity}, ხელმისაწვდომია: ${availableStock}`,
              "error"
            );
            return;
          }
        }
      }
    }

    try {
      setIsLoading(true);
      const orderData: CreateManualOrderRequest = {
        source,
        items,
        customerInfo,
        deliveryInfo,
        shippingCost,
        status,
        paymentMethod: paymentMethod as any,
      };

      await OrderService.createManualOrder(orderData);
      showToast("შეკვეთა წარმატებით შეიქმნა!", "success");
      onOrderCreated();
      onClose();
    } catch (error) {
      console.error(error);
      showToast("შეკვეთის შექმნა ვერ მოხერხდა", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="h-full flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-2xl w-full max-w-7xl h-[95vh] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
          {/* --- Enhanced Header --- */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-t-2xl flex items-center justify-between text-white flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Plus className="w-6 h-6" />
                </div>
                ახალი შეკვეთის დამატება
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                სოციალური ქსელებიდან შემოსული შეკვეთების დამატება
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="დახურვა"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* --- Main Content: Two Panel Layout --- */}
          <div className="flex-1 flex overflow-hidden">
            <form
              id="create-order-form"
              onSubmit={handleSubmit}
              className="flex w-full h-full"
            >
              {/* LEFT PANEL: Products & Cart */}
              <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Quick Order Settings */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      შეკვეთის პარამეტრები
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          წყარო
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select
                            value={source}
                            onChange={(e) =>
                              setSource(e.target.value as OrderSource)
                            }
                            className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                          >
                            <option value="instagram">📸 Instagram</option>
                            <option value="facebook">👥 Facebook</option>
                            <option value="tiktok">🎵 TikTok</option>
                            <option value="phone">📞 ტელეფონი</option>
                            <option value="personal">👤 პირადი</option>
                            <option value="other">⚡ სხვა</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          სტატუსი
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                          <option value="pending">⏳ მუშავდება</option>
                          <option value="shipped">🚚 გაგზავნილი</option>
                          <option value="delivered">✅ მიტანილი</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          გადახდა
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as any)
                          }
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                          <option value="cash">💵 ნაღდი / ადგილზე</option>
                          <option value="bank_transfer">🏦 ბანკი</option>
                          <option value="other">💳 სხვა</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Product Search */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-emerald-600" />
                      პროდუქტების დამატება
                    </h3>

                    {/* Large Product Search */}
                    <div className="space-y-4">
                      <div className="relative">
                        <ProductAutocomplete
                          value={items[0]?.name || ""}
                          onChange={(value) =>
                            handleItemChange(0, "name", value)
                          }
                          onProductSelect={(selection) =>
                            handleProductSelect(0, selection)
                          }
                          placeholder="ძებნა: მაგ. 'თას ლანჩბოქსი', 'ფოტო', 'ჩანთა'..."
                          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                          requestedQuantity={items[0]?.quantity || 1}
                        />
                      </div>

                      {/* Quick Add Buttons for Popular Products */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { name: "ლანჩბოქსი", icon: "🍱" },
                          { name: "ფოტო", icon: "📸" },
                          { name: "ჩანთა", icon: "👜" },
                          { name: "აქსესუარი", icon: "✨" },
                        ].map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() =>
                              handleItemChange(0, "name", item.name)
                            }
                            className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-emerald-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all"
                          >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {item.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Current Cart Items */}
                  {items.filter((item) => item.name).length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        კალათა
                      </h3>
                      <div className="space-y-3">
                        {items
                          .filter((item) => item.name)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                {item.productId && (
                                  <div className="mt-1">
                                    {(() => {
                                      const currentProduct = products.find(
                                        (p) => p.id === item.productId
                                      );
                                      if (!currentProduct) return null;

                                      let availableStock = 0;
                                      if (
                                        item.variantId &&
                                        currentProduct.hasVariants
                                      ) {
                                        const variant =
                                          currentProduct.variants?.find(
                                            (v) => v.id === item.variantId
                                          );
                                        availableStock = variant?.stock || 0;
                                      } else {
                                        availableStock =
                                          currentProduct.stock || 0;
                                      }

                                      if (availableStock <= 0) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            ❌ ამოიწურა
                                          </span>
                                        );
                                      } else if (
                                        availableStock < item.quantity
                                      ) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            ⚠️ არასაკმარისია ({availableStock}{" "}
                                            ცალი)
                                          </span>
                                        );
                                      } else if (availableStock <= 5) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            ⚡ დაბალი მარაგი ({availableStock}{" "}
                                            ცალი)
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                            ✅ ხელმისაწვდომია ({availableStock}{" "}
                                            ცალი)
                                          </span>
                                        );
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleItemChange(
                                        index,
                                        "quantity",
                                        Math.max(1, item.quantity - 1)
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-12 text-center font-medium text-lg">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleItemChange(
                                        index,
                                        "quantity",
                                        item.quantity + 1
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none text-center"
                                  />
                                  <div className="text-lg font-bold text-gray-900">
                                    ₾{(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                                {items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeItemRow(index)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>

                      <button
                        type="button"
                        onClick={addItemRow}
                        className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        ახალი პროდუქტის დამატება
                      </button>

                      {/* Totals Summary */}
                      <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                        <div className="space-y-2">
                          <div className="flex justify-between text-lg">
                            <span className="text-gray-700">ქვე-ჯამი:</span>
                            <span className="font-semibold text-gray-900">
                              ₾{subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 flex items-center gap-1">
                              მიწოდება:
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={shippingCost}
                              onChange={(e) =>
                                setShippingCost(Number(e.target.value))
                              }
                              className="w-24 px-3 py-1 text-right border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                            />
                          </div>
                          <div className="flex justify-between text-2xl font-bold text-emerald-700 border-t border-emerald-300 pt-2">
                            <span>სულ:</span>
                            <span>₾{total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: Customer & Delivery Info */}
              <div className="w-96 bg-white p-6 border-l border-gray-200 overflow-y-auto">
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      კლიენტის ინფორმაცია
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="სახელი *"
                          required
                          value={customerInfo.firstName}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white placeholder:text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="გვარი"
                          value={customerInfo.lastName}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white placeholder:text-gray-400"
                        />
                      </div>

                      {/* Enhanced Phone Input */}
                      <div className="phone-input-wrapper">
                        <PhoneInput
                          value={customerInfo.phone}
                          onChange={(val) =>
                            setCustomerInfo({ ...customerInfo, phone: val })
                          }
                          required
                          className="py-3 text-base !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-blue-500"
                          placeholder="555 12 34 56"
                        />
                      </div>

                      <input
                        type="email"
                        placeholder="ელ-ფოსტა (არასავალდებულო)"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-600" />
                      მიწოდების ინფორმაცია
                    </h3>
                    <div className="space-y-4">
                      <select
                        value={deliveryInfo.city}
                        onChange={(e) =>
                          setDeliveryInfo({
                            ...deliveryInfo,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                      >
                        <option value="თბილისი">🏙️ თბილისი</option>
                        <option value="რუსთავი">🏭 რუსთავი</option>
                        <option value="ბათუმი">🏖️ ბათუმი</option>
                        <option value="ქუთაისი">🌿 ქუთაისი</option>
                        <option value="სხვა">📍 სხვა რეგიონი</option>
                      </select>
                      <textarea
                        placeholder="სრული მისამართი *"
                        required
                        value={deliveryInfo.address}
                        onChange={(e) =>
                          setDeliveryInfo({
                            ...deliveryInfo,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none h-24 resize-none bg-white placeholder:text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="დამატებითი კომენტარი..."
                        value={deliveryInfo.comment}
                        onChange={(e) =>
                          setDeliveryInfo({
                            ...deliveryInfo,
                            comment: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xl font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        შენახვა...
                      </>
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        შეკვეთის შენახვა
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateManualOrderModal;
