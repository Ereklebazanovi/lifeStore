import React from "react";
import {
  Leaf,
  ShoppingCart,
  Truck,
  Shield,
  ArrowRight,
  Facebook,
  Instagram,
} from "lucide-react";

const socialLinks = {
  facebook: 'https://www.facebook.com/lifestore.ge',
  instagram: 'https://www.instagram.com/lifestore.ge',
};

const HomePage: React.FC = () => {

  return (
    <div className="min-h-screen bg-stone-50">
      {/* HERO SECTION - Split Layout */}
      <section className="py-6 lg:py-8 !mt-7">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left Side - Content */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h1 className="text-3xl lg:text-5xl text-stone-900 tracking-tight">
                  <span className="text-emerald-400"> ეკო-მეგობრული </span>
                  ნივთები
                </h1>
                <p className="text-lg text-stone-600 max-w-lg">
                  აღმოაჩინე ბუნებრივი პროდუქტები, რომლებიც სიყვარულით არის
                  შექმნილი შენთვის და შენი სახლისთვის.
                </p>
              </div>

              <button className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 !p-2">
                <span>დაათვალიერე პროდუქტები</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right Side - Hero Image Placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 via-stone-100 to-emerald-50 rounded-3xl shadow-xl overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/30923807/pexels-photo-30923807.jpeg"
                  alt="Eco-friendly sustainable living"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-200/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-stone-200/40 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BANNER */}
      <section className="!py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-stone-900 tracking-tight mb-1">
                  🌿 ბუნებრივი მასალები{" "}
                </h3>
                <p className="text-sm text-stone-600">
                  100% ორგანული და მდგრადი წყაროებიდან.
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
      <section className="py-16 lg:py-14 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl lg:text-4xl text-stone-900 tracking-tight mb-2">
              პოპულარული პროდუქტები
            </h2>
            <p className="text-stone-600">
              დახვეწილი და ეკომეგობრული ნივთები შენი ყოველდღიურობისთვის.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { name: "Bamboo Bowl Set", price: 45 },
              { name: "Organic Cotton Tote", price: 28 },
              { name: "Recycled Glass Vase", price: 52 },
              { name: "Natural Fiber Rug", price: 89 },
            ].map((product, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Product Image Placeholder */}
                <div className="aspect-square bg-gradient-to-br from-stone-100 to-emerald-50 flex items-center justify-center">
                  <Leaf className="w-20 h-20 text-emerald-300 group-hover:scale-110 transition-transform duration-300" />
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-3">
                  <h3 className="text-stone-900 tracking-tight">
                    {product.name}
                  </h3>
                  <p className="text-sm text-stone-600">
                    Eco-friendly, handcrafted with love
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl text-emerald-700 tracking-tight">
                      ${product.price}
                    </span>
                    <button
                      className="w-10 h-10 bg-stone-900 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition-colors duration-200 group-hover:scale-110"
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER SECTION */}
   <section className="py-20 bg-gray-50 border-t border-gray-100">
  <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
    
    {/* სათაური და აღწერა */}
    <div className="mb-12">
      <div className="inline-flex items-center space-x-2 mb-4">
        <Leaf className="h-6 w-6 text-green-600" />
        <span className="text-xl font-bold text-green-700">იპოვე LifeStore</span>
      </div>

     
      <p className="text-gray-600 text-lg max-w-2xl mx-auto">
        გამოგვყვევით სოციალურ ქსელებში რჩევებისთვის, სიახლეებისა და ექსკლუზიური შეთავაზებებისთვის.
      </p>
    </div>

    {/* სოციალური მედიის ბმულები - თანამედროვე, სუფთა სტილი */}
    <div className="flex justify-center space-x-8">
      
      {/* Facebook ბმული */}
      {/* Facebook ბმული */}
      <a
        href={socialLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center transition-transform duration-300 hover:scale-105"
      >
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all duration-300 group-hover:bg-blue-700">
          {/* Lucide-ის ხატულები */}
          <Facebook className="h-7 w-7" /> 
        </div>
        <p className="mt-3 text-base font-semibold text-gray-700 transition-colors group-hover:text-blue-600">
            Facebook
        </p>
      </a>

      {/* Instagram ბმული */}
      <a
        href={socialLinks.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center transition-transform duration-300 hover:scale-105"
      >
        {/* Instagram-ის სტილი - გრადიენტით */}
        <div className="w-16 h-16 flex items-center justify-center rounded-full text-white shadow-xl transition-all duration-300"
             style={{ 
                 background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' 
             }}>
          {/* Lucide-ის ხატულები */}
          <Instagram className="h-7 w-7" /> 
        </div>
        <p className="mt-3 text-base font-semibold text-gray-700 transition-colors group-hover:text-pink-600">
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
