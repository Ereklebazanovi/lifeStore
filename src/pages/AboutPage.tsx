import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  ShieldCheck,
  Sparkles,
  Globe2,
  ArrowRight,
  Heart,
  Quote,
} from "lucide-react";
import SEOHead from "../components/SEOHead";

const carouselImages = [
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1000&auto=format&fit=crop",
];

const AboutPage: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const aboutStructuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    mainEntity: {
      "@type": "Organization",
      name: "Life Store",
      description:
        "კომპანია, რომელიც ახორციელებს ეკომეგობრული და თანამედროვე დიზაინის მორგებული მაღალი ხარისხის სახლის და სამზარეულოს ნივთების იმპორტს",
      slogan: "ჰარმონია დეტალებშია",
    },
  };

  return (
    <>
      <SEOHead
        title="ჩვენ შესახებ | Life Store - ჰარმონია დეტალებშია"
        description="გაიცანი Life Store-ის მისია - ეკომეგობრული და ჯანმრთელობისთვის უვნებელი სახლის ნივთების იმპორტი. ჰარმონია დეტალებშია - აქციე შენი სახლი კომფორტულ და დახვეწილ სივრცედ."
        keywords="Life Store, ჩვენ შესახებ, მისია, ეკომეგობრული ნივთები, სახლის ნივთები, ჯანსაღი ცხოვრება, იმპორტი"
        canonicalUrl="https://lifestore.ge/about"
        structuredData={aboutStructuredData}
      />
      <div className="min-h-screen bg-white pb-20">
        {/* --- MAIN STORY SECTION --- */}
        <section className="py-20 lg:py-22">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Image Side with Layered Effect & Carousel */}
              {/* შესწორება: pl-4 და pt-4 შეიცვალა lg:pl-4 და lg:pt-4-ით */}
              <div className="relative lg:pl-4 lg:pt-4">
                {/* Background Decor */}
                {/* შესწორება: ტრანსფორმაციებს დაემატა lg: პრეფიქსი */}
                <div className="absolute top-0 left-0 w-full h-full bg-emerald-50 rounded-3xl -z-10 transform lg:-translate-x-4 lg:-translate-y-4"></div>
                
                {/* Carousel Container */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-stone-100 relative">
                  {carouselImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Life Store Interior ${index + 1}`}
                      className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        index === currentImageIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                      }`}
                    />
                  ))}
                </div>

                {/* Quote Badge */}
                <div className="absolute -bottom-6 -right-4 md:-right-8 bg-white p-6 rounded-xl shadow-xl border border-stone-100 max-w-xs hidden md:block z-20">
                  <Quote className="w-8 h-8 text-emerald-200 mb-2" />
                  <p className="text-stone-600 text-sm font-medium italic">
                    "ჩვენ გვჯერა, რომ ჯანსაღი გარემო იწყება სახლიდან."
                  </p>
                </div>
              </div>

              {/* Text Side */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                    ვინ ვართ ჩვენ?
                    <div className="h-px flex-1 bg-stone-200 ml-4"></div>
                  </h2>
                </div>

                <div className="prose prose-lg text-stone-600 space-y-4">
                  <p>
                    LifeStore არის იმპორტიორი კომპანია, რომელიც ქართულ ბაზარზე
                    წარმოადგენს თანამედროვე, დახვეწილ და რაც მთავარია — უსაფრთხო
                    პროდუქციას.
                  </p>
                  <div className="pl-4 border-l-4 border-emerald-500 py-2 bg-stone-50 pr-4 rounded-r-lg">
                    <p className="font-medium text-stone-800 m-0">
                      ჩვენი მთავარი ნიშა ეკომეგობრული და მაღალი ხარისხის სახლისა
                      და სამზარეულოს ნივთებია.
                    </p>
                  </div>
                  <p>
                    ჩვენ გვჯერა, რომ ნივთები, რომლებიც ყოველდღიურად გვეხება,
                    უნდა იყოს არა მხოლოდ ლამაზი, არამედ სრულიად უვნებელი
                    ჯანმრთელობისთვის. ჩვენი გუნდი მუდმივად ეძებს პროდუქციას,
                    რომელიც აკმაყოფილებს თანამედროვე დიზაინის უმაღლეს
                    სტანდარტებს.
                  </p>
                </div>

                <div className="pt-2">
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
          </div>
        </section>

        {/* --- VALUES GRID (Simple & Clean) --- */}
        <section className="py-16 bg-stone-50 border-y border-stone-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3">
                ჩვენი ღირებულებები
              </h2>
              <p className="text-stone-500">
                ხარისხი და პასუხისმგებლობა უპირველესია
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ValueCard
                icon={<Leaf className="w-6 h-6" />}
                title="ეკო-მეგობრული"
                desc="ბუნებრივი და გადამუშავებადი მასალები გარემოს დასაცავად."
              />
              <ValueCard
                icon={<ShieldCheck className="w-6 h-6" />}
                title="უსაფრთხო"
                desc="ჯანმრთელობისთვის უვნებელი, ტოქსინებისგან თავისუფალი ნივთები."
              />
              <ValueCard
                icon={<Sparkles className="w-6 h-6" />}
                title="თანამედროვე"
                desc="დახვეწილი დიზაინი, რომელიც ნებისმიერ ინტერიერს დაამშვენებს."
              />
              <ValueCard
                icon={<Globe2 className="w-6 h-6" />}
                title="გლობალური"
                desc="საუკეთესო იმპორტირებული პროდუქცია პირდაპირ თქვენი ოჯახისთვის."
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

const ValueCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow hover:border-emerald-100 group">
    <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 group-hover:bg-emerald-50 transition-all">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
    <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default AboutPage;