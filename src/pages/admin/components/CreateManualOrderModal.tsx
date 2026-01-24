// src/components/admin/CreateManualOrderModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
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
import ProductSelector from "../../../components/admin/ProductSelector";
import { ProductSelection } from "../../../components/admin/ProductSelectModal";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { products, setIsCreatingOrder } = useProductStore();

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
    { name: "", price: 0, quantity: 1, weight: undefined },
  ]);
  const [source, setSource] = useState<OrderSource>("instagram");
  const [status, setStatus] = useState<
    "pending" | "confirmed" | "shipped" | "delivered"
  >("pending");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "other" | "bank_transfer"
  >("cash");
  const [shippingCost, setShippingCost] = useState(0);
  const [isShippingCostManuallySet, setIsShippingCostManuallySet] = useState(false);

  const calculateShippingCost = (city: string): number => {
    if (city === "თბილისი" || city === "რუსთავი") return 5;
    return 10;
  };

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
      setStatus("pending");
      setPaymentMethod("cash");
      setShippingCost(5);
      setIsShippingCostManuallySet(false);
    } else {
      // Reset isCreatingOrder when modal closes to avoid freezing
      setIsCreatingOrder(false);
    }

    // Cleanup: reset flag when component unmounts
    return () => {
      setIsCreatingOrder(false);
    };
  }, [isOpen, setIsCreatingOrder]);

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

  const handleProductSelect = (
    index: number,
    selection: ProductSelection,
    quantity?: number
  ) => {
    const newItems = [...items];
    const wasEmpty = !newItems[index].name; // Check if this was an empty row

    newItems[index] = {
      ...newItems[index],
      productId: selection.product?.id,
      variantId: selection.variantId, // 👈 ვამატებთ variant ID-ს
      name: selection.name,
      price: selection.price,
      quantity: quantity || newItems[index].quantity, // Use provided quantity or keep existing
      weight: selection.weight, // 👈 ვამატებთ წონის ინფორმაციას
    };
    setItems(newItems);

    // No automatic empty row addition - user will manually add if needed
  };

  const addItemRow = () => {
    setItems([...items, { name: "", price: 0, quantity: 1, weight: undefined }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting || isLoading) {
      console.warn("⚠️ Form submission already in progress");
      return;
    }

    console.log("🔴 CreateManualOrderModal.handleSubmit called!", {
      itemsCount: items.length,
      items: items.map(i => ({ name: i.name, qty: i.quantity })),
      timestamp: new Date().toISOString()
    });

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
    if (items.some((item) => item.name && item.price <= 0)) {
      showToast("შეავსეთ პროდუქტის მონაცემები სწორად", "error");
      return;
    }
    if (items.filter((item) => item.name).length === 0) {
      showToast("დაამატეთ მინიმუმ ერთი პროდუქტი", "error");
      return;
    }
    // ✅ Simplified Stock Validation - Trust ProductSelector's real-time validation
    for (const item of items) {
      if (item.productId && !item.productId.startsWith("manual_")) {
        const currentProduct = products.find((p) => p.id === item.productId);
        if (!currentProduct) {
          showToast(`პროდუქტი არ მოიძებნა: "${item.name}"`, "error");
          return;
        }

        // Basic stock check - ProductSelector handles detailed validation
        let availableStock = 0;
        if (item.variantId && currentProduct.hasVariants) {
          const variant = currentProduct.variants?.find(v => v.id === item.variantId);
          availableStock = variant?.stock || 0;
        } else {
          availableStock = currentProduct.stock || 0;
        }

        if (availableStock < item.quantity) {
          showToast(`არასაკმარისი მარაგი: "${item.name}"`, "error");
          return;
        }
      }
    }
    try {
      setIsSubmitting(true);
      setIsLoading(true);
      setIsCreatingOrder(true);

      const orderData: CreateManualOrderRequest = {
        source,
        items,
        customerInfo,
        deliveryInfo,
        shippingCost,
        status,
        paymentMethod: paymentMethod as any,
      };

      const timeoutId = setTimeout(() => {
        console.warn("⚠️ Order creation timeout - resetting isCreatingOrder flag");
        setIsCreatingOrder(false);
        setIsSubmitting(false);
      }, 15000); // 15 second timeout

      await OrderService.createManualOrder(orderData);
      clearTimeout(timeoutId);

      showToast("შეკვეთა წარმატებით შეიქმნა!", "success");
      onOrderCreated();
      onClose();
    } catch (error) {
      console.error(error);
      showToast("შეკვეთის შექმნა ვერ მოხერხდა", "error");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
      setIsCreatingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* ✅ გავზარდეთ მოდალის სიგანე max-w-4xl-ზე უფრო ფართო და კომფორტული განლაგებისთვის */}
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* --- Header (Fixed) --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            შეკვეთის დამატება
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-stone-500" />
          </button>
        </div>
        {/* --- Scrollable Body --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div
            className="space-y-8"
          >
            {/* 1. Quick Settings Row - ✅ გავზარდეთ სივრცეები და ფონტები კომფორტისთვის */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-lg border border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  წყარო
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as OrderSource)}
                    className="w-full pl-10 pr-3 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="personal">პირადი</option>
                    <option value="other">სხვა</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  სტატუსი
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="pending">📋 მოლოდინში</option>
                  <option value="confirmed">💳 გადახდილი</option>
                  <option value="shipped">📦 გაგზავნილი</option>
                  <option value="delivered">🎉 მიტანილი</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  გადახდა
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="cash">ნაღდი / ადგილზე</option>
                  <option value="bank_transfer">ბანკი</option>
                  <option value="other">სხვა</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 2. Customer Info - ✅ გავზარდეთ ინპუტები და სივრცეები */}
              <div>
                <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  კლიენტი
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      className="w-full px-4 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-400"
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
                      className="w-full px-4 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-400"
                    />
                  </div>
                  {/* ✅ Phone Input Component - შეცვლილია */}
                  <div className="phone-input-wrapper">
                    <PhoneInput
                      value={customerInfo.phone}
                      onChange={(val) =>
                        setCustomerInfo({ ...customerInfo, phone: val })
                      }
                      required
                      className="py-2 text-base !border-stone-200 !rounded-md"
                      placeholder="555 12 34 56"
                    />
                  </div>
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs">ℹ</span>
                    </div>
                    <span className="text-blue-700 text-sm">
                      შეყვანილ კლიენტის ელფოსტაზე გაიგზავნება შეკვეთის
                      დამადასტურებელი შეტყობინება
                    </span>
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
                    className="w-full px-4 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>
              {/* 3. Delivery Info - ✅ გავზარდეთ ინპუტები და სივრცეები */}
              <div>
                <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  მიწოდება
                </h3>
                <div className="space-y-4">
                  <select
                    value={deliveryInfo.city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setDeliveryInfo({ ...deliveryInfo, city: newCity });
                      if (!isShippingCostManuallySet) {
                        setShippingCost(calculateShippingCost(newCity));
                      }
                    }}
                    className="w-full px-4 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="თბილისი">თბილისი (5 ₾)</option>
                    <option value="რუსთავი">რუსთავი (5 ₾)</option>
                    <option value="ბათუმი">ბათუმი (10 ₾)</option>
                    <option value="ქუთაისი">ქუთაისი (10 ₾)</option>
                    <option value="სხვა">სხვა რეგიონი (10 ₾)</option>
                  </select>
                  <textarea
                    placeholder="მისამართი *"
                    required
                    value={deliveryInfo.address}
                    onChange={(e) =>
                      setDeliveryInfo({
                        ...deliveryInfo,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none placeholder:text-stone-400"
                  />
                  <input
                    type="text"
                    placeholder="კომენტარი..."
                    value={deliveryInfo.comment}
                    onChange={(e) =>
                      setDeliveryInfo({
                        ...deliveryInfo,
                        comment: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 text-base border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>
            {/* 4. Product Items (Table) - ✅ გავზარდეთ სვეტების სიგანეები, პედინგები და ფონტები უფრო კომფორტული და მარტივი გამოყენებისთვის. ასევე გავზარდეთ მინიმალური სიგანე min-w-[600px]-ზე */}
            <div>
              <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                პროდუქტები
              </h3>
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 text-xs">✓</span>
                </div>
                <span className="text-emerald-700 text-sm font-medium">
                  შესაძლებელია იმ პროდუქტების არჩევა რომელიც საწყობშია
                </span>
              </div>
              <div className="border border-stone-200 rounded-lg overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-base text-left min-w-[600px]">
                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-xs border-b border-stone-200">
                      <tr>
                        <th className="px-4 py-3">დასახელება</th>
                        <th className="px-4 py-3 w-32">ფასი</th>
                        <th className="px-4 py-3 w-24">რაოდ.</th>
                        <th className="px-4 py-3 w-32 text-right">სულ</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-3">
                            <div>
                              <ProductSelector
                                value={item.name}
                                onChange={(value) =>
                                  handleItemChange(index, "name", value)
                                }
                                onProductSelect={(selection, quantity) =>
                                  handleProductSelect(index, selection, quantity)
                                }
                                placeholder="მაგ: ლანჩბოქსი"
                                className="px-3 py-2 text-base !border-stone-200 !rounded focus:!ring-2 focus:!ring-emerald-500 !outline-none"
                                requestedQuantity={item.quantity}
                                selectedItems={items}
                                currentItemIndex={index}
                              />
                              {/* Weight Information */}
                              {item.productId && (() => {
                                const currentProduct = products.find(
                                  (p) => p.id === item.productId
                                );
                                if (!currentProduct) return null;

                                let weight: number | undefined;
                                if (
                                  item.variantId &&
                                  currentProduct.hasVariants
                                ) {
                                  const variant =
                                    currentProduct.variants?.find(
                                      (v) => v.id === item.variantId
                                    );
                                  weight = variant?.weight;
                                } else {
                                  weight = currentProduct.weight;
                                }

                                if (weight) {
                                  return (
                                    <span className="ml-2 text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-200">
                                      ⚖️ {weight}გრ
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={item.price}
                              onChange={(e) =>
                                handleItemChange(index, "price", e.target.value)
                              }
                              className="w-full px-3 py-2 text-base border border-stone-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 text-base border border-stone-200 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                            />
                          </td>
                          <td className="p-3 text-right font-medium text-stone-700">
                            ₾{(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(index)}
                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="w-full py-3 bg-stone-50 hover:bg-stone-100 text-stone-600 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-t border-stone-200"
                >
                  <Plus className="w-4 h-4" />
                  კიდევ ერთი პროდუქტის დამატება
                </button>
              </div>
              {/* Totals - ✅ გავხადეთ უფრო ფართო და კომფორტული */}
              <div className="flex justify-end">
                <div className="w-full sm:w-2/3 md:w-1/2 space-y-3 bg-stone-50 p-4 rounded-lg border border-stone-100">
                  <div className="flex justify-between text-stone-600 text-base">
                    <span>ჯამი:</span>
                    <span className="font-medium">₾{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600 text-base">
                    <span className="flex items-center gap-2">
                      მიტანის თანხა ₾
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => {
                        setShippingCost(Number(e.target.value));
                        setIsShippingCostManuallySet(true);
                      }}
                      className="w-24 px-3 py-1 text-right text-base border border-stone-200 rounded bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold text-stone-900 border-t border-stone-200 pt-3">
                    <span>სულ:</span>
                    <span className="text-emerald-700">
                      ₾{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* --- Footer (Fixed) - ✅ გავზარდეთ ღილაკები */}
        <div className="flex items-center justify-end gap-4 p-5 border-t border-stone-100 bg-gray-50 rounded-b-xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-base font-medium text-stone-600 hover:text-stone-800 transition-colors"
          >
            გაუქმება
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-7 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-base font-medium shadow-sm shadow-emerald-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                შენახვა
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateManualOrderModal;
