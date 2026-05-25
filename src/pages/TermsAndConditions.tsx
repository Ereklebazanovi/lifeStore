//TermsAndConditions.tsx
import {
  Truck,
  ShieldAlert,
  CreditCard,
  Scale,
  Lock,
  Info,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Eye,
  Server,
  Share2,
  Database,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SITE_CONFIG, ADMIN_CONFIG } from "../config/constants";

const TermsAndConditions = () => {
  const { t } = useTranslation();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            {t("terms.pageTitle")}
          </h1>
          <p className="text-stone-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {t("terms.lastUpdated")}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 sticky top-4 z-10 bg-stone-50/90 backdrop-blur-sm p-2 rounded-2xl shadow-sm border border-stone-200">
          <button
            onClick={() => scrollToSection("terms")}
            className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            {t("terms.navTerms")}
          </button>
          <button
            onClick={() => scrollToSection("refund")}
            className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            {t("terms.navRefund")}
          </button>
          <button
            onClick={() => scrollToSection("privacy")}
            className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            {t("terms.navPrivacy")}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden divide-y divide-stone-100">
          {/* 1. TERMS & CONDITIONS */}
          <div id="terms" className="scroll-mt-24">
            <div className="bg-stone-900 text-white p-6 md:p-8">
              <h2 className="text-xl font-bold mb-2">{t("terms.termsTitle")}</h2>
              <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                {t("terms.termsIntro", { siteName: SITE_CONFIG.SITE_NAME })}
              </p>
            </div>

            <div className="p-6 md:p-10 space-y-10">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  {t("terms.s1Title")}
                </h3>
                <div className="prose prose-stone text-stone-600 leading-relaxed text-sm md:text-base">
                  <p>{t("terms.s1Intro")}</p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>{t("terms.s1FalseInfoTitle")}</strong>{" "}
                      {t("terms.s1FalseInfo")}
                    </li>
                    <li>
                      <strong>{t("terms.s1SystemTitle")}</strong>{" "}
                      {t("terms.s1System")}
                    </li>
                    <li>
                      <strong>{t("terms.s1FakeOrderTitle")}</strong>{" "}
                      {t("terms.s1FakeOrder")}
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  {t("terms.s2Title")}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {t("terms.s2Text", { siteName: SITE_CONFIG.SITE_NAME })}
                </p>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  {t("terms.s3Title")}
                </h3>
                <div className="text-stone-600 space-y-3">
                  <p>{t("terms.s3Intro")}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>{t("terms.s3OnDelivery")}</strong>{" "}
                      {t("terms.s3OnDeliveryText")}
                    </li>
                    <li>
                      <strong>{t("terms.s3Online")}</strong>{" "}
                      {t("terms.s3OnlineText")}
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  {t("terms.s4Title")}
                </h3>
                <div className="text-stone-600 space-y-3">
                  <p>{t("terms.s4Text")}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>{t("terms.s4Timeframe")}</strong>{" "}
                      {t("terms.s4TimeframeText")}
                    </li>
                    <li>
                      <strong>{t("terms.s4Address")}</strong>{" "}
                      {t("terms.s4AddressText")}
                    </li>
                    <li>
                      <strong>{t("terms.s4Receipt")}</strong>{" "}
                      {t("terms.s4ReceiptText")}
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Info className="w-5 h-5 text-emerald-600" />
                  {t("terms.s5Title")}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {t("terms.s5Text")}
                </p>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  {t("terms.s6Title")}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {t("terms.s6Text", { siteName: SITE_CONFIG.SITE_NAME })}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-stone-900 mb-4">
                  {t("terms.s7Title")}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {t("terms.s7Text")}
                </p>
              </section>
            </div>
          </div>

          {/* 2. REFUND POLICY */}
          <div id="refund" className="scroll-mt-24">
            <div className="bg-emerald-50 p-6 md:p-8 border-t border-b border-emerald-100">
              <div className="flex gap-4 items-start">
                <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-600 hidden md:block">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900 mb-2">
                    {t("terms.refundTitle")}
                  </h2>
                  <p className="text-stone-600 leading-relaxed">
                    {t("terms.refundIntro", { siteName: SITE_CONFIG.SITE_NAME })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-10">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <RefreshCw className="w-5 h-5 text-emerald-600" />
                  {t("terms.refundGeneralTitle")}
                </h3>
                <div className="prose prose-stone text-stone-600 leading-relaxed">
                  <p>
                    {t("terms.refundGeneralIntro1")}{" "}
                    <strong>{t("terms.refundGeneralIntro2")}</strong>{" "}
                    {t("terms.refundGeneralIntro3")}
                  </p>
                  <ul className="mt-4 space-y-2 list-none pl-0">
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{t("terms.refundCondition1")}</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{t("terms.refundCondition2")}</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{t("terms.refundCondition3")}</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  {t("terms.refundExceptionsTitle")}
                </h3>
                <p className="text-stone-600 mb-4">
                  {t("terms.refundExceptionsIntroA")}{" "}
                  <span className="font-bold text-stone-800">
                    {t("terms.refundExceptionsIntroB")}
                  </span>{" "}
                  {t("terms.refundExceptionsIntroC")}
                </p>
                <ul className="space-y-3 text-stone-600 text-sm md:text-base">
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    {t("terms.refundEx1")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    {t("terms.refundEx2")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    {t("terms.refundEx3")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    {t("terms.refundEx4")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    {t("terms.refundEx5")}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    {t("terms.refundEx6")}
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  {t("terms.refundProcedureTitle")}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-stone-200 p-4 rounded-xl">
                    <span className="block text-sm text-stone-400 font-bold uppercase mb-1">
                      {t("terms.refundPeriodLabel")}
                    </span>
                    <span className="text-stone-900 font-medium">
                      {t("terms.refundPeriodValue")}
                    </span>
                  </div>
                  <div className="bg-white border border-stone-200 p-4 rounded-xl">
                    <span className="block text-sm text-stone-400 font-bold uppercase mb-1">
                      {t("terms.refundShippingLabel")}
                    </span>
                    <span className="text-stone-900 font-medium">
                      {t("terms.refundShippingValue")}
                    </span>
                    <p className="text-xs text-stone-400 mt-2">
                      {t("terms.refundShippingNote")}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* 3. PRIVACY POLICY */}
          <div id="privacy" className="scroll-mt-24">
            <div className="bg-stone-900 text-white p-6 md:p-8">
              <div className="flex gap-4 items-start">
                <div className="bg-stone-800 p-3 rounded-xl hidden md:block">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    {t("terms.privacyTitle")}
                  </h2>
                  <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                    {t("terms.privacyIntro", { siteName: SITE_CONFIG.SITE_NAME })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-10">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Eye className="w-5 h-5 text-emerald-600" />
                  {t("terms.p1Title")}
                </h3>
                <div className="prose prose-stone text-stone-600 leading-relaxed text-sm md:text-base">
                  <p>{t("terms.p1Intro")}</p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>{t("terms.p1Contact")}</strong>{" "}
                      {t("terms.p1ContactText")}
                    </li>
                    <li>
                      <strong>{t("terms.p1Delivery")}</strong>{" "}
                      {t("terms.p1DeliveryText")}
                    </li>
                    <li>
                      <strong>{t("terms.p1History")}</strong>{" "}
                      {t("terms.p1HistoryText")}
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Server className="w-5 h-5 text-emerald-600" />
                  {t("terms.p2Title")}
                </h3>
                <p className="text-stone-600 mb-3">{t("terms.p2Intro")}</p>
                <ul className="list-disc pl-5 space-y-2 text-stone-600 text-sm md:text-base">
                  <li>{t("terms.p2Li1")}</li>
                  <li>{t("terms.p2Li2")}</li>
                  <li>{t("terms.p2Li3")}</li>
                </ul>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  {t("terms.p3Title")}
                </h3>
                <p className="text-stone-600 mb-3">{t("terms.p3Intro")}</p>
                <ul className="list-disc pl-5 space-y-2 text-stone-600">
                  <li>
                    <strong>{t("terms.p3Courier")}</strong>{" "}
                    {t("terms.p3CourierText")}
                  </li>
                  <li>
                    <strong>{t("terms.p3Gov")}</strong>{" "}
                    {t("terms.p3GovText")}
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                  <Database className="w-5 h-5 text-emerald-600" />
                  {t("terms.p4Title")}
                </h3>
                <p className="text-stone-600 leading-relaxed">
                  {t("terms.p4Text")}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-stone-900 mb-4">
                  {t("terms.p5Title")}
                </h3>
                <p className="text-stone-600 leading-relaxed mb-4">
                  {t("terms.p5Text")}
                </p>
                <p className="text-stone-600 text-sm italic">
                  {t("terms.p5Note")}
                </p>
              </section>
            </div>
          </div>

          {/* Contact Footer */}
          <div className="bg-stone-900 text-stone-400 p-8 text-sm">
            <p className="font-bold text-white mb-4 text-lg">
              {t("terms.contactTitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <a
                  href={`mailto:${ADMIN_CONFIG.BUSINESS_EMAIL}`}
                  className="hover:text-white transition-colors"
                >
                  {ADMIN_CONFIG.BUSINESS_EMAIL}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <a
                  href={`tel:${ADMIN_CONFIG.BUSINESS_PHONE}`}
                  className="hover:text-white transition-colors"
                >
                  {ADMIN_CONFIG.BUSINESS_PHONE}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
