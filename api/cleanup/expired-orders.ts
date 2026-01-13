// api/cleanup/expired-orders.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // 1. Diagnostics
  console.log("🔍 Request Method:", req.method);
  console.log("🔍 User-Agent:", req.headers["user-agent"]);

  // 2. Allow GET & POST
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // 3. Auth Check
  const isCronHeader = req.headers["vercel-cron"] === "1";
  const isCronAgent = req.headers["user-agent"]?.includes("vercel-cron");
  const isVercelCron = isCronHeader || isCronAgent;

  if (!isVercelCron) {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.CLEANUP_SECRET_TOKEN;
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      console.error("❌ Auth failed.");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  try {
    console.log("🧹 Starting expired orders cleanup...");

    // ✅ Production Time: 15 minutes - optimal for ecommerce
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 15);

    const pendingOrdersQuery = adminDb
      .collection("orders")
      .where("paymentStatus", "==", "pending")
      .limit(100);

    const pendingOrdersSnapshot = await pendingOrdersQuery.get();

    if (pendingOrdersSnapshot.empty) {
      console.log("✅ No pending orders found");
      res.status(200).json({ success: true, processedCount: 0 });
      return;
    }

    const expiredOrders = pendingOrdersSnapshot.docs.filter((doc) => {
      const orderData = doc.data();
      if (!orderData.createdAt) return false;
      return orderData.createdAt.toDate() <= cutoffTime;
    });

    if (expiredOrders.length === 0) {
      console.log("✅ No expired orders found");
      res.status(200).json({ success: true, processedCount: 0 });
      return;
    }

    console.log(`🔍 Found ${expiredOrders.length} expired orders`);

    let processedCount = 0;
    let errorCount = 0;

    for (const orderDoc of expiredOrders) {
      try {
        const orderData = orderDoc.data();
        console.log(`🗑️ Processing: ${orderData.orderNumber} (${orderDoc.id})`);

        const batch = adminDb.batch();

        // 1. Update order status with detailed reason
        batch.update(orderDoc.ref, {
          paymentStatus: "cancelled",
          status: "cancelled",
          orderStatus: "cancelled",
          cancellationReason: "ავტომატურად გაუქმდა - 15 წუთის განმავლობაში გადახდა არ მოხდა",
          cancelledAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          adminNotes: `შეკვეთა ავტომატურად გაუქმდა ${new Date().toLocaleString("ka-GE")} - კლიენტმა 15 წუთში არ დაასრულა გადახდის პროცესი.ამ პროდუქტის მარაგი ავტომატურად დაბრუნდა.`,
        });

        // 2. Restore Inventory (GROUPING LOGIC ✅)
        if (orderData.items && Array.isArray(orderData.items)) {

          // ნაბიჯი A: დავაჯგუფოთ ნივთები, რომ ვარიანტები არ აირიოს
          const itemsByProduct: { [key: string]: any[] } = {};

          for (const item of orderData.items) {
            if (!item.productId || item.productId.startsWith("manual_")) continue;
            if (!itemsByProduct[item.productId]) {
              itemsByProduct[item.productId] = [];
            }
            itemsByProduct[item.productId].push(item);
          }

          // ნაბიჯი B: თითოეული პროდუქტის განახლება
          for (const [productId, items] of Object.entries(itemsByProduct)) {
            const productRef = adminDb.collection("products").doc(productId);
            const productDoc = await productRef.get();

            if (!productDoc.exists) continue;

            const productData = productDoc.data();
            let totalQuantityRestored = 0;
            let variantsUpdated = false;

            // ვარიანტების მასივის კოპირება
            const variants = productData?.variants ? [...productData.variants] : [];

            for (const item of items) {
              totalQuantityRestored += item.quantity;

              if (item.variantId && variants.length > 0) {
                const variantIndex = variants.findIndex((v: any) => v.id === item.variantId);
                if (variantIndex !== -1) {
                  // ვაბრუნებთ მარაგს კონკრეტულ ვარიანტში
                  variants[variantIndex].stock = (variants[variantIndex].stock || 0) + item.quantity;
                  variantsUpdated = true;
                  console.log(`📦 Variant restored: ${item.productId} / ${item.variantId} (+${item.quantity})`);
                }
              }
            }

            // ნაბიჯი C: Batch Update
            const updatePayload: any = {
              // ⚠️ აქ ვიყენებთ INCREMENT-ს და არა პირდაპირ რიცხვს (უსაფრთხოებისთვის)
              stock: FieldValue.increment(totalQuantityRestored),
              totalStock: FieldValue.increment(totalQuantityRestored),
              updatedAt: FieldValue.serverTimestamp(),
            };

            // ვარიანტებს ვანახლებთ მთლიანი მასივით
            if (variantsUpdated) {
              updatePayload.variants = variants;
            }

            batch.update(productRef, updatePayload);
            console.log(`📦 Product restored: ${productId} (Total +${totalQuantityRestored})`);
          }
        }

        await batch.commit();
        processedCount++;
      } catch (err) {
        console.error(`❌ Error on order ${orderDoc.id}:`, err);
        errorCount++;
      }
    }

    console.log(`🧹 Done. Processed: ${processedCount}, Errors: ${errorCount}`);
    res.status(200).json({ success: true, processedCount, errorCount });

  } catch (error) {
    console.error("❌ Fatal Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}