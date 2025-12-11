// // src/pages/CartPage.tsx
// import React from "react";
// import { Link } from "react-router-dom";
// import { ShoppingCart, ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
// import { useCartStore } from "../store/cartStore";

// const CartPage: React.FC = () => {
//   const { items, totalPrice, totalItems, updateQuantity, removeItem, clearCart } = useCartStore();

//   if (items.length === 0) {
//     return (
//       <div className="min-h-screen bg-stone-50">
//         <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
//           <h1 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-12">
//             თქვენი კალათა
//           </h1>

//           {/* Empty cart message */}
//           <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 lg:p-16 text-center">
//             <div className="mb-8">
//               <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
//                 <ShoppingCart className="w-12 h-12 lg:w-16 lg:h-16 text-stone-300" />
//               </div>
//             </div>

//             <h3 className="text-2xl text-stone-900 tracking-tight mb-3">
//               კალათა ცარიელია
//             </h3>
//             <p className="text-stone-600 mb-8 max-w-md mx-auto">
//               დაამატეთ პროდუქტები თქვენს კალათაში და დაიწყეთ ეკო-მეგობრული შოპინგი
//             </p>

//             <Link
//               to="/products"
//               className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
//             >
//               პროდუქტების ნახვა
//               <ArrowRight className="w-5 h-5" />
//             </Link>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-stone-50">
//       <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
//         {/* Header */}
//         <div className="mb-12">
//           <h1 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-4">
//             თქვენი კალათა
//           </h1>
//           <div className="flex items-center justify-between">
//             <p className="text-stone-600">
//               {totalItems} ნივთი შერჩეულია
//             </p>
//             <button
//               onClick={clearCart}
//               className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
//             >
//               კალათის გასუფთავება
//             </button>
//           </div>
//         </div>

//         <div className="grid lg:grid-cols-3 gap-8">
//           {/* Cart Items */}
//           <div className="lg:col-span-2 space-y-4">
//             {items.map((item) => (
//               <div
//                 key={item.productId}
//                 className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow"
//               >
//                 <div className="flex gap-6">
//                   {/* Product Image */}
//                   <div className="flex-shrink-0 w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-stone-100">
//                     {item.product.images && item.product.images.length > 0 ? (
//                       <img
//                         src={item.product.images[0]}
//                         alt={item.product.name}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <div className="w-full h-full flex items-center justify-center">
//                         <ShoppingCart className="w-8 h-8 text-stone-300" />
//                       </div>
//                     )}
//                   </div>

//                   {/* Product Info */}
//                   <div className="flex-1 min-w-0">
//                     <div className="flex justify-between items-start mb-3">
//                       <div>
//                         <h3 className="text-lg font-semibold text-stone-900 line-clamp-1">
//                           {item.product.name}
//                         </h3>
//                         <p className="text-sm text-stone-600 mt-1 line-clamp-2">
//                           {item.product.description || "ეკო-მეგობრული პროდუქტი"}
//                         </p>
//                         <p className="text-xs text-stone-500 mt-1">
//                           კატეგორია: {item.product.category}
//                         </p>
//                       </div>
//                       <button
//                         onClick={() => removeItem(item.productId)}
//                         className="text-red-500 hover:text-red-700 p-1"
//                         aria-label="Remove item"
//                       >
//                         <Trash2 className="w-5 h-5" />
//                       </button>
//                     </div>

//                     {/* Quantity and Price */}
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <span className="text-sm text-stone-600">რაოდენობა:</span>
//                         <div className="flex items-center border border-stone-200 rounded-lg">
//                           <button
//                             onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
//                             className="p-2 hover:bg-stone-50 transition-colors"
//                             disabled={item.quantity <= 1}
//                           >
//                             <Minus className="w-4 h-4" />
//                           </button>
//                           <span className="px-4 py-2 text-center min-w-[3rem]">
//                             {item.quantity}
//                           </span>
//                           <button
//                             onClick={() => updateQuantity(item.productId, item.quantity + 1)}
//                             className="p-2 hover:bg-stone-50 transition-colors"
//                           >
//                             <Plus className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>

//                       <div className="text-right">
//                         <div className="text-lg font-semibold text-emerald-700">
//                           ₾{(item.product.price * item.quantity).toFixed(2)}
//                         </div>
//                         <div className="text-sm text-stone-500">
//                           ₾{item.product.price.toFixed(2)} × {item.quantity}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Order Summary */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sticky top-24">
//               <h3 className="text-xl font-semibold text-stone-900 mb-6">
//                 შეკვეთის შეჯამება
//               </h3>

//               <div className="space-y-4 mb-6">
//                 <div className="flex justify-between">
//                   <span className="text-stone-600">პროდუქტები ({totalItems})</span>
//                   <span className="text-stone-900">₾{totalPrice.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-stone-600">მიწოდება</span>
//                   <span className="text-green-600">უფასო</span>
//                 </div>
//                 <div className="border-t pt-4">
//                   <div className="flex justify-between items-center">
//                     <span className="text-lg font-semibold text-stone-900">სულ</span>
//                     <span className="text-xl font-bold text-emerald-700">
//                       ₾{totalPrice.toFixed(2)}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Checkout Button */}
//               <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] mb-4">
//                 გადახდა
//               </button>

//               {/* Continue Shopping */}
//               <Link
//                 to="/products"
//                 className="block w-full text-center text-stone-600 hover:text-stone-900 py-3 transition-colors"
//               >
//                 ← შოპინგის გაგრძელება
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CartPage;

////ახალი
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "../store/cartStore";

const CartPage: React.FC = () => {
  const { items, totalPrice, totalItems, updateQuantity, removeItem, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <h1 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-12">
            თქვენი კალათა
          </h1>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 lg:p-16 text-center">
            <div className="mb-8">
              <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 lg:w-16 lg:h-16 text-stone-300" />
              </div>
            </div>

            <h3 className="text-2xl text-stone-900 tracking-tight mb-3">
              კალათა ცარიელია
            </h3>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">
              დაამატეთ პროდუქტები თქვენს კალათაში და დაიწყეთ ეკო-მეგობრული შოპინგი
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              პროდუქტების ნახვა
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-4">
            თქვენი კალათა
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-stone-600">
              {totalItems} ნივთი შერჩეულია
            </p>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
            >
              კალათის გასუფთავება
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-stone-100">
                    {item.product.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-900 line-clamp-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-stone-600 mt-1 line-clamp-2">
                          {item.product.description || "ეკო-მეგობრული პროდუქტი"}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          კატეგორია: {item.product.category}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-600">რაოდენობა:</span>
                        <div>
                            <div className="flex items-center border border-stone-200 rounded-lg">
                            <button
                                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                className="p-2 hover:bg-stone-50 transition-colors"
                                disabled={item.quantity <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 text-center min-w-[3rem]">
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                                className={`p-2 transition-colors ${
                                    item.quantity >= item.product.stock 
                                    ? "opacity-30 cursor-not-allowed text-gray-400" 
                                    : "hover:bg-stone-50"
                                }`}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            </div>
                            {item.quantity >= item.product.stock && (
                                <p className="text-xs text-red-500 mt-1 text-center">
                                    მაქს. მარაგი
                                </p>
                            )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold text-emerald-700">
                          ₾{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-sm text-stone-500">
                          ₾{item.product.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sticky top-24">
              <h3 className="text-xl font-semibold text-stone-900 mb-6">
                შეკვეთის შეჯამება
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-stone-600">პროდუქტები ({totalItems})</span>
                  <span className="text-stone-900">₾{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">მიწოდება</span>
                  <span className="text-green-600">უფასო</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-stone-900">სულ</span>
                    <span className="text-xl font-bold text-emerald-700">
                      ₾{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] mb-4">
                გადახდა
              </button>

              <Link
                to="/products"
                className="block w-full text-center text-stone-600 hover:text-stone-900 py-3 transition-colors"
              >
                ← შოპინგის გაგრძელება
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;