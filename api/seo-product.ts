// api/seo-product.ts
// Serves pre-rendered HTML + JSON-LD structured data to search engine crawlers.
// Real users are routed to the SPA via vercel.json rewrites.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";
import { Timestamp, DocumentData } from "firebase-admin/firestore";

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
  // Matches published policy: standard delivery 2–5 business days
  // (handling 1–2 + transit 1–3 = total 2–5).
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
  },
};

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

// Firestore auto-generated IDs always contain uppercase letters; slugs never do
function isFirestoreId(value: string): boolean {
  return /[A-Z]/.test(value);
}

// Pick localized string with Georgian fallback
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
  const { id } = req.query;
  const lang = req.query.lang === "en" ? "en" : req.query.lang === "ru" ? "ru" : "ka";

  if (!id || typeof id !== "string") {
    res.status(404).send("Not found");
    return;
  }

  const ua = (req.headers["user-agent"] as string) || "";
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.redirect(302, `/product/${id}?_spa=1`);
    return;
  }

  // UI strings per language
  const UI = {
    htmlLang: lang,
    ogLocale: lang === "en" ? "en_US" : lang === "ru" ? "ru_RU" : "ka_GE",
    ogLocaleAlt1: lang === "ka" ? "en_US" : "ka_GE",
    ogLocaleAlt2: lang === "ru" ? "en_US" : "ru_RU",
    home: lang === "en" ? "Home" : lang === "ru" ? "Главная" : "მთავარი",
    products: lang === "en" ? "Products" : lang === "ru" ? "Товары" : "პროდუქტები",
    categoryLabel: lang === "en" ? "Category" : lang === "ru" ? "Категория" : "კატეგორია",
    priceLabel: lang === "en" ? "Price" : lang === "ru" ? "Цена" : "ფასი",
    availLabel: lang === "en" ? "Availability" : lang === "ru" ? "Наличие" : "ხელმისაწვდომობა",
    inStock: lang === "en" ? "In Stock" : lang === "ru" ? "В наличии" : "მარაგშია",
    outOfStock: lang === "en" ? "Out of Stock" : lang === "ru" ? "Нет в наличии" : "ამოწურულია",
    ratingLabel: lang === "en" ? "Rating" : lang === "ru" ? "Рейтинг" : "შეფასება",
    reviewWord: lang === "en" ? "reviews" : lang === "ru" ? "отзывов" : "შეფასება",
    customerReviews: lang === "en" ? "Customer Reviews" : lang === "ru" ? "Отзывы покупателей" : "მომხმარებელთა შეფასებები",
    seeAlso: lang === "en" ? "See Also" : lang === "ru" ? "Смотрите также" : "იხილეთ ასევე",
    viewProduct: lang === "en" ? "View Product" : lang === "ru" ? "Посмотреть товар" : "პროდუქტის ნახვა",
    allProducts: lang === "en" ? "All Products" : lang === "ru" ? "Все товары" : "ყველა პროდუქტი",
    user: lang === "en" ? "User" : lang === "ru" ? "Пользователь" : "მომხმარებელი",
    dateLocale: lang === "en" ? "en-US" : lang === "ru" ? "ru-RU" : "ka-GE",
  };

  try {
    let docId: string;
    let p: DocumentData;

    if (isFirestoreId(id)) {
      const productDoc = await adminDb.collection("products").doc(id).get();
      if (!productDoc.exists) {
        res.status(404).send("Not found");
        return;
      }
      docId = productDoc.id;
      p = productDoc.data()!;

      if (p.slug) {
        const redirectBase = lang === "ka" ? `${SITE_URL}/product/${p.slug}` : `${SITE_URL}/${lang}/product/${p.slug}`;
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.redirect(301, redirectBase);
        return;
      }
    } else {
      const slugSnap = await adminDb
        .collection("products")
        .where("slug", "==", id)
        .limit(1)
        .get();
      if (slugSnap.empty) {
        res.status(404).send("Not found");
        return;
      }
      const slugDoc = slugSnap.docs[0];
      docId = slugDoc.id;
      p = slugDoc.data();
    }

    // Fetch reviews and related products in parallel
    const [reviewsSnap, relatedSnap] = await Promise.all([
      adminDb
        .collection("reviews")
        .where("productId", "==", docId)
        .where("isApproved", "==", true)
        .get(),
      p.category
        ? adminDb
            .collection("products")
            .where("isActive", "==", true)
            .where("category", "==", p.category)
            .limit(8)
            .get()
        : Promise.resolve({ docs: [] as any[] }),
    ]);

    const relatedProducts = relatedSnap.docs
      .filter((doc) => doc.id !== docId)
      .slice(0, 4)
      .map((doc) => {
        const d = doc.data();
        const slugBase = (d.slug || doc.id) as string;
        return {
          slug: slugBase,
          url: lang === "ka" ? `${SITE_URL}/product/${slugBase}` : `${SITE_URL}/${lang}/product/${slugBase}`,
          name: loc(d.name, d.nameEn, d.nameRu, lang),
        };
      });

    const reviews = reviewsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        userName: (d.userName as string) || UI.user,
        rating: d.rating as number,
        text: d.text as string,
        createdAt:
          d.createdAt instanceof Timestamp
            ? d.createdAt.toDate()
            : new Date(d.createdAt),
      };
    });

    // Price
    let finalPrice: number = p.price || 0;
    if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
      const activePrices = p.variants
        .filter((v: any) => v.isActive)
        .map((v: any) => (v.salePrice && v.salePrice < v.price ? v.salePrice : v.price));
      if (activePrices.length > 0) finalPrice = Math.min(...activePrices);
    } else if (p.salePrice && p.salePrice < p.price) {
      finalPrice = p.salePrice;
    }

    // Stock
    const stock =
      p.hasVariants && Array.isArray(p.variants)
        ? p.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0)
        : p.stock || 0;
    const isInStock = stock > 0;

    // Rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : null;

    // Localized content
    const productName = loc(p.name, p.nameEn, p.nameRu, lang);
    const productDesc = loc(p.description, p.descriptionEn, p.descriptionRu, lang).slice(0, 155);

    const slugBase = p.slug || docId;
    const kaUrl = `${SITE_URL}/product/${slugBase}`;
    const enUrl = `${SITE_URL}/en/product/${slugBase}`;
    const ruUrl = `${SITE_URL}/ru/product/${slugBase}`;
    const pageUrl = lang === "en" ? enUrl : lang === "ru" ? ruUrl : kaUrl;

    const imageUrl = p.images?.[0] || `${SITE_URL}/logo.png`;
    const priceLabel = finalPrice.toFixed(2);
    const title = `${productName} — ₾${priceLabel} | Life Store`;
    const priceExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // ── JSON-LD: Product ──────────────────────────────────────────────────────
    const productSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: productName,
      description: loc(p.description, p.descriptionEn, p.descriptionRu, lang),
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images : [imageUrl],
      url: pageUrl,
      sku: p.productCode || id,
      brand: { "@type": "Brand", name: "Life Store" },
      inLanguage: lang,
      offers: {
        "@type": "Offer",
        url: pageUrl,
        price: finalPrice,
        priceCurrency: "GEL",
        priceValidUntil: priceExpiry,
        availability: isInStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Life Store", url: SITE_URL },
        hasMerchantReturnPolicy: RETURN_POLICY,
        shippingDetails: SHIPPING_DETAILS,
      },
    };

    if (avgRating !== null && reviews.length >= 1) {
      productSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
        bestRating: "5",
        worstRating: "1",
      };
      productSchema.review = reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.userName },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: "5",
          worstRating: "1",
        },
        reviewBody: r.text,
        datePublished: r.createdAt.toISOString().split("T")[0],
      }));
    }

    // ── JSON-LD: Organization ────────────────────────────────────────────────
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Life Store",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: lang === "en"
        ? "Eco-friendly home and kitchen products"
        : lang === "ru"
        ? "Экологичные товары для дома и кухни"
        : "ეკომეგობრული სახლის და სამზარეულოს ნივთები",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Georgian", "English", "Russian"],
      },
    };

    // ── JSON-LD: BreadcrumbList ───────────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: UI.home, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: UI.products, item: `${SITE_URL}/products` },
        { "@type": "ListItem", position: 3, name: productName, item: pageUrl },
      ],
    };

    // ── HTML ─────────────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="${UI.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(productDesc)}">
  <meta name="keywords" content="${esc(`${productName}, ეკო პროდუქტები, ${p.category || ""}, Life Store`)}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ka" href="${kaUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="ru" href="${ruUrl}">
  <link rel="alternate" hreflang="x-default" href="${kaUrl}">

  <meta property="og:type" content="product">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(productDesc)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="${UI.ogLocale}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt1}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt2}">
  <meta property="product:price:amount" content="${finalPrice}">
  <meta property="product:price:currency" content="GEL">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(productDesc)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">

  <script type="application/ld+json">${JSON.stringify(orgSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(productSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">${UI.home}</a> /
    <a href="${SITE_URL}/products">${UI.products}</a> /
    <span>${esc(productName)}</span>
  </nav>
  <main>
    <h1>${esc(productName)}</h1>
    ${p.category ? `<p><strong>${UI.categoryLabel}:</strong> ${esc(p.category)}</p>` : ""}
    <p><strong>${UI.priceLabel}:</strong> ₾${priceLabel}</p>
    <p><strong>${UI.availLabel}:</strong> ${isInStock ? UI.inStock : UI.outOfStock}</p>
    ${avgRating !== null ? `<p><strong>${UI.ratingLabel}:</strong> ${avgRating.toFixed(1)}/5 (${reviews.length} ${UI.reviewWord})</p>` : ""}
    <p>${esc(loc(p.description, p.descriptionEn, p.descriptionRu, lang))}</p>
    ${
      reviews.length > 0
        ? `<section>
      <h2>${UI.customerReviews}</h2>
      ${reviews
        .slice(0, 5)
        .map(
          (r) => `<article>
        <strong>${esc(r.userName)}</strong> — ${r.rating}/5
        <p>${esc(r.text)}</p>
        <time datetime="${r.createdAt.toISOString().split("T")[0]}">${r.createdAt.toLocaleDateString(UI.dateLocale)}</time>
      </article>`
        )
        .join("")}
    </section>`
        : ""
    }
    <a href="${pageUrl}">${UI.viewProduct}</a>
    ${relatedProducts.length > 0 ? `
    <section>
      <h2>${UI.seeAlso}</h2>
      <ul>
        ${relatedProducts.map((r) => `<li><a href="${r.url}">${esc(r.name)}</a></li>`).join("")}
      </ul>
    </section>` : ""}
  </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.status(200).send(html);
  } catch (error) {
    console.error("[SEO] /api/seo-product error:", error);
    res.redirect(302, `${SITE_URL}/product/${id}`);
  }
}
