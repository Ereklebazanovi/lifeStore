import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "./lib/firebase-admin";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const snap = await adminDb.collection("products").limit(3).get();
    const result = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        allFields: Object.keys(data).sort(),
        slug: data.slug ?? "UNDEFINED",
        slugViaGet: doc.get("slug") ?? "UNDEFINED",
        name: data.name,
      };
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ count: snap.size, docs: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
