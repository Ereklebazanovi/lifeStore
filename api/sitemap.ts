import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";

const SITE_URL = "https://lifestore.ge";

const STATIC_PAGES = [
  { loc: "/",              priority: "1.0", changefreq: "daily"   },
  { loc: "/products",      priority: "0.9", changefreq: "daily"   },
  { loc: "/about",         priority: "0.7", changefreq: "monthly" },
  { loc: "/privacy-policy",priority: "0.4", changefreq: "monthly" },
  { loc: "/terms",         priority: "0.4", changefreq: "monthly" },
  { loc: "/refund-policy", priority: "0.4", changefreq: "monthly" },
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
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [productsSnap, categoriesSnap] = await Promise.all([
      adminDb.collection("products").get(),
      adminDb.collection("categories").get(),
    ]);

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
      entries.push(urlEntry(
        `/category/${slug}`,
        toDate(d.updatedAt),
        "weekly",
        "0.8"
      ));
    }

    // Product pages — only active, use slug if available else Firestore ID
    for (const doc of productsSnap.docs) {
      const d = doc.data();
      if (d.isActive === false) continue;
      const slug: string = d.slug || doc.id;
      entries.push(urlEntry(
        `/product/${slug}`,
        toDate(d.updatedAt),
        "weekly",
        "0.7"
      ));
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      "</urlset>",
    ].join("\n");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send("Sitemap generation failed");
  }
}
