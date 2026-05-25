// scripts/import-blog-translations.js
// Uses Firebase Admin SDK (serviceAccount.json) to write blog translation fields.
// Never touches: title, excerpt, content (Georgian originals), tags, slug, publishedAt, etc.
//
// Reads:
//   blog-translations/metadata.json          — titleEn, excerptEn, titleRu, excerptRu
//   blog-translations/content/[slug]-en.html — English HTML content
//   blog-translations/content/[slug]-ru.html — Russian HTML content
//
// Run: node scripts/import-blog-translations.js

import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);

// Load service account
const serviceAccountPath = "serviceAccount.json";
if (!existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccount.json not found in project root.");
  console.error(
    "   Firebase Console → Project Settings → Service Accounts → Generate new private key"
  );
  process.exit(1);
}

const admin = require("firebase-admin");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importBlogTranslations() {
  const metadataPath = path.join("blog-translations", "metadata.json");

  if (!existsSync(metadataPath)) {
    console.error(`❌ File not found: ${metadataPath}`);
    console.error("Run export first: node scripts/export-blog-translations.js");
    process.exit(1);
  }

  const posts = JSON.parse(readFileSync(metadataPath, "utf8"));
  const contentDir = path.join("blog-translations", "content");

  // Build update objects for each post
  const toUpdate = [];

  for (const post of posts) {
    const update = {};

    if (post.titleEn?.trim()) update.titleEn = post.titleEn.trim();
    if (post.titleRu?.trim()) update.titleRu = post.titleRu.trim();
    if (post.excerptEn?.trim()) update.excerptEn = post.excerptEn.trim();
    if (post.excerptRu?.trim()) update.excerptRu = post.excerptRu.trim();

    // Read HTML content files
    const enHtmlPath = path.join(contentDir, `${post.slug}-en.html`);
    const ruHtmlPath = path.join(contentDir, `${post.slug}-ru.html`);

    if (existsSync(enHtmlPath)) {
      const enContent = readFileSync(enHtmlPath, "utf8").trim();
      if (enContent) update.contentEn = enContent;
    }

    if (existsSync(ruHtmlPath)) {
      const ruContent = readFileSync(ruHtmlPath, "utf8").trim();
      if (ruContent) update.contentRu = ruContent;
    }

    if (Object.keys(update).length > 0) {
      toUpdate.push({ post, update });
    }
  }

  if (toUpdate.length === 0) {
    console.log("⚠️  No translations to import. Fill in the EN/RU fields first.");
    console.log("   metadata.json  — titleEn, excerptEn, titleRu, excerptRu");
    console.log("   content/[slug]-en.html and content/[slug]-ru.html");
    process.exit(0);
  }

  console.log(`\nAbout to update ${toUpdate.length} of ${posts.length} blog posts:\n`);
  for (const { post, update } of toUpdate) {
    console.log(`  [${post.id}] "${post.title}"`);
    const fields = Object.keys(update);
    console.log(`    Fields: ${fields.join(", ")}`);
    if (update.titleEn) console.log(`    titleEn: ${update.titleEn}`);
    if (update.titleRu) console.log(`    titleRu: ${update.titleRu}`);
    if (update.contentEn) console.log(`    contentEn: ${update.contentEn.length} chars`);
    if (update.contentRu) console.log(`    contentRu: ${update.contentRu.length} chars`);
  }

  console.log("\nPress Enter to continue, or Ctrl+C to abort...");
  await waitForEnter();

  let updated = 0;
  let failed = 0;

  for (const { post, update } of toUpdate) {
    try {
      await db.collection("blogPosts").doc(post.id).update(update);
      console.log(`✅ Updated: "${post.title}"`);
      updated++;
    } catch (err) {
      console.error(`❌ Failed: "${post.title}" (${post.id}) — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", resolve);
    process.stdin.resume();
  });
}

importBlogTranslations().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
