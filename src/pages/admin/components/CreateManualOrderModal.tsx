// src/components/admin/CreateManualOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  ShoppingBag, 
  User, 
  MapPin, 
  DollarSign,
  Globe
} from 'lucide-react';
import { OrderService } from '../../../services/orderService';
import { showToast } from '../../../components/ui/Toast';
import type { CreateManualOrderRequest, ManualOrderItem, OrderSource } from '../../../types';
// ✅ 1. იმპორტი
import PhoneInput from '../../../components/ui/PhoneInput';

interface CreateManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const CreateManualOrderModal: React.FC<CreateManualOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  onOrderCreated 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // --- Form State ---
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const [deliveryInfo, setDeliveryInfo] = useState({
    city: 'თბილისი',
    address: '',
    comment: ''
  });

  const [items, setItems] = useState<ManualOrderItem[]>([
    { name: '', price: 0, quantity: 1 }
  ]);

  const [source, setSource] = useState<OrderSource>('instagram');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'delivered'>('confirmed');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'other' | 'bank_transfer'>('cash');
  const [shippingCost, setShippingCost] = useState(0);

  // --- Calculations ---
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (isOpen) {
      setCustomerInfo({ firstName: '', lastName: '', phone: '', email: '' });
      setDeliveryInfo({ city: 'თბილისი', address: '', comment: '' });
      setItems([{ name: '', price: 0, quantity: 1 }]);
      setSource('instagram');
      setStatus('confirmed');
      setPaymentMethod('cash');
      setShippingCost(0);
    }
  }, [isOpen]);

  // --- Handlers ---
  const handleItemChange = (index: number, field: keyof ManualOrderItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'price' || field === 'quantity') {
      newItems[index] = { ...newItems[index], [field]: Number(value) };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { name: '', price: 0, quantity: 1 }]);
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
      showToast('შეავსეთ კლიენტის სახელი და ტელეფონი', 'error');
      return;
    }
    // დამატებითი შემოწმება ტელეფონის სიგრძეზე (9 ციფრი)
    if (customerInfo.phone.length !== 9) {
      showToast('ტელეფონის ნომერი არასწორია (საჭიროა 9 ციფრი)', 'error');
      return;
    }

    if (items.some(item => !item.name || item.price < 0)) {
      showToast('შეავსეთ პროდუქტის მონაცემები სწორად', 'error');
      return;
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
        paymentMethod: paymentMethod as any
      };

      await OrderService.createManualOrder(orderData);
      showToast('შეკვეთა წარმატებით შეიქმნა!', 'success');
      onOrderCreated();
      onClose();
    } catch (error) {
      console.error(error);
      showToast('შეკვეთის შექმნა ვერ მოხერხდა', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* --- Header (Fixed) --- */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Plus className="w-4 h-4 text-emerald-600" />
            </div>
            შეკვეთის დამატება
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* --- Scrollable Body --- */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <form id="create-order-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Quick Settings Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-100">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">წყარო</label>
                <div className="relative">
                  <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <select 
                    value={source}
                    onChange={(e) => setSource(e.target.value as OrderSource)}
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="phone">ტელეფონი</option>
                    <option value="personal">პირადი</option>
                    <option value="other">სხვა</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">სტატუსი</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="pending">მუშავდება</option>
                  <option value="confirmed">დადასტურებული</option>
                  <option value="delivered">მიტანილი</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">გადახდა</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="cash">ნაღდი / ადგილზე</option>
                  <option value="bank_transfer">ბანკი</option>
                  <option value="other">სხვა</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2. Customer Info */}
              <div>
                <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  კლიენტი
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="სახელი *"
                      required
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                      className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-400"
                    />
                    <input
                      type="text"
                      placeholder="გვარი"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                      className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-400"
                    />
                  </div>
                  
                  {/* ✅ Phone Input Component - შეცვლილია */}
                  <div className="phone-input-wrapper">
                    <PhoneInput
                        value={customerInfo.phone}
                        onChange={(val) => setCustomerInfo({...customerInfo, phone: val})}
                        required
                        className="py-1.5 text-sm !border-stone-200 !rounded-md" 
                        placeholder="555 12 34 56"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="ელ-ფოსტა (არასავალდებულო)"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* 3. Delivery Info */}
              <div>
                <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  მიწოდება
                </h3>
                <div className="space-y-3">
                  <select
                    value={deliveryInfo.city}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="თბილისი">თბილისი</option>
                    <option value="რუსთავი">რუსთავი</option>
                    <option value="ბათუმი">ბათუმი</option>
                    <option value="ქუთაისი">ქუთაისი</option>
                    <option value="სხვა">სხვა რეგიონი</option>
                  </select>
                  <textarea
                    placeholder="მისამართი *"
                    required
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none h-[74px] resize-none placeholder:text-stone-400"
                  />
                  <input
                    type="text"
                    placeholder="კომენტარი..."
                    value={deliveryInfo.comment}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, comment: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* 4. Product Items (Table) */}
            <div>
              <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                პროდუქტები
              </h3>
              
              <div className="border border-stone-200 rounded-lg overflow-hidden mb-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[400px]">
                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="px-3 py-2">დასახელება</th>
                        <th className="px-3 py-2 w-24">ფასი</th>
                        <th className="px-3 py-2 w-20">რაოდ.</th>
                        <th className="px-3 py-2 w-24 text-right">სულ</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="მაგ: წითელი ჩანთა"
                              required
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-stone-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-stone-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-stone-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-center"
                            />
                          </td>
                          <td className="p-2 text-right font-medium text-stone-700">
                            ₾{(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(index)}
                                className="p-1 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                  className="w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-t border-stone-200"
                >
                  <Plus className="w-3 h-3" />
                  დამატება
                </button>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-1/2 md:w-1/3 space-y-2 bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <div className="flex justify-between text-stone-600 text-sm">
                    <span>ქვე-ჯამი:</span>
                    <span className="font-medium">₾{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600 text-sm">
                    <span className="flex items-center gap-1">
                      მიწოდება <DollarSign className="w-3 h-3" />
                    </span>
                    <input 
                      type="number" 
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                      className="w-20 px-2 py-0.5 text-right text-sm border border-stone-200 rounded bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-200 pt-2">
                    <span>სულ:</span>
                    <span className="text-emerald-700">₾{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* --- Footer (Fixed) --- */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-100 bg-gray-50 rounded-b-xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
          >
            გაუქმება
          </button>
          <button
            type="submit"
            form="create-order-form"
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm shadow-emerald-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
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