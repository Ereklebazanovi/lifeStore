//PrivacyPolicy.tsx
import {
  Lock,
  Eye,
  Server,
  Share2,
  ShieldCheck,
  Mail,
  Phone,
  Database,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SITE_CONFIG, ADMIN_CONFIG } from "../config/constants";

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            {t("privacyPolicy.pageTitle")}
          </h1>
          <p className="text-stone-500 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {t("privacyPolicy.lastUpdated")}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-stone-900 text-white p-6 md:p-8">
            <div className="flex gap-4 items-start">
              <div className="bg-stone-800 p-3 rounded-xl hidden md:block">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">
                  {t("privacyPolicy.bannerTitle")}
                </h2>
                <p className="text-stone-300 leading-relaxed text-sm md:text-base">
                  {t("privacyPolicy.bannerText", { siteName: SITE_CONFIG.SITE_NAME })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-10">
            {/* 1. Data Collection */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Eye className="w-5 h-5 text-emerald-600" />
                {t("privacyPolicy.s1Title")}
              </h3>
              <div className="prose prose-stone text-stone-600 leading-relaxed text-sm md:text-base">
                <p>{t("privacyPolicy.s1Intro")}</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>
                    <strong>{t("privacyPolicy.s1Contact")}</strong>{" "}
                    {t("privacyPolicy.s1ContactText")}
                  </li>
                  <li>
                    <strong>{t("privacyPolicy.s1Delivery")}</strong>{" "}
                    {t("privacyPolicy.s1DeliveryText")}
                  </li>
                  <li>
                    <strong>{t("privacyPolicy.s1History")}</strong>{" "}
                    {t("privacyPolicy.s1HistoryText")}
                  </li>
                </ul>
              </div>
            </section>

            {/* 2. Data Usage */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Server className="w-5 h-5 text-emerald-600" />
                {t("privacyPolicy.s2Title")}
              </h3>
              <p className="text-stone-600 mb-3">{t("privacyPolicy.s2Intro")}</p>
              <ul className="list-disc pl-5 space-y-2 text-stone-600 text-sm md:text-base">
                <li>{t("privacyPolicy.s2Li1")}</li>
                <li>{t("privacyPolicy.s2Li2")}</li>
                <li>{t("privacyPolicy.s2Li3")}</li>
              </ul>
            </section>

            {/* 3. Data Sharing */}
            <section className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Share2 className="w-5 h-5 text-emerald-600" />
                {t("privacyPolicy.s3Title")}
              </h3>
              <p className="text-stone-600 mb-3">{t("privacyPolicy.s3Intro")}</p>
              <ul className="list-disc pl-5 space-y-2 text-stone-600">
                <li>
                  <strong>{t("privacyPolicy.s3Courier")}</strong>{" "}
                  {t("privacyPolicy.s3CourierText")}
                </li>
                <li>
                  <strong>{t("privacyPolicy.s3Gov")}</strong>{" "}
                  {t("privacyPolicy.s3GovText")}
                </li>
              </ul>
            </section>

            {/* 4. Technical Security */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900 mb-4">
                <Database className="w-5 h-5 text-emerald-600" />
                {t("privacyPolicy.s4Title")}
              </h3>
              <p className="text-stone-600 leading-relaxed">
                {t("privacyPolicy.s4Text")}
              </p>
            </section>

            {/* 5. User Rights */}
            <section>
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                {t("privacyPolicy.s5Title")}
              </h3>
              <p className="text-stone-600 leading-relaxed mb-4">
                {t("privacyPolicy.s5Text")}
              </p>
              <p className="text-stone-600 text-sm italic">
                {t("privacyPolicy.s5Note")}
              </p>
            </section>

            <hr className="border-stone-200" />

            <div className="text-sm text-stone-500 pt-4">
              <p className="font-bold text-stone-900 mb-2">
                {t("privacyPolicy.contactTitle")}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {ADMIN_CONFIG.BUSINESS_EMAIL}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {ADMIN_CONFIG.BUSINESS_PHONE}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
