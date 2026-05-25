import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";

const SITE_URL = "https://lifestore.ge";

const STATIC_PAGES = [
  { loc: "/",               priority: "1.0", changefreq: "daily"   },
  { loc: "/products",       priority: "0.9", changefreq: "daily"   },
  { loc: "/blog",           priority: "0.8", changefreq: "weekly"  },
  { loc: "/en/blog",        priority: "0.7", changefreq: "weekly"  },
  { loc: "/ru/blog",        priority: "0.7", changefreq: "weekly"  },
  { loc: "/about",          priority: "0.7", changefreq: "monthly" },
  { loc: "/en/about",       priority: "0.6", changefreq: "monthly" },
  { loc: "/ru/about",       priority: "0.6", changefreq: "monthly" },
  { loc: "/privacy-policy", priority: "0.4", changefreq: "monthly" },
  { loc: "/terms",          priority: "0.4", changefreq: "monthly" },
  { loc: "/refund-policy",  priority: "0.4", changefreq: "monthly" },
];

function toDate(val: unknown): string {
  const today = new Date().toISOString().split("T")[0];
  if (!val) return today;
  try {
    if (typeof (val as any).toDate === "function") {
      return (val as any).toDate().toISOString().split("T")[0];
    }
  } catch {/* ignore */}
  return today;
}

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string
): string {
  return [
    "  <url>",
    `    <loc>${SITE_URL}${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [productsSnap, categoriesSnap, blogSnap] = await Promise.all([
      adminDb.collection("products").get(),
      adminDb.collection("categories").get(),
      adminDb.collection("blogPosts").where("isPublished", "==", true).get(),
    ]);

    // Debug mode: return raw Firestore data to diagnose slug reading
    if (req.query.debug === "1") {
      const sample = productsSnap.docs.slice(0, 3).map((doc) => ({
        id: doc.id,
        fields: Object.keys(doc.data()),
        slug: doc.data().slug,
        name: doc.data().name,
      }));
      res.setHeader("Content-Type", "application/json");
      res.status(200).json({ count: productsSnap.size, sample });
      return;
    }

    const entries: string[] = [];

    // Static pages
    for (const page of STATIC_PAGES) {
      entries.push(urlEntry(page.loc, today, page.changefreq, page.priority));
    }

    // Category pages — only active, must have a slug
    for (const doc of categoriesSnap.docs) {
      const d = doc.data();
      if (d.isActive === false) continue;
      const slug: string | undefined = d.slug;
      if (!slug) continue;
      const lastmod = toDate(d.updatedAt);
      entries.push(urlEntry(`/category/${slug}`,    lastmod, "weekly", "0.8"));
      entries.push(urlEntry(`/en/category/${slug}`, lastmod, "weekly", "0.7"));
      entries.push(urlEntry(`/ru/category/${slug}`, lastmod, "weekly", "0.7"));
    }

    // Blog posts — only published, must have a slug
    for (const doc of blogSnap.docs) {
      const d = doc.data();
      const slug: string | undefined = d.slug;
      if (!slug) continue;
      const lastmod = toDate(d.publishedAt);
      entries.push(urlEntry(`/blog/${slug}`,    lastmod, "monthly", "0.7"));
      entries.push(urlEntry(`/en/blog/${slug}`, lastmod, "monthly", "0.6"));
      entries.push(urlEntry(`/ru/blog/${slug}`, lastmod, "monthly", "0.6"));
    }

    // Product pages — only active, use slug if available else Firestore ID
    for (const doc of productsSnap.docs) {
      const d = doc.data();
      if (d.isActive === false) continue;
      const slug: string = d.slug || doc.id;
      const lastmod = toDate(d.updatedAt);
      entries.push(urlEntry(`/product/${slug}`,    lastmod, "weekly", "0.7"));
      entries.push(urlEntry(`/en/product/${slug}`, lastmod, "weekly", "0.6"));
      entries.push(urlEntry(`/ru/product/${slug}`, lastmod, "weekly", "0.6"));
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      "</urlset>",
    ].join("\n");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Sitemap generation failed");
  }
}
