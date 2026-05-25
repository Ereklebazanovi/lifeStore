// scripts/export-blog-translations.js
// READ-ONLY — reads all blog posts from Firestore (Admin SDK) and creates translation files.
//
// Output:
//   blog-translations/metadata.json          — title, excerpt, tags (fill EN/RU here)
//   blog-translations/content/[slug]-ka.html — original Georgian HTML (reference, do NOT edit)
//   blog-translations/content/[slug]-en.html — English HTML translation (fill in)
//   blog-translations/content/[slug]-ru.html — Russian HTML translation (fill in)
//
// Run: node scripts/export-blog-translations.js

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);

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

async function exportBlogTranslations() {
  console.log("Reading blog posts from Firestore...");
  const snapshot = await db.collection("blogPosts").get();

  const contentDir = path.join("blog-translations", "content");
  mkdirSync(contentDir, { recursive: true });

  const metadata = [];

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const slug = d.slug || docSnap.id;

    metadata.push({
      id: docSnap.id,
      slug,
      // Georgian originals (read-only, do not edit)
      title: d.title || "",
      excerpt: d.excerpt || "",
      tags: d.tags || [],
      // English translations (fill these in)
      titleEn: d.titleEn || "",
      excerptEn: d.excerptEn || "",
      // Russian translations (fill these in)
      titleRu: d.titleRu || "",
      excerptRu: d.excerptRu || "",
    });

    // Georgian HTML — always overwrite with latest from Firestore
    writeFileSync(path.join(contentDir, `${slug}-ka.html`), d.content || "", "utf8");

    // EN/RU — keep existing if already filled
    const enPath = path.join(contentDir, `${slug}-en.html`);
    if (!existsSync(enPath)) {
      writeFileSync(enPath, d.contentEn || "", "utf8");
    }

    const ruPath = path.join(contentDir, `${slug}-ru.html`);
    if (!existsSync(ruPath)) {
      writeFileSync(ruPath, d.contentRu || "", "utf8");
    }
  });

  metadata.sort((a, b) => a.title.localeCompare(b.title, "ka"));

  writeFileSync(
    path.join("blog-translations", "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  console.log(`\n✅ Exported ${metadata.length} blog posts`);
  console.log(`\nFiles created in blog-translations/:`);
  metadata.forEach((p) => console.log(`  [${p.slug}] ${p.title}`));
  console.log(`\nNext steps:`);
  console.log(`  1. Edit blog-translations/metadata.json — fill titleEn, excerptEn, titleRu, excerptRu`);
  console.log(`  2. For each post: open [slug]-ka.html (original), translate, save to [slug]-en.html and [slug]-ru.html`);
  console.log(`  3. Run: node scripts/import-blog-translations.js`);

  process.exit(0);
}

exportBlogTranslations().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
