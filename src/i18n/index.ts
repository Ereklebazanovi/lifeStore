import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ka from "./locales/ka.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ka: { translation: ka },
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: "ka",
    defaultNS: "translation",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
      // Normalize ka-GE → ka, en-US → en, ru-RU → ru at detection time
      convertDetectedLanguage: (lng: string) => {
        const base = lng.split("-")[0].toLowerCase();
        if (["ka", "en", "ru"].includes(base)) return base;
        return "ka";
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
