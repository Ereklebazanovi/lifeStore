import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";

const SITE_URL = "https://lifestore.ge";

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
  const { slug } = req.query;
  const lang = req.query.lang === "en" ? "en" : req.query.lang === "ru" ? "ru" : "ka";

  if (!slug || typeof slug !== "string") {
    res.status(404).send("Not found");
    return;
  }

  const ua = (req.headers["user-agent"] as string) || "";
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.redirect(302, `/category/${slug}?_spa=1`);
    return;
  }

  const UI = {
    htmlLang: lang,
    ogLocale: lang === "en" ? "en_US" : lang === "ru" ? "ru_RU" : "ka_GE",
    ogLocaleAlt1: lang === "ka" ? "en_US" : "ka_GE",
    ogLocaleAlt2: lang === "ru" ? "en_US" : "ru_RU",
    home: lang === "en" ? "Home" : lang === "ru" ? "Главная" : "მთავარი",
    allProducts: lang === "en" ? "All Products" : lang === "ru" ? "Все товары" : "ყველა პროდუქტი",
    productsCount: lang === "en" ? "products" : lang === "ru" ? "товаров" : "პროდუქტი",
    ecoSuffix: lang === "en"
      ? "— eco-friendly products in Life Store."
      : lang === "ru"
      ? "— экологичные товары в Life Store."
      : "— ეკომეგობრული ნივთები Life Store-ში.",
  };

  try {
    const catSnap = await adminDb
      .collection("categories")
      .where("slug", "==", slug)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (catSnap.empty) {
      res.status(404).send("Category not found");
      return;
    }

    const cat = catSnap.docs[0].data();

    const categoryName = loc(cat.name, cat.nameEn, cat.nameRu, lang);
    const categoryDesc = loc(cat.description, cat.descriptionEn, cat.descriptionRu, lang) || categoryName;
    const categoryImage = cat.image as string | undefined;

    const kaUrl = `${SITE_URL}/category/${slug}`;
    const enUrl = `${SITE_URL}/en/category/${slug}`;
    const ruUrl = `${SITE_URL}/ru/category/${slug}`;
    const pageUrl = lang === "en" ? enUrl : lang === "ru" ? ruUrl : kaUrl;

    // Fetch active products in this category (category stored in Georgian in Firestore)
    const productsSnap = await adminDb
      .collection("products")
      .where("isActive", "==", true)
      .where("category", "==", cat.name) // always compare against Georgian name (stored value)
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

      // Real stock — mirror seo-product.ts logic (variants sum, else flat stock)
      const stock: number =
        d.hasVariants && Array.isArray(d.variants)
          ? d.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0)
          : d.stock || 0;

      const slugBase = (d.slug || doc.id) as string;
      return {
        slug: slugBase,
        url: lang === "ka" ? `${SITE_URL}/product/${slugBase}` : `${SITE_URL}/${lang}/product/${slugBase}`,
        name: loc(d.name, d.nameEn, d.nameRu, lang),
        price,
        image: d.images?.[0] as string | undefined,
        inStock: stock > 0,
      };
    });

    const title = `${categoryName} | Life Store`;
    const description = `${categoryDesc.slice(0, 100)} ${UI.ecoSuffix} ${products.length} ${UI.productsCount}.`;

    // ── Schema.org: ItemList ─────────────────────────────────────────────────
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: categoryName,
      description: categoryDesc,
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
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "GEL",
            availability: p.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        },
      })),
    };

    // ── Schema.org: BreadcrumbList ───────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: UI.home, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: categoryName, item: pageUrl },
      ],
    };

    // ── Schema.org: CollectionPage ───────────────────────────────────────────
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: categoryDesc,
      url: pageUrl,
      inLanguage: lang,
      ...(categoryImage ? { image: categoryImage } : {}),
      publisher: {
        "@type": "Organization",
        name: "Life Store",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
    };

    const html = `<!DOCTYPE html>
<html lang="${UI.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc(`${categoryName}, ეკო პროდუქტები, Life Store`)}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ka" href="${kaUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="ru" href="${ruUrl}">
  <link rel="alternate" hreflang="x-default" href="${kaUrl}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  ${categoryImage ? `<meta property="og:image" content="${esc(categoryImage)}">` : ""}
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="${UI.ogLocale}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt1}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt2}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${categoryImage ? `<meta name="twitter:image" content="${esc(categoryImage)}">` : ""}

  <script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">${UI.home}</a> /
    <span>${esc(categoryName)}</span>
  </nav>
  <main>
    <h1>${esc(categoryName)}</h1>
    ${categoryDesc ? `<p>${esc(categoryDesc)}</p>` : ""}
    <p><strong>${products.length} ${UI.productsCount}</strong></p>
    <ul>
      ${products
        .map((p) => `<li><a href="${p.url}">${esc(p.name)} — ₾${p.price.toFixed(2)}</a></li>`)
        .join("\n      ")}
    </ul>
    <a href="${SITE_URL}/products">${UI.allProducts}</a>
  </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.status(200).send(html);
  } catch (err) {
    console.error("[SEO] /api/seo-category error:", err);
    res.redirect(302, `${SITE_URL}/category/${slug}`);
  }
}
