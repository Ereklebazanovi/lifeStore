//RefundPolicy.tsx
import {
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ADMIN_CONFIG, SITE_CONFIG } from "../config/constants";

const RefundPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            {t("refundPolicy.pageTitle")}
          </h1>
          <p className="text-stone-500 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {t("refundPolicy.lastUpdated")}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          {/* Introduction Banner */}
          <div className="bg-emerald-50 p-6 md:p-8 border-b border-emerald-100">
            <div className="flex gap-4 items-start">
              <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-600 hidden md:block">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">
                  {t("refundPolicy.bannerTitle")}
                </h2>
                <p className="text-stone-600 leading-relaxed">
                  {t("refundPolicy.bannerText", { siteName: SITE_CONFIG.SITE_NAME })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-10">
            {/* Section 1: General Policy */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                {t("refundPolicy.s1Title")}
              </h3>
              <div className="prose prose-stone text-stone-600 leading-relaxed">
                <p>
                  {t("refundPolicy.s1Intro1")}{" "}
                  <strong>{t("refundPolicy.s1Intro2")}</strong>{" "}
                  {t("refundPolicy.s1Intro3")}
                </p>
                <ul className="mt-4 space-y-2 list-none pl-0">
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{t("refundPolicy.condition1")}</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{t("refundPolicy.condition2")}</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{t("refundPolicy.condition3")}</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2: Exceptions */}
            <section className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                {t("refundPolicy.exceptionsTitle")}
              </h3>
              <p className="text-stone-600 mb-4">
                {t("refundPolicy.exceptionsIntroA")}{" "}
                <span className="font-bold text-stone-800">
                  {t("refundPolicy.exceptionsIntroB")}
                </span>{" "}
                {t("refundPolicy.exceptionsIntroC")}
              </p>
              <ul className="space-y-3 text-stone-600">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  {t("refundPolicy.ex1")}
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  {t("refundPolicy.ex2")}
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  {t("refundPolicy.ex3")}
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span className="leading-tight">
                    <strong>{t("refundPolicy.ex4Bold")}</strong>{" "}
                    {t("refundPolicy.ex4Rest")}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  {t("refundPolicy.ex5")}
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  {t("refundPolicy.ex6")}
                </li>
              </ul>
            </section>

            {/* Section 3: Refund Process */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                {t("refundPolicy.procedureTitle")}
              </h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                {t("refundPolicy.procedureIntro")}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border border-stone-200 p-4 rounded-xl">
                  <span className="block text-sm text-stone-400 font-bold uppercase mb-1">
                    {t("refundPolicy.periodLabel")}
                  </span>
                  <span className="text-stone-900 font-medium">
                    {t("refundPolicy.periodValue")}
                  </span>
                </div>
                <div className="bg-white border border-stone-200 p-4 rounded-xl">
                  <span className="block text-sm text-stone-400 font-bold uppercase mb-1">
                    {t("refundPolicy.shippingLabel")}
                  </span>
                  <span className="text-stone-900 font-medium">
                    {t("refundPolicy.shippingValue")}
                  </span>
                  <p className="text-xs text-stone-400 mt-2 italic">
                    {t("refundPolicy.shippingNote")}
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-stone-100" />

            {/* Footer: Contact Info */}
            <section>
              <h3 className="text-lg font-bold text-stone-900 mb-6">
                {t("refundPolicy.contactTitle")}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                  <div className="bg-white p-3 rounded-full text-emerald-600 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-bold uppercase">
                      {t("refundPolicy.emailLabel")}
                    </p>
                    <a
                      href={`mailto:${ADMIN_CONFIG.BUSINESS_EMAIL}`}
                      className="text-stone-900 font-medium hover:text-emerald-600 transition-colors"
                    >
                      {ADMIN_CONFIG.BUSINESS_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                  <div className="bg-white p-3 rounded-full text-emerald-600 shadow-sm">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 font-bold uppercase">
                      {t("refundPolicy.phoneLabel")}
                    </p>
                    <a
                      href={`tel:${ADMIN_CONFIG.BUSINESS_PHONE}`}
                      className="text-stone-900 font-medium hover:text-emerald-600 transition-colors"
                    >
                      {ADMIN_CONFIG.BUSINESS_PHONE}
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
