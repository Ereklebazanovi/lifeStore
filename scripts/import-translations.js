// scripts/import-translations.js
// Uses Firebase Admin SDK (serviceAccount.json) to write translation fields.
// Never touches: name, price, stock, images, category, description (Georgian).
// Run: node scripts/import-translations.js

import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";

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

async function importTranslations() {
  const inputPath = "products-translations.json";

  if (!existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    console.error("Run export first: node scripts/export-translations.js");
    process.exit(1);
  }

  const products = JSON.parse(readFileSync(inputPath, "utf8"));

  const toUpdate = products.filter(
    (p) => p.nameEn?.trim() || p.nameRu?.trim()
  );

  if (toUpdate.length === 0) {
    console.log("⚠️  No translations to import (all nameEn and nameRu are empty).");
    process.exit(0);
  }

  console.log(`\nAbout to update ${toUpdate.length} of ${products.length} products:`);
  toUpdate.forEach((p) => {
    console.log(`  [${p.id}] ${p.name}`);
    if (p.nameEn) console.log(`    EN: ${p.nameEn}`);
    if (p.nameRu) console.log(`    RU: ${p.nameRu}`);
  });

  console.log("\nPress Enter to continue, or Ctrl+C to abort...");
  await waitForEnter();

  let updated = 0;
  let failed = 0;

  for (const product of toUpdate) {
    try {
      const update = {};
      if (product.nameEn !== undefined) update.nameEn = product.nameEn.trim();
      if (product.descriptionEn !== undefined) update.descriptionEn = product.descriptionEn.trim();
      if (product.nameRu !== undefined) update.nameRu = product.nameRu.trim();
      if (product.descriptionRu !== undefined) update.descriptionRu = product.descriptionRu.trim();

      await db.collection("products").doc(product.id).update(update);
      console.log(`✅ Updated: ${product.name}`);
      updated++;
    } catch (err) {
      console.error(`❌ Failed: ${product.name} (${product.id}) — ${err.message}`);
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

importTranslations().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
