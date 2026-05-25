// scripts/export-translations.js
// READ-ONLY — reads all products from Firestore and writes products-translations.json
// Run: node scripts/export-translations.js

import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportTranslations() {
  console.log("Reading products from Firestore...");
  const snapshot = await getDocs(collection(db, "products"));

  const products = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    products.push({
      id: doc.id,
      // Georgian originals (read-only, do not edit these)
      name: d.name || "",
      description: d.description || "",
      // English translations (fill these in)
      nameEn: d.nameEn || "",
      descriptionEn: d.descriptionEn || "",
      // Russian translations (fill these in)
      nameRu: d.nameRu || "",
      descriptionRu: d.descriptionRu || "",
    });
  });

  // Sort alphabetically by Georgian name for easier editing
  products.sort((a, b) => a.name.localeCompare(b.name, "ka"));

  const outputPath = "products-translations.json";
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), "utf8");

  console.log(`✅ Exported ${products.length} products to ${outputPath}`);
  console.log("Fill in nameEn, descriptionEn, nameRu, descriptionRu fields.");
  console.log("Then run: node scripts/import-translations.js");

  process.exit(0);
}

exportTranslations().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
