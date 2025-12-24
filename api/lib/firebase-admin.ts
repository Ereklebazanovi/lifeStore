// api/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Initialize Firebase Admin SDK for server-side operations
 * Uses environment variables for configuration
 */

let adminApp: any;

if (!getApps().length) {
  try {
    // Get Firebase Admin configuration from environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (
      !privateKey ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !process.env.FIREBASE_PROJECT_ID
    ) {
      throw new Error("Missing Firebase Admin environment variables");
    }

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });

    console.log("🔥 Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

// Export Firestore instance for server-side operations
export const adminDb = getFirestore(adminApp);

export default adminApp;
