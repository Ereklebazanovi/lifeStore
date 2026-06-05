// api/seo-products.ts
// Pre-rendered HTML + JSON-LD for the full catalog page (/products).
// Mirrors seo-category.ts but lists ALL active products (no category filter).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";

const SITE_URL = "https://lifestore.ge";

// Real policy data — mirrors RefundPolicy page (14-day window, customer pays
// return shipping) and checkout shipping rates (Tbilisi/Rustavi base 5 GEL).
const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "GE",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
};

const SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: 5, currency: "GEL" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "GE" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
  },
};

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

function loc(ka: string | undefined, en: string | undefined, ru: string | undefined, lang: string): string {
  if (lang === "en") return en || ka || "";
  if (lang === "ru") return ru || ka || "";
  return ka || "";
}

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const lang = req.query.lang === "en" ? "en" : req.query.lang === "ru" ? "ru" : "ka";

  const ua = (req.headers["user-agent"] as string) || "";
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.redirect(302, `/products?_spa=1`);
    return;
  }

  const UI = {
    htmlLang: lang,
    ogLocale: lang === "en" ? "en_US" : lang === "ru" ? "ru_RU" : "ka_GE",
    ogLocaleAlt1: lang === "ka" ? "en_US" : "ka_GE",
    ogLocaleAlt2: lang === "ru" ? "en_US" : "ru_RU",
    home: lang === "en" ? "Home" : lang === "ru" ? "Главная" : "მთავარი",
    title: lang === "en" ? "All Products | Life Store" : lang === "ru" ? "Все товары | Life Store" : "ყველა პროდუქტი | Life Store",
    heading: lang === "en" ? "All Products" : lang === "ru" ? "Все товары" : "ყველა პროდუქტი",
    productsCount: lang === "en" ? "products" : lang === "ru" ? "товаров" : "პროდუქტი",
    description: lang === "en"
      ? "The full Life Store catalog — eco-friendly home and kitchen products."
      : lang === "ru"
      ? "Полный каталог Life Store — экологичные товары для дома и кухни."
      : "Life Store-ის სრული კატალოგი — ეკომეგობრული სახლისა და სამზარეულოს ნივთები.",
  };

  const kaUrl = `${SITE_URL}/products`;
  const enUrl = `${SITE_URL}/en/products`;
  const ruUrl = `${SITE_URL}/ru/products`;
  const pageUrl = lang === "en" ? enUrl : lang === "ru" ? ruUrl : kaUrl;

  try {
    const productsSnap = await adminDb
      .collection("products")
      .where("isActive", "==", true)
      .get();

    const products = productsSnap.docs.map((doc) => {
      const d = doc.data();
      const price: number =
        d.hasVariants && Array.isArray(d.variants) && d.variants.length > 0
          ? Math.min(
              ...d.variants
                .filter((v: any) => v.isActive)
                .map((v: any) => (v.salePrice && v.salePrice < v.price ? v.salePrice : v.price))
            )
          : d.salePrice && d.salePrice < d.price
          ? d.salePrice
          : d.price || 0;

      const stock: number =
        d.hasVariants && Array.isArray(d.variants)
          ? d.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0)
          : d.stock || 0;

      const slugBase = (d.slug || doc.id) as string;
      return {
        url: lang === "ka" ? `${SITE_URL}/product/${slugBase}` : `${SITE_URL}/${lang}/product/${slugBase}`,
        name: loc(d.name, d.nameEn, d.nameRu, lang),
        price,
        image: d.images?.[0] as string | undefined,
        inStock: stock > 0,
      };
    });

    const description = `${UI.description} ${products.length} ${UI.productsCount}.`;

    // ── Schema.org: ItemList ─────────────────────────────────────────────────
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: UI.heading,
      url: pageUrl,
      inLanguage: lang,
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          url: p.url,
          ...(p.image ? { image: p.image } : {}),
          brand: { "@type": "Brand", name: "Life Store" },
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "GEL",
            availability: p.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            hasMerchantReturnPolicy: RETURN_POLICY,
            shippingDetails: SHIPPING_DETAILS,
          },
        },
      })),
    };

    // ── Schema.org: CollectionPage ───────────────────────────────────────────
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: UI.title,
      description,
      url: pageUrl,
      inLanguage: lang,
      publisher: {
        "@type": "Organization",
        name: "Life Store",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
    };

    // ── Schema.org: BreadcrumbList ───────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: UI.home, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: UI.heading, item: pageUrl },
      ],
    };

    const html = `<!DOCTYPE html>
<html lang="${UI.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(UI.title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ka" href="${kaUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="ru" href="${ruUrl}">
  <link rel="alternate" hreflang="x-default" href="${kaUrl}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(UI.title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="${UI.ogLocale}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt1}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt2}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(UI.title)}">
  <meta name="twitter:description" content="${esc(description)}">

  <script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">${UI.home}</a> /
    <span>${UI.heading}</span>
  </nav>
  <main>
    <h1>${UI.heading}</h1>
    <p>${esc(description)}</p>
    <p><strong>${products.length} ${UI.productsCount}</strong></p>
    <ul>
      ${products
        .map((p) => `<li><a href="${p.url}">${esc(p.name)} — ₾${p.price.toFixed(2)}</a></li>`)
        .join("\n      ")}
    </ul>
  </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.status(200).send(html);
  } catch (err) {
    console.error("[SEO] /api/seo-products error:", err);
    res.redirect(302, `${SITE_URL}/products`);
  }
}
