import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const SITE_URL = "https://lifestore.ge";

const BOT_PATTERN =
  /Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|Mediapartners-Google|bingbot|Slurp|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot/i;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const ua = (req.headers["user-agent"] as string) || "";
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.redirect(302, `/blog?_spa=1`);
    return;
  }

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
      return {
        slug: d.slug as string,
        title: d.title as string,
        excerpt: (d.excerpt as string || "").slice(0, 155),
        image: d.image as string | undefined,
        publishedDate,
        tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
      };
    });

    const blogUrl = `${SITE_URL}/blog`;
    const title = "ბლოგი | Life Store";
    const description = `ეკომეგობრული ცხოვრების სტილი, რჩევები და სიახლეები Life Store-დან. ${posts.length} სტატია.`;

    // ── Schema.org: Blog ──────────────────────────────────────────────────────
    const blogSchema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Life Store ბლოგი",
      description,
      url: blogUrl,
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
        url: `${SITE_URL}/blog/${p.slug}`,
        datePublished: p.publishedDate,
        ...(p.image ? { image: [p.image] } : {}),
      })),
    };

    // ── Schema.org: ItemList ───────────────────────────────────────────────────
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Life Store ბლოგი",
      url: blogUrl,
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    };

    // ── Schema.org: BreadcrumbList ─────────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "მთავარი", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "ბლოგი", item: blogUrl },
      ],
    };

    const html = `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="ეკო ბლოგი, ეკომეგობრული ცხოვრება, Life Store">
  <link rel="canonical" href="${blogUrl}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${blogUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="ka_GE">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">

  <script type="application/ld+json">${JSON.stringify(blogSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
</head>
<body>
  <nav>
    <a href="${SITE_URL}">Life Store</a> /
    <span>ბლოგი</span>
  </nav>
  <main>
    <h1>Life Store ბლოგი</h1>
    <p>${esc(description)}</p>
    <ul>
      ${posts
        .map(
          (p) =>
            `<li><a href="${SITE_URL}/blog/${p.slug}">${esc(p.title)}</a> — <time datetime="${p.publishedDate}">${p.publishedDate}</time></li>`
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
    console.error("[SEO] /api/seo-blog error:", err);
    res.redirect(302, `${SITE_URL}/blog`);
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
