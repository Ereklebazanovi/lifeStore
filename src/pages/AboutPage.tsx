import React from "react";
import { storefrontPath } from "../utils/storefrontPaths";
import { Link } from "react-router-dom";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

const AboutPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <article className="bg-stone-50 pb-12">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="store-page min-h-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div className="order-2 lg:order-1 overflow-hidden rounded-xl bg-stone-100 aspect-[4/3]">
              <img src="/about-1.jpg" alt={t("about.imageAlt", { index: 1 })} className="w-full h-full object-cover" />
            </div>

            {/* Text */}
            <div className="space-y-7 order-1 lg:order-2">
              <h1 className="store-display text-4xl lg:text-5xl">{t("nav.about")}</h1>
              <p className="text-stone-600 text-lg leading-relaxed">{t("storefront.heroCopy")}</p>

              <Link
                to={storefrontPath("/products", i18n.language)}
                className="store-button"
              >
                {t("about.viewCollection")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section className="py-14 bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="store-display text-2xl sm:text-3xl mb-5">
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
          <h3 className="store-display text-2xl sm:text-3xl mb-5">
            {t("about.ctaTitle")}
          </h3>
          <p className="text-stone-600 text-lg leading-relaxed mb-8">
            <Trans
              i18nKey="about.ctaText"
              components={{ bold: <strong /> }}
            />
          </p>
          <Link
            to={storefrontPath("/products", i18n.language)}
            className="store-button"
          >
            {t("about.viewProducts")}
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
