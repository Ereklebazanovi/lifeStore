// api/product/[id].ts
// Serves pre-rendered HTML + JSON-LD structured data to search engine crawlers.
// Real users are routed to the SPA via vercel.json rewrites.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";
import { Timestamp, DocumentData } from "firebase-admin/firestore";

const SITE_URL = "https://lifestore.ge";

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

// Firestore auto-generated IDs always contain uppercase letters; slugs never do
function isFirestoreId(value: string): boolean {
  return /[A-Z]/.test(value);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const { id } = req.query;

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

  try {
    let docId: string;
    let p: DocumentData;

    if (isFirestoreId(id)) {
      // Direct Firestore document ID lookup
      const productDoc = await adminDb.collection("products").doc(id).get();
      if (!productDoc.exists) {
        res.status(404).send("Not found");
        return;
      }
      docId = productDoc.id;
      p = productDoc.data()!;

      // 301 redirect old ID-based URLs to slug URL for search engine crawlers
      if (p.slug) {
        res.setHeader("Cache-Control", "no-store, no-cache");
        res.redirect(301, `${SITE_URL}/product/${p.slug}`);
        return;
      }
    } else {
      // Slug-based lookup
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
        return { slug: (d.slug || doc.id) as string, name: d.name as string };
      });

    // Reviews
    const reviews = reviewsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        userName: (d.userName as string) || "მომხმარებელი",
        rating: d.rating as number,
        text: d.text as string,
        createdAt:
          d.createdAt instanceof Timestamp
            ? d.createdAt.toDate()
            : new Date(d.createdAt),
      };
    });

    // Price — handles both simple and variant products
    let finalPrice: number = p.price || 0;
    if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
      const activePrices = p.variants
        .filter((v: any) => v.isActive)
        .map((v: any) =>
          v.salePrice && v.salePrice < v.price ? v.salePrice : v.price
        );
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

    const productUrl = `${SITE_URL}/product/${p.slug || docId}`;
    const imageUrl = p.images?.[0] || `${SITE_URL}/logo.png`;
    const priceLabel = finalPrice.toFixed(2);
    const title = `${p.name} - ₾${priceLabel} | Life Store`;
    const description = (p.description || "").slice(0, 155);
    const priceExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // ── JSON-LD: Product ──────────────────────────────────────────────────────
    const productSchema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description || "",
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images : [imageUrl],
      url: productUrl,
      sku: p.productCode || id,
      brand: { "@type": "Brand", name: "Life Store" },
      offers: {
        "@type": "Offer",
        url: productUrl,
        price: finalPrice,
        priceCurrency: "GEL",
        priceValidUntil: priceExpiry,
        availability: isInStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Life Store", url: SITE_URL },
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
      description: "ეკომეგობრული სახლის და სამზარეულოს ნივთები",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: "Georgian",
      },
    };

    // ── JSON-LD: BreadcrumbList ───────────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "მთავარი", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "პროდუქტები",
          item: `${SITE_URL}/products`,
        },
        { "@type": "ListItem", position: 3, name: p.name, item: productUrl },
      ],
    };

    // ── HTML ─────────────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc(`${p.name}, ეკო პროდუქტები, ${p.category || ""}, Life Store`)}">
  <link rel="canonical" href="${productUrl}">

  <meta property="og:type" content="product">
  <meta property="og:url" content="${productUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="ka_GE">
  <meta property="product:price:amount" content="${finalPrice}">
  <meta property="product:price:currency" content="GEL">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">

  <script type="application/ld+json">${JSON.stringify(orgSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(productSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">Life Store</a> /
    <a href="${SITE_URL}/products">პროდუქტები</a> /
    <span>${esc(p.name)}</span>
  </nav>
  <main>
    <h1>${esc(p.name)}</h1>
    ${p.category ? `<p><strong>კატეგორია:</strong> ${esc(p.category)}</p>` : ""}
    <p><strong>ფასი:</strong> ₾${priceLabel}</p>
    <p><strong>ხელმისაწვდომობა:</strong> ${isInStock ? "მარაგშია" : "ამოწურულია"}</p>
    ${avgRating !== null ? `<p><strong>შეფასება:</strong> ${avgRating.toFixed(1)}/5 (${reviews.length} შეფასება)</p>` : ""}
    <p>${esc(p.description || "")}</p>
    ${
      reviews.length > 0
        ? `<section>
      <h2>მომხმარებელთა შეფასებები</h2>
      ${reviews
        .slice(0, 5)
        .map(
          (r) => `<article>
        <strong>${esc(r.userName)}</strong> — ${r.rating}/5
        <p>${esc(r.text)}</p>
        <time datetime="${r.createdAt.toISOString().split("T")[0]}">${r.createdAt.toLocaleDateString("ka-GE")}</time>
      </article>`
        )
        .join("")}
    </section>`
        : ""
    }
    <a href="${productUrl}">პროდუქტის ნახვა</a>
    ${relatedProducts.length > 0 ? `
    <section>
      <h2>იხილეთ ასევე</h2>
      <ul>
        ${relatedProducts.map((r) => `<li><a href="${SITE_URL}/product/${r.slug}">${esc(r.name)}</a></li>`).join("")}
      </ul>
    </section>` : ""}
  </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.status(200).send(html);
  } catch (error) {
    console.error("[SEO] /api/product/[id] error:", error);
    // On any error, fall back to the SPA so the user still sees the page
    res.redirect(302, `${SITE_URL}/product/${id}`);
  }
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
