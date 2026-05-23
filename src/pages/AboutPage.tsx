import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Leaf, ShieldCheck, Sparkles, ArrowRight, Quote } from "lucide-react";

const CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1000&auto=format&fit=crop",
];

const AboutPage: React.FC = () => {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setImgIdx((i) => (i + 1) % CAROUSEL_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <article className="min-h-screen bg-white pb-20">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Carousel */}
            <div className="relative lg:pl-4 lg:pt-4 order-2 lg:order-1">
              <div className="absolute top-0 left-0 w-full h-full bg-emerald-50 rounded-3xl -z-10 transform lg:-translate-x-4 lg:-translate-y-4" />
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-stone-100 relative">
                {CAROUSEL_IMAGES.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Life Store ეკომეგობრული ნივთები ${i + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                      i === imgIdx ? "opacity-100 scale-105" : "opacity-0 scale-100"
                    }`}
                  />
                ))}
              </div>
              <div className="absolute -bottom-6 -right-4 md:-right-8 bg-white p-6 rounded-xl shadow-xl border border-stone-100 max-w-xs hidden md:block z-20">
                <Quote className="w-8 h-8 text-emerald-200 mb-2" />
                <p className="text-stone-600 text-sm font-medium italic">
                  "ჩვენ გვჯერა, რომ ჯანსაღი გარემო იწყება სახლიდან."
                </p>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-7 order-1 lg:order-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                გაიცანით <strong className="text-emerald-700">Life Store</strong> —{" "}
                ეკომეგობრული ცხოვრების სტილი თქვენი ყოველდღიურობისთვის
              </h1>

              <p className="text-stone-600 text-lg leading-relaxed">
                დღევანდელ სწრაფად განვითარებად სამყაროში, სადაც პლასტმასის მოხმარებამ
                კრიტიკულ ზღვარს მიაღწია, ჯანმრთელობაზე და გარემოზე ზრუნვა თითოეული
                ჩვენგანის პასუხისმგებლობაა. <strong>Life Store</strong> შეიქმნა ზუსტად
                იმისთვის, რომ შემოგთავაზოთ პლასტმასის ჭურჭლისა და საყოფაცხოვრებო
                ნივთების <strong>უსაფრთხო, გრძელვადიანი და ესთეტიკური ალტერნატივები</strong>.
                ჩვენი მიზანია, ეკომეგობრული ცხოვრების წესი ყველასთვის ხელმისაწვდომი
                და კომფორტული გავხადოთ.
              </p>

              <Link
                to="/products"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg"
              >
                კოლექციის ნახვა
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section className="py-14 bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-5">
            ჩვენი მისია: ნაკლები პლასტმასი, მეტი ჯანმრთელობა
          </h2>
          <p className="text-stone-600 text-lg leading-relaxed">
            ჩვენ არ ვყიდით უბრალოდ ნივთებს — ჩვენ ვქმნით გარემოს, სადაც{" "}
            <strong>თქვენ და თქვენი ოჯახის წევრები დაცულები ხართ</strong> ტოქსიკური
            ნივთიერებებისგან. ყოველი ნაბიჯი, რომელსაც ეკომეგობრული
            ალტერნატივებისკენ დგამთ, არის ინვესტიცია ჯანსაღ მომავალში.
          </p>
        </div>
      </section>

      {/* ── Trust / 3 cards ──────────────────────────────────── */}
      <section className="py-16 bg-stone-50 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
              რატომ უნდა ენდოთ Life Store-ის ხარისხს?
            </h2>
            <p className="text-stone-500 max-w-2xl mx-auto">
              ინტერნეტში უამრავი შემოთავაზებაა, თუმცა ჩვენთვის ხარისხი და
              უსაფრთხოება უპირველესია. თითოეული პროდუქტი გადის მკაცრ შერჩევას.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title="პრემიუმ მასალები"
              desc="ჩვენი ლანჩბოქსები და კონტეინერები დამზადებულია უმაღლესი სტანდარტის SUS 304 უჟანგავი ფოლადისა და ნაწრთობი მინისგან, რომლებიც არ შეიცავენ მავნე BPA-ს."
            />
            <ValueCard
              icon={<Leaf className="w-6 h-6" />}
              title="ბუნებრივი ესთეტიკა"
              desc="სათავსოები და აქსესუარები დამზადებულია 100%-ით ნატურალური, განახლებადი ბამბუკისგან, რომელიც სააბაზანოსა თუ სამზარეულოს გამორჩეულ სიმყუდროვეს სძენს."
            />
            <ValueCard
              icon={<Sparkles className="w-6 h-6" />}
              title="ერგონომიულობა და სტილი"
              desc="ყოველი ნივთი შერჩეულია ისე, რომ იყოს მაქსიმალურად პრაქტიკული ოფისში, სკოლაში თუ მოგზაურობისას სატარებლად."
            />
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-5">
            მდგრადი მომავალი იწყება დღეს
          </h3>
          <p className="text-stone-600 text-lg leading-relaxed mb-8">
            ჩვენ გვჯერა, რომ დიდი ცვლილებები{" "}
            <strong>პატარა, ყოველდღიური არჩევანით</strong> იწყება. Life Store
            თქვენი საიმედო პარტნიორია ამ გზაზე. შემოუერთდით ჩვენს ეკომეგობრულ
            ოჯახს და შეცვალეთ თქვენი ყოველდღიურობა უკეთესობისკენ.
          </p>
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-emerald-200"
          >
            პროდუქტების ნახვა
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

    </article>
  );
};

const ValueCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group">
    <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 group-hover:bg-emerald-50 transition-all">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
    <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default AboutPage;
