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
  const lang = req.query.lang === "en" ? "en" : req.query.lang === "ru" ? "ru" : "ka";

  const ua = (req.headers["user-agent"] as string) || "";
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.redirect(302, `/blog?_spa=1`);
    return;
  }

  const UI = {
    htmlLang: lang,
    ogLocale: lang === "en" ? "en_US" : lang === "ru" ? "ru_RU" : "ka_GE",
    ogLocaleAlt1: lang === "ka" ? "en_US" : "ka_GE",
    ogLocaleAlt2: lang === "ru" ? "en_US" : "ru_RU",
    home: lang === "en" ? "Home" : lang === "ru" ? "Главная" : "მთავარი",
    blogTitle: lang === "en" ? "Blog | Life Store" : lang === "ru" ? "Блог | Life Store" : "ბლოგი | Life Store",
    blogName: lang === "en" ? "Life Store Blog" : lang === "ru" ? "Блог Life Store" : "Life Store ბლოგი",
    description: lang === "en"
      ? "Eco-friendly lifestyle, tips and news from Life Store."
      : lang === "ru"
      ? "Экологичный образ жизни, советы и новости от Life Store."
      : "ეკომეგობრული ცხოვრების სტილი, რჩევები და სიახლეები Life Store-დან.",
    allProducts: lang === "en" ? "All Products" : lang === "ru" ? "Все товары" : "ყველა პროდუქტი",
  };

  const kaUrl = `${SITE_URL}/blog`;
  const enUrl = `${SITE_URL}/en/blog`;
  const ruUrl = `${SITE_URL}/ru/blog`;
  const pageUrl = lang === "en" ? enUrl : lang === "ru" ? ruUrl : kaUrl;

  try {
    const snap = await adminDb
      .collection("blogPosts")
      .where("isPublished", "==", true)
      .orderBy("publishedAt", "desc")
      .get();

    const posts = snap.docs.map((doc) => {
      const d = doc.data();
      const publishedDate =
        d.publishedAt instanceof Timestamp
          ? d.publishedAt.toDate().toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
      const postSlug = d.slug as string;
      return {
        slug: postSlug,
        url: lang === "ka" ? `${SITE_URL}/blog/${postSlug}` : `${SITE_URL}/${lang}/blog/${postSlug}`,
        title: loc(d.title, d.titleEn, d.titleRu, lang),
        excerpt: loc(d.excerpt, d.excerptEn, d.excerptRu, lang).slice(0, 155),
        image: d.image as string | undefined,
        publishedDate,
        tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
      };
    });

    const description = `${UI.description} ${posts.length} ${lang === "en" ? "articles." : lang === "ru" ? "статей." : "სტატია."}`;

    // ── Schema.org: Blog ──────────────────────────────────────────────────────
    const blogSchema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: UI.blogName,
      description,
      url: pageUrl,
      inLanguage: lang,
      publisher: {
        "@type": "Organization",
        name: "Life Store",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      blogPost: posts.slice(0, 10).map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.excerpt,
        url: p.url,
        datePublished: p.publishedDate,
        ...(p.image ? { image: [p.image] } : {}),
      })),
    };

    // ── Schema.org: ItemList ───────────────────────────────────────────────────
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: UI.blogName,
      url: pageUrl,
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: p.url,
        name: p.title,
      })),
    };

    // ── Schema.org: BreadcrumbList ─────────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: UI.home, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: UI.blogName, item: pageUrl },
      ],
    };

    const html = `<!DOCTYPE html>
<html lang="${UI.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(UI.blogTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${lang === "en" ? "eco blog, eco-friendly living, Life Store" : lang === "ru" ? "эко блог, экологичный образ жизни, Life Store" : "ეკო ბლოგი, ეკომეგობრული ცხოვრება, Life Store"}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="ka" href="${kaUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="ru" href="${ruUrl}">
  <link rel="alternate" hreflang="x-default" href="${kaUrl}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(UI.blogTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="${UI.ogLocale}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt1}">
  <meta property="og:locale:alternate" content="${UI.ogLocaleAlt2}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(UI.blogTitle)}">
  <meta name="twitter:description" content="${esc(description)}">

  <script type="application/ld+json">${JSON.stringify(blogSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">${UI.home}</a> /
    <span>${UI.blogName}</span>
  </nav>
  <main>
    <h1>${UI.blogName}</h1>
    <p>${esc(description)}</p>
    <ul>
      ${posts
        .map(
          (p) =>
            `<li><a href="${p.url}">${esc(p.title)}</a> — <time datetime="${p.publishedDate}">${p.publishedDate}</time></li>`
        )
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
    console.error("[SEO] /api/seo-blog error:", err);
    res.redirect(302, `${SITE_URL}/blog`);
  }
}
