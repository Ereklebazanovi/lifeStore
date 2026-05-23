import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";

const SITE_URL = "https://lifestore.ge";

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const { slug } = req.query;

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

  try {
    // Fetch category by slug
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

    const catDoc = catSnap.docs[0];
    const cat = catDoc.data();
    const categoryName = cat.name as string;
    const categoryDesc = (cat.description as string) || categoryName;
    const categoryImage = cat.image as string | undefined;
    const categoryUrl = `${SITE_URL}/category/${slug}`;

    // Fetch active products in this category
    const productsSnap = await adminDb
      .collection("products")
      .where("isActive", "==", true)
      .where("category", "==", categoryName)
      .get();

    const products = productsSnap.docs.map((doc) => {
      const d = doc.data();
      const price: number =
        d.hasVariants && Array.isArray(d.variants) && d.variants.length > 0
          ? Math.min(
              ...d.variants
                .filter((v: any) => v.isActive)
                .map((v: any) =>
                  v.salePrice && v.salePrice < v.price ? v.salePrice : v.price
                )
            )
          : d.salePrice && d.salePrice < d.price
          ? d.salePrice
          : d.price || 0;

      return {
        slug: (d.slug || doc.id) as string,
        name: d.name as string,
        price,
        image: d.images?.[0] as string | undefined,
      };
    });

    const title = `${categoryName} | Life Store`;
    const description = `${categoryDesc.slice(0, 120)} — ეკომეგობრული ნივთები Life Store-ში. ${products.length} პროდუქტი.`;

    // ── Schema.org: ItemList ─────────────────────────────────────────────────
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: categoryName,
      description: categoryDesc,
      url: categoryUrl,
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          url: `${SITE_URL}/product/${p.slug}`,
          ...(p.image ? { image: p.image } : {}),
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "GEL",
            availability: "https://schema.org/InStock",
          },
        },
      })),
    };

    // ── Schema.org: BreadcrumbList ───────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "მთავარი", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: categoryName, item: categoryUrl },
      ],
    };

    // ── Schema.org: CollectionPage ───────────────────────────────────────────
    const collectionSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: categoryDesc,
      url: categoryUrl,
      ...(categoryImage ? { image: categoryImage } : {}),
      publisher: {
        "@type": "Organization",
        name: "Life Store",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
    };

    const html = `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc(`${categoryName}, ეკო პროდუქტები, Life Store`)}">
  <link rel="canonical" href="${categoryUrl}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${categoryUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  ${categoryImage ? `<meta property="og:image" content="${esc(categoryImage)}">` : ""}
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="ka_GE">

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
    <a href="${SITE_URL}">Life Store</a> /
    <span>${esc(categoryName)}</span>
  </nav>
  <main>
    <h1>${esc(categoryName)}</h1>
    ${categoryDesc ? `<p>${esc(categoryDesc)}</p>` : ""}
    <p><strong>${products.length} პროდუქტი</strong></p>
    <ul>
      ${products
        .map(
          (p) =>
            `<li><a href="${SITE_URL}/product/${p.slug}">${esc(p.name)} — ₾${p.price.toFixed(2)}</a></li>`
        )
        .join("\n      ")}
    </ul>
    <a href="${SITE_URL}/products">ყველა პროდუქტი</a>
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

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
