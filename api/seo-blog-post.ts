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
  const { slug } = req.query;

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
        ? p.publishedAt.toDate().toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

    const postUrl = `${SITE_URL}/blog/${slug}`;
    const imageUrl = (p.image as string | undefined) || `${SITE_URL}/logo.png`;
    const title = `${p.title} | Life Store ბლოგი`;
    const description = (p.excerpt as string || "").slice(0, 155);
    const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
    const readTime = (p.readTime as number) || 3;

    // Fetch 3 related published posts for internal links
    const relatedSnap = await adminDb
      .collection("blogPosts")
      .where("isPublished", "==", true)
      .orderBy("publishedAt", "desc")
      .limit(6)
      .get();

    const relatedPosts = relatedSnap.docs
      .filter((d) => d.id !== postDoc.id)
      .slice(0, 3)
      .map((d) => ({ slug: d.data().slug as string, title: d.data().title as string }));

    // ── Schema.org: BlogPosting ────────────────────────────────────────────────
    const blogPostingSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: p.excerpt || "",
      image: [imageUrl],
      url: postUrl,
      datePublished: publishedDate,
      dateModified: publishedDate,
      author: { "@type": "Organization", name: "Life Store", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "Life Store",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
      ...(tags.length > 0 ? { keywords: tags.join(", ") } : {}),
      timeRequired: `PT${readTime}M`,
      inLanguage: "ka",
    };

    // ── Schema.org: BreadcrumbList ─────────────────────────────────────────────
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "მთავარი", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "ბლოგი", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: p.title, item: postUrl },
      ],
    };

    // content is HTML from Quill — strip script tags for safety, then output directly
    const rawContent = (p.content as string || "").replace(/<script[\s\S]*?<\/script>/gi, "");

    const html = `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${tags.length > 0 ? `<meta name="keywords" content="${esc(tags.join(", "))}">` : ""}
  <link rel="canonical" href="${postUrl}">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${postUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:site_name" content="Life Store">
  <meta property="og:locale" content="ka_GE">
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
    <a href="${SITE_URL}">Life Store</a> /
    <a href="${SITE_URL}/blog">ბლოგი</a> /
    <span>${esc(p.title as string)}</span>
  </nav>
  <main>
    <h1>${esc(p.title as string)}</h1>
    <p><time datetime="${publishedDate}">${publishedDate}</time> · ${readTime} წუთი კითხვა</p>
    ${p.image ? `<img src="${esc(p.image as string)}" alt="${esc(p.title as string)}" loading="lazy">` : ""}
    ${rawContent}
    ${relatedPosts.length > 0 ? `
    <section>
      <h2>იხილეთ ასევე</h2>
      <ul>
        ${relatedPosts.map((r) => `<li><a href="${SITE_URL}/blog/${r.slug}">${esc(r.title)}</a></li>`).join("\n        ")}
      </ul>
    </section>` : ""}
    <a href="${SITE_URL}/products">ყველა პროდუქტი</a>
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

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
