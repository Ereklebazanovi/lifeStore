import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { blackFridayPath, blackFridayShareImage } from "./src/config/blackFriday";
import { storefrontPath } from "./src/utils/storefrontPaths";

function blackFridaySharePages(): Plugin {
  const locales = { ka: "ka_GE", en: "en_US", ru: "ru_RU" };
  const absoluteUrl = (language: string) => "https://lifestore.ge" + storefrontPath(blackFridayPath, language);
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  return {
    name: "black-friday-share-pages",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const index = bundle["index.html"];
      if (index?.type !== "asset" || typeof index.source !== "string") {
        this.error("Expected the storefront HTML before creating the Black Friday pages.");
      }

      for (const [language, locale] of Object.entries(locales)) {
        const localeFile = new URL(`./src/i18n/locales/${language}.json`, import.meta.url);
        const { blackFriday: copy } = JSON.parse(readFileSync(localeFile, "utf8")) as {
          blackFriday: { title: string; shareDescription: string };
        };
        const metadata = {
          title: escape(`${copy.title} | Life Store`),
          description: escape(copy.shareDescription),
          url: absoluteUrl(language),
          image: blackFridayShareImage,
          locale,
        };
        // Use the compiled storefront shell so ad visitors load the usual app on the same URL.
        const html = index.source
          .replace('<html lang="ka">', `<html lang="${language}">`)
          .replace(/<title>[^<]*<\/title>/, `<title>${metadata.title}</title>`)
          .replace(
            /(<meta (?:name|property)="(?:og:|twitter:)?)(title|description|url|image|locale)(" content=")[^"]*(")/g,
            (_, start: string, key: keyof typeof metadata, content: string, end: string) =>
              `${start}${key}${content}${metadata[key]}${end}`,
          )
          .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, start: string, end: string) => start + metadata.url + end)
          .replace(
            /(<link rel="alternate" hreflang=")(ka|en|ru|x-default)(" href=")[^"]*(")/g,
            (_, start: string, lang: string, href: string, end: string) => start + lang + href + absoluteUrl(lang) + end,
          )
          .replace('<meta property="og:site_name"', `<meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name"`);
        this.emitFile({ type: "asset", fileName: storefrontPath(blackFridayPath, language).slice(1) + ".html", source: html });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // ამოწმებს, არის თუ არა production რეჟიმი (უფრო საიმედოა ვიდრე process.env)
  const isProduction = mode === 'production';

  return {
    plugins: [react(), tailwindcss(), blackFridaySharePages()],

    // ✅ esbuild სწორ ადგილასაა (გარეთ) და იყენებს isProduction ცვლადს
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    build: {
      // minify: 'esbuild', // ეს default-ად ჩართულია, შეგიძლია არ დაწერო
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            ui: ['lucide-react', 'framer-motion'],
            utils: ['zustand', 'react-router-dom'],
          },
        },
      },
    },

    server: {
      port: 3000,
      open: true,
    },
  };
});

