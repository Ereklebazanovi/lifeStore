// api/merchant-feed.ts
// Google Merchant Center product feed (RSS 2.0 + g: namespace).
// Add this URL in Merchant Center → Products → Add via "Scheduled fetch":
//   https://lifestore.ge/api/merchant-feed
// Read-only; mirrors the price/stock logic used in seo-product.ts.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";

const SITE_URL = "https://lifestore.ge";

function esc(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Strip HTML tags + collapse whitespace for plain-text descriptions
function plain(html: string): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const snap = await adminDb.collection("products").get();

    const items: string[] = [];

    for (const doc of snap.docs) {
      const p = doc.data();
      if (p.isActive === false) continue;

      // Price — lowest active variant price, else salePrice, else price
      let finalPrice: number = p.price || 0;
      if (p.hasVariants && Array.isArray(p.variants) && p.variants.length > 0) {
        const active = p.variants
          .filter((v: any) => v.isActive)
          .map((v: any) => (v.salePrice && v.salePrice < v.price ? v.salePrice : v.price));
        if (active.length > 0) finalPrice = Math.min(...active);
      } else if (p.salePrice && p.salePrice < p.price) {
        finalPrice = p.salePrice;
      }
      if (!finalPrice || finalPrice <= 0) continue; // skip items without a usable price

      // Stock
      const stock =
        p.hasVariants && Array.isArray(p.variants)
          ? p.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0)
          : p.stock || 0;
      const availability = stock > 0 ? "in_stock" : "out_of_stock";

      const slug = (p.slug || doc.id) as string;
      const link = `${SITE_URL}/product/${slug}`;
      const image = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : `${SITE_URL}/logo.png`;
      const title = (p.name as string) || "Life Store პროდუქტი";
      const description = plain((p.description as string) || title).slice(0, 5000) || title;
      const id = (p.productCode as string) || doc.id;

      items.push(
        [
          "    <item>",
          `      <g:id>${esc(id)}</g:id>`,
          `      <g:title>${esc(title)}</g:title>`,
          `      <g:description>${esc(description)}</g:description>`,
          `      <g:link>${esc(link)}</g:link>`,
          `      <g:image_link>${esc(image)}</g:image_link>`,
          `      <g:availability>${availability}</g:availability>`,
          `      <g:price>${finalPrice.toFixed(2)} GEL</g:price>`,
          `      <g:brand>Life Store</g:brand>`,
          `      <g:condition>new</g:condition>`,
          `      <g:identifier_exists>no</g:identifier_exists>`,
          ...(p.category ? [`      <g:product_type>${esc(String(p.category))}</g:product_type>`] : []),
          "    </item>",
        ].join("\n")
      );
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
      "  <channel>",
      "    <title>Life Store</title>",
      `    <link>${SITE_URL}</link>`,
      "    <description>Life Store — ეკომეგობრული სახლის და სამზარეულოს ნივთები</description>",
      ...items,
      "  </channel>",
      "</rss>",
    ].join("\n");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.status(200).send(xml);
  } catch (err) {
    console.error("[merchant-feed] error:", err);
    res.status(500).send("Feed generation failed");
  }
}
