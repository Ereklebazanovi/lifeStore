import React, { useEffect } from "react";
import {
  Leaf,
  ShoppingCart,
  Truck,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Facebook, Instagram } from "lucide-react";
import { useProductStore } from "../store/productStore";
import { useCartStore } from "../store/cartStore";
import { showToast } from "../components/ui/Toast";

const HomePage: React.FC = () => {
  const { products, fetchProducts, isLoading } = useProductStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product: any) => {
    addItem(product);
    showToast(`${product.name} კალათაში დაემატა!`, 'success');
  };


  return (
    <div className="min-h-screen bg-stone-50">
      {/* HERO SECTION - Split Layout */}
      <section className="py-6 lg:py-8 mt-4 lg:mt-7 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center !mt-7">
            {/* Left Side - Content */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h1 className="text-3xl lg:text-5xl text-stone-900 tracking-tight">
                  <span className="text-emerald-400"> ეკო-მეგობრული </span>
                  ნივთები
                </h1>
                <p className="text-base lg:text-lg text-stone-600 max-w-lg">
                  აღმოაჩინე ბუნებრივი პროდუქტები, რომლებიც სიყვარულით არის
                  შექმნილი შენთვის და შენი სახლისთვის.
                </p>
              </div>

              <button className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 lg:px-8 lg:py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                <span>დაათვალიერე პროდუქტები</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right Side - Hero Image Placeholder */}
            <div className="relative overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 via-stone-100 to-emerald-50 rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/30923807/pexels-photo-30923807.jpeg"
                  alt="Eco-friendly sustainable living"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative elements - hidden on mobile */}
              <div className="hidden lg:block absolute -top-4 -right-4 w-16 h-16 bg-emerald-200/30 rounded-full blur-2xl" />
              <div className="hidden lg:block absolute -bottom-4 -left-4 w-20 h-20 bg-stone-200/40 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BANNER */}
      <section className="py-8 lg:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 !mt-4">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-12">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-stone-900 tracking-tight mb-1">
                  🌿 ბუნებრივი მასალები
                </h3>
                <p className="text-sm text-stone-600">
                  100% ორგანული და მდგრადი წყაროებიდან
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-stone-900 tracking-tight mb-1">
                  🚚 სწრაფი მიტანა
                </h3>
                <p className="text-sm text-stone-600">
                  სრულიად უსაფრთხო მიწოდების სერვისი საქართველოში.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-stone-900 tracking-tight mb-1">
                  🔒 უსაფრთხო გადახდა
                </h3>
                <p className="text-sm text-stone-600">
                  თქვენი მონაცემები და ტრანზაქციები ყოველთვის დაცულია.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS GRID */}
      <section className="py-12 lg:py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-4xl text-stone-900 tracking-tight mb-2">
              პოპულარული პროდუქტები
            </h2>
            <p className="text-sm lg:text-base text-stone-600">
              დახვეწილი და ეკომეგობრული ნივთები შენი ყოველდღიურობისთვის.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl lg:rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="p-3 lg:p-5 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="w-20 h-20 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl text-stone-900 mb-2">ჯერ პროდუქტები არ არის დამატებული</h3>
              <p className="text-stone-600">ადმინმა ჯერ პროდუქტები უნდა დაამატოს</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
              {products.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl lg:rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-stone-100 to-emerald-50 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-16 h-16 lg:w-20 lg:h-20 text-emerald-300 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 lg:p-5 space-y-2 lg:space-y-3">
                    <h3 className="text-sm lg:text-base text-stone-900 tracking-tight line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs lg:text-sm text-stone-600 line-clamp-2">
                      {product.description || "ეკო-მეგობრული პროდუქტი"}
                    </p>

                    <div className="flex items-center justify-between pt-1 lg:pt-2">
                      <span className="text-lg lg:text-xl text-emerald-700 tracking-tight">
                        ₾{product.price}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-9 h-9 lg:w-10 lg:h-10 bg-stone-900 hover:bg-emerald-600 text-white rounded-lg lg:rounded-xl flex items-center justify-center transition-colors duration-200 group-hover:scale-110"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="py-12 lg:py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* სათაური და აღწერა */}
          <div className="mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Leaf className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />
              <span className="text-lg lg:text-xl text-emerald-700 tracking-tight">
                იპოვე LifeStore
              </span>
            </div>

            <p className="text-sm lg:text-lg text-stone-600 max-w-2xl mx-auto">
              გამოგვყვევით სოციალურ ქსელებში რჩევებისთვის, სიახლეებისა და
              ექსკლუზიური შეთავაზებებისთვის.
            </p>
          </div>

          {/* სოციალური მედიის ბმულები - თანამედროვე, სუფთა სტილი */}
          <div className="flex justify-center gap-6 lg:gap-8">
            {/* Facebook ბმული */}
            <a
              href="https://www.facebook.com/lifestore.ge"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center transition-transform duration-300 hover:scale-105"
            >
              <div className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all duration-300 group-hover:bg-blue-700">
                <Facebook className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <p className="mt-2 lg:mt-3 text-sm lg:text-base text-stone-700 transition-colors group-hover:text-blue-600">
                Facebook
              </p>
            </a>

            {/* Instagram ბმული */}
            <a
              href="https://www.instagram.com/lifestore.ge"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center transition-transform duration-300 hover:scale-105"
            >
              <div
                className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full text-white shadow-xl transition-all duration-300"
                style={{
                  background:
                    "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
                }}
              >
                <Instagram className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <p className="mt-2 lg:mt-3 text-sm lg:text-base text-stone-700 transition-colors group-hover:text-pink-600">
                Instagram
              </p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
