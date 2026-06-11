import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Leaf, ShieldCheck, Sparkles, ArrowRight, Quote } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

const CAROUSEL_IMAGES = [
  "/about-1.jpg",
  "/about-2.jpg",
  "/about-3.jpg",
];

const AboutPage: React.FC = () => {
  const [imgIdx, setImgIdx] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => setImgIdx((i) => (i + 1) % CAROUSEL_IMAGES.length), 5000);
    return () => clearInterval(timer);
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
                    alt={t("about.imageAlt", { index: i + 1 })}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                      i === imgIdx ? "opacity-100 scale-105" : "opacity-0 scale-100"
                    }`}
                  />
                ))}
              </div>
              <div className="absolute -bottom-6 -right-4 md:-right-8 bg-white p-6 rounded-xl shadow-xl border border-stone-100 max-w-xs hidden md:block z-20">
                <Quote className="w-8 h-8 text-emerald-200 mb-2" />
                <p className="text-stone-600 text-sm font-medium italic">
                  "{t("about.heroQuote")}"
                </p>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-7 order-1 lg:order-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                <Trans
                  i18nKey="about.heroTitle"
                  components={{ brand: <strong className="text-emerald-700" /> }}
                />
              </h1>

              <p className="text-stone-600 text-lg leading-relaxed">
                <Trans
                  i18nKey="about.heroText"
                  components={{ bold: <strong /> }}
                />
              </p>

              <Link
                to="/products"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg"
              >
                {t("about.viewCollection")}
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
            {t("about.missionTitle")}
          </h2>
          <p className="text-stone-600 text-lg leading-relaxed">
            {t("about.missionText")}
          </p>
        </div>
      </section>

      {/* ── Trust / 3 cards ──────────────────────────────────── */}
      <section className="py-16 bg-stone-50 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
              {t("about.trustTitle")}
            </h2>
            <p className="text-stone-500 max-w-2xl mx-auto">
              {t("about.trustSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title={t("about.card1Title")}
              desc={t("about.card1Desc")}
            />
            <ValueCard
              icon={<Leaf className="w-6 h-6" />}
              title={t("about.card2Title")}
              desc={t("about.card2Desc")}
            />
            <ValueCard
              icon={<Sparkles className="w-6 h-6" />}
              title={t("about.card3Title")}
              desc={t("about.card3Desc")}
            />
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-5">
            {t("about.ctaTitle")}
          </h3>
          <p className="text-stone-600 text-lg leading-relaxed mb-8">
            <Trans
              i18nKey="about.ctaText"
              components={{ bold: <strong /> }}
            />
          </p>
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-emerald-200"
          >
            {t("about.viewProducts")}
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
