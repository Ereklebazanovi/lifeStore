// CartPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight, Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCartStore } from "../store/cartStore";

const CartPage: React.FC = () => {
  const { items, totalPrice, totalItems, updateQuantity, removeItem, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-stone-400" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">კალათა ცარიელია</h1>
          <p className="text-stone-500">
            დაამატეთ პროდუქტები თქვენს კალათაში და დაიწყეთ ეკო-მეგობრული შოპინგი.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-200 hover:-translate-y-1"
          >
            პროდუქტების ნახვა
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
             <h1 className="text-2xl lg:text-3xl font-bold text-stone-900">თქვენი კალათა</h1>
             <p className="text-stone-500 text-sm mt-1">{totalItems} ნივთი შერჩეულია</p>
          </div>
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            გასუფთავება
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* --- Cart Items List (Left Side) --- */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Flex Container: Mobile = Column, Tablet+ = Row */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  
                  {/* Image */}
                  <div className="w-full sm:w-32 h-40 sm:h-32 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.product.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    
                    {/* Title & Delete Row */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                         <h3 className="text-lg font-bold text-stone-900 line-clamp-1">{item.product.name}</h3>
                         <p className="text-xs text-stone-500 line-clamp-1">{item.product.category}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Price & Quantity Controls Row */}
                    <div className="flex flex-wrap items-end justify-between gap-4 mt-auto">
                      
                      {/* Quantity Selector */}
                      <div className="flex flex-col gap-1">
                          <span className="text-xs text-stone-500 font-medium ml-1">რაოდენობა</span>
                          <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg h-10">
                            <button
                                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                className="w-10 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-stone-900 text-sm">
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                                className="w-10 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                          </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-lg sm:text-xl font-bold text-emerald-700">
                          ₾{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                        {item.quantity > 1 && (
                            <div className="text-xs text-stone-400 font-medium">
                            ₾{item.product.price} / ცალი
                            </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- Order Summary (Right Side) --- */}
          <div className="lg:col-span-4 mt-6 lg:mt-0">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4">
                შეკვეთის დეტალები
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-stone-600 text-sm">
                  <span>პროდუქტები ({totalItems})</span>
                  <span className="font-medium text-stone-900">₾{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-sm">
                  <span>მიწოდება</span>
                  <span className="font-medium text-emerald-600">უფასო</span>
                </div>
                <div className="border-t border-dashed border-stone-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-stone-900">სულ გადასახდელი</span>
                    <span className="text-2xl font-bold text-emerald-700">
                      ₾{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link 
                to="/checkout" // შეცვლილია /checkout-ზე
                className="w-full bg-stone-900 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                შეკვეთის გაფორმება
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/products"
                className="flex items-center justify-center gap-2 w-full text-center text-stone-500 hover:text-stone-900 py-4 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                შოპინგის გაგრძელება
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;