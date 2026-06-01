import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

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
    res.redirect(302, `/blog/${slug}?_spa=1`);
    return;
  }

  const UI = {
    htmlLang: lang,
    ogLocale: lang === "en" ? "en_US" : lang === "ru" ? "ru_RU" : "ka_GE",
    ogLocaleAlt1: lang === "ka" ? "en_US" : "ka_GE",
    ogLocaleAlt2: lang === "ru" ? "en_US" : "ru_RU",
    home: lang === "en" ? "Home" : lang === "ru" ? "Главная" : "მთავარი",
    blog: lang === "en" ? "Blog" : lang === "ru" ? "Блог" : "ბლოგი",
    allProducts: lang === "en" ? "All Products" : lang === "ru" ? "Все товары" : "ყველა პროდუქტი",
    seeAlso: lang === "en" ? "See Also" : lang === "ru" ? "Смотрите также" : "იხილეთ ასევე",
    minRead: lang === "en" ? "min read" : lang === "ru" ? "мин" : "წუთი კითხვა",
    shopTitle: lang === "en"
      ? "Shop related products"
      : lang === "ru"
      ? "Товары из статьи"
      : "სტატიასთან დაკავშირებული პროდუქტები",
    inLanguage: lang,
  };

  try {
    const snap = await adminDb
      .collection("blogPosts")
      .where("slug", "==", slug)
      .where("isPublished", "==", true)
      .limit(1)
      .get();

    if (snap.empty) {
      res.status(404).send("Not found");
      return;
    }

    const postDoc = snap.docs[0];
    const p = postDoc.data();

    const publishedDate =
      p.publishedAt instanceof Timestamp
        ? p.publishedAt.toDate().toISOString()
        : new Date().toISOString();

    const modifiedDate =
      p.updatedAt instanceof Timestamp
        ? p.updatedAt.toDate().toISOString()
        : publishedDate;

    const postTitle = loc(p.title, p.titleEn, p.titleRu, lang);
    const postExcerpt = loc(p.excerpt, p.excerptEn, p.excerptRu, lang);
    const postContent = loc(p.content, p.contentEn, p.contentRu, lang);

    const kaUrl = `${SITE_URL}/blog/${slug}`;
    const enUrl = `${SITE_URL}/en/blog/${slug}`;
    const ruUrl = `${SITE_URL}/ru/blog/${slug}`;
    const pageUrl = lang === "en" ? enUrl : lang === "ru" ? ruUrl : kaUrl;

    const imageUrl = (p.image as string | undefined) || `${SITE_URL}/logo.png`;
    const title = `${postTitle} | Life Store`;
    const description = postExcerpt.slice(0, 155);
    const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
    const readTime = (p.readTime as number) || 3;

    // Fetch 3 related published posts
    const relatedSnap = await adminDb
      .collection("blogPosts")
      .where("isPublished", "==", true)
      .orderBy("publishedAt", "desc")
      .limit(6)
      .get();

    const relatedPosts = relatedSnap.docs
      .filter((d) => d.id !== postDoc.id)
      .slice(0, 3)
      .map((d) => {
        const data = d.data();
        const relSlug = data.slug as string;
        return {
          slug: relSlug,
          url: lang === "ka" ? `${SITE_URL}/blog/${relSlug}` : `${SITE_URL}/${lang}/blog/${relSlug}`,
          title: loc(data.title, data.titleEn, data.titleRu, lang),
        };
      });

    // Related commerce links — internal linking from blog → category/product
    // pages (topical authority). Firestore "in" / getAll capped at 10.
    const relProductIds: string[] = Array.isArray(p.relatedProductIds)
      ? (p.relatedProductIds as string[]).slice(0, 10)
      : [];
    const relCategorySlugs: string[] = Array.isArray(p.relatedCategorySlugs)
      ? (p.relatedCategorySlugs as string[]).slice(0, 10)
      : [];

    const [relProductDocs, relCategorySnap] = await Promise.all([
      relProductIds.length > 0
        ? adminDb.getAll(...relProductIds.map((pid) => adminDb.collection("products").doc(pid)))
        : Promise.resolve([] as any[]),
      relCategorySlugs.length > 0
        ? adminDb.collection("categories").where("slug", "in", relCategorySlugs).get()
        : Promise.resolve({ docs: [] as any[] }),
    ]);

    const relatedProducts = relProductDocs
      .filter((d: any) => d.exists)
      .map((d: any) => {
        const data = d.data();
        const sBase = (data.slug || d.id) as string;
        return {
          url: lang === "ka" ? `${SITE_URL}/product/${sBase}` : `${SITE_URL}/${lang}/product/${sBase}`,
          name: loc(data.name, data.nameEn, data.nameRu, lang),
        };
      });

    const relatedCategories = (relCategorySnap.docs as any[]).map((d: any) => {
      const data = d.data();
      const cSlug = data.slug as string;
      return {
        url: lang === "ka" ? `${SITE_URL}/category/${cSlug}` : `${SITE_URL}/${lang}/category/${cSlug}`,
        name: loc(data.name, data.nameEn, data.nameRu, lang),
      };
    });

    // ── Schema.org: BlogPosting ────────────────────────────────────────────────
    const blogPostingSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: postTitle,
      description: postExcerpt,
      image: [imageUrl],
      url: pageUrl,
      datePublished: publishedDate,
      dateModified: modifiedDate,
      inLanguage: lang,
      author: { "@type": "Organization", name: "Life Store", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "Life Store",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      ...(tags.length > 0 ? { keywords: tags.join(", ") } : {}),
      timeRequired: `PT${readTime}M`,
    };

    // ── Schema.org: BreadcrumbList ─────────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: UI.home, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: UI.blog, item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: postTitle, item: pageUrl },
      ],
    };

    // Strip script tags from HTML content for safety
    const rawContent = postContent.replace(/<script[\s\S]*?<\/script>/gi, "");

    const html = `<!DOCTYPE html>
<html lang="${UI.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${tags.length > 0 ? `<meta name="keywords" content="${esc(tags.join(", "))}">` : ""}
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ka" href="${kaUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="ru" href="${ruUrl}">
  <link rel="alternate" hreflang="x-default" href="${kaUrl}">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="${UI.ogLocale}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt1}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt2}">
  <meta property="article:published_time" content="${publishedDate}">
  ${tags.map((t) => `<meta property="article:tag" content="${esc(t)}">`).join("\n  ")}

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">

  <script type="application/ld+json">${JSON.stringify(blogPostingSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">${UI.home}</a> /
    <a href="${SITE_URL}/blog">${UI.blog}</a> /
    <span>${esc(postTitle)}</span>
  </nav>
  <main>
    <h1>${esc(postTitle)}</h1>
    <p><time datetime="${publishedDate}">${publishedDate.split("T")[0]}</time> · ${readTime} ${UI.minRead}</p>
    ${p.image ? `<img src="${esc(p.image as string)}" alt="${esc(postTitle)}" loading="lazy">` : ""}
    ${rawContent}
    ${relatedCategories.length > 0 || relatedProducts.length > 0 ? `
    <section>
      <h2>${UI.shopTitle}</h2>
      <ul>
        ${relatedCategories.map((c) => `<li><a href="${c.url}">${esc(c.name)}</a></li>`).join("\n        ")}
        ${relatedProducts.map((r) => `<li><a href="${r.url}">${esc(r.name)}</a></li>`).join("\n        ")}
      </ul>
    </section>` : ""}
    ${relatedPosts.length > 0 ? `
    <section>
      <h2>${UI.seeAlso}</h2>
      <ul>
        ${relatedPosts.map((r) => `<li><a href="${r.url}">${esc(r.title)}</a></li>`).join("\n        ")}
      </ul>
    </section>` : ""}
    <a href="${SITE_URL}/products">${UI.allProducts}</a>
  </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.status(200).send(html);
  } catch (err) {
    console.error("[SEO] /api/seo-blog-post error:", err);
    res.redirect(302, `${SITE_URL}/blog/${slug}`);
  }
}
