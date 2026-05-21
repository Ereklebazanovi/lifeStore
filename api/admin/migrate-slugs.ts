/**
 * ONE-TIME migration: adds Georgian slugs to products and fixes category slugs.
 *
 * Usage:
 *   1. Set ADMIN_MIGRATION_SECRET in .env.local (any random string, e.g. "mig-2026-abc")
 *   2. Dry run (no writes):
 *      curl -X POST "http://localhost:3000/api/admin/migrate-slugs?target=all&dryRun=true" \
 *           -H "x-admin-secret: YOUR_SECRET"
 *   3. Real migration:
 *      curl -X POST "http://localhost:3000/api/admin/migrate-slugs?target=all&dryRun=false" \
 *           -H "x-admin-secret: YOUR_SECRET"
 *
 * target: "products" | "categories" | "all"
 * Safe to re-run: products/categories that already have a valid slug are SKIPPED.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";

// ── Georgian → Latin (same table as src/utils/slug.ts) ────────────────────────
const GEO_TO_LATIN: Record<string, string> = {
  'ა': 'a',  'ბ': 'b',  'გ': 'g',  'დ': 'd',  'ე': 'e',  'ვ': 'v',  'ზ': 'z',
  'თ': 't',  'ი': 'i',  'კ': 'k',  'ლ': 'l',  'მ': 'm',  'ნ': 'n',  'ო': 'o',
  'პ': 'p',  'ჟ': 'zh', 'რ': 'r',  'ს': 's',  'ტ': 't',  'უ': 'u',  'ფ': 'f',
  'ქ': 'k',  'ღ': 'gh', 'ყ': 'q',  'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j',  'ჰ': 'h',
};

function generateSlug(name: string): string {
  let result = '';
  for (const char of name.toLowerCase()) {
    if (GEO_TO_LATIN[char]) {
      result += GEO_TO_LATIN[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else {
      result += '-';
    }
  }
  return result.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function isValidSlug(slug: string | undefined): boolean {
  if (!slug) return false;
  // A slug of only hyphens means the old generator failed on Georgian input
  const stripped = slug.replace(/-/g, '');
  return stripped.length > 0;
}

// ── Firestore batch helper (max 500 ops per batch) ────────────────────────────
async function commitBatches(
  ops: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }>
): Promise<void> {
  const BATCH_SIZE = 400;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    for (const op of ops.slice(i, i + BATCH_SIZE)) {
      batch.update(op.ref, op.data);
    }
    await batch.commit();
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const secret = process.env.ADMIN_MIGRATION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'ADMIN_MIGRATION_SECRET env var not set' });
    return;
  }
  if (req.headers['x-admin-secret'] !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const dryRun = req.query.dryRun !== 'false';
  const target = (req.query.target as string) || 'all';

  const report: {
    dryRun: boolean;
    products?: object[];
    categories?: object[];
    summary: Record<string, number>;
  } = { dryRun, summary: {} };

  // ── PRODUCTS ─────────────────────────────────────────────────────────────────
  if (target === 'products' || target === 'all') {
    const snap = await adminDb.collection('products').get();
    const productResults: object[] = [];
    const ops: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }> = [];

    // Collect slugs already in use (to detect collisions)
    const usedSlugs = new Set<string>();
    for (const d of snap.docs) {
      const s = d.data().slug as string | undefined;
      if (isValidSlug(s)) usedSlugs.add(s!);
    }

    let migrated = 0, skipped = 0;

    for (const d of snap.docs) {
      const data = d.data();

      if (isValidSlug(data.slug)) {
        productResults.push({ id: d.id, name: data.name, slug: data.slug, status: 'skipped' });
        skipped++;
        continue;
      }

      let slug = generateSlug(data.name || '');

      if (!slug) {
        // Fallback: use productCode if name generates empty slug
        slug = generateSlug(data.productCode || '') || d.id.slice(0, 8).toLowerCase();
      }

      // Uniqueness: if slug taken, append product code
      if (usedSlugs.has(slug)) {
        const suffix = generateSlug(data.productCode || '') || d.id.slice(0, 6).toLowerCase();
        slug = `${slug}-${suffix}`;
      }
      usedSlugs.add(slug);

      productResults.push({ id: d.id, name: data.name, oldSlug: data.slug || null, newSlug: slug, status: 'will_migrate' });
      migrated++;

      if (!dryRun) {
        ops.push({ ref: d.ref, data: { slug, updatedAt: new Date() } });
      }
    }

    if (!dryRun && ops.length > 0) {
      await commitBatches(ops);
      // Update status in results
      productResults.forEach((r: any) => {
        if (r.status === 'will_migrate') r.status = 'migrated';
      });
    }

    report.products = productResults;
    report.summary.products_migrated = migrated;
    report.summary.products_skipped = skipped;
  }

  // ── CATEGORIES ────────────────────────────────────────────────────────────────
  if (target === 'categories' || target === 'all') {
    const snap = await adminDb.collection('categories').get();
    const catResults: object[] = [];
    const ops: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }> = [];

    const usedSlugs = new Set<string>();
    // Pre-fill with valid existing slugs
    for (const d of snap.docs) {
      const s = d.data().slug as string | undefined;
      if (isValidSlug(s)) usedSlugs.add(s!);
    }

    let migrated = 0, skipped = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const existingSlug = data.slug as string | undefined;

      // Generate the "correct" slug using Georgian transliteration
      const correctSlug = generateSlug(data.name || '');

      // Keep existing slug IF it's already valid AND looks like a proper slug
      // (not just hyphens — which means the old generator failed on Georgian text)
      if (isValidSlug(existingSlug) && existingSlug === correctSlug) {
        catResults.push({ id: d.id, name: data.name, slug: existingSlug, status: 'skipped' });
        skipped++;
        continue;
      }

      // Slug needs to be created or fixed
      let slug = correctSlug || existingSlug || '';
      if (!slug) slug = d.id.slice(0, 8).toLowerCase();

      // Uniqueness
      if (usedSlugs.has(slug) && slug !== existingSlug) {
        slug = `${slug}-${d.id.slice(0, 4).toLowerCase()}`;
      }
      usedSlugs.add(slug);

      catResults.push({
        id: d.id,
        name: data.name,
        oldSlug: existingSlug || null,
        newSlug: slug,
        status: 'will_migrate',
      });
      migrated++;

      if (!dryRun) {
        ops.push({ ref: d.ref, data: { slug, updatedAt: new Date() } });
      }
    }

    if (!dryRun && ops.length > 0) {
      await commitBatches(ops);
      catResults.forEach((r: any) => {
        if (r.status === 'will_migrate') r.status = 'migrated';
      });
    }

    report.categories = catResults;
    report.summary.categories_migrated = migrated;
    report.summary.categories_skipped = skipped;
  }

  res.status(200).json(report);
}
