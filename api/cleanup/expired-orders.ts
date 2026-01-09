// api/cleanup/expired-orders.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // ✅ შესწორება: დავუშვათ როგორც POST (შენთვის), ისე GET (Vercel Cron-ისთვის)
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Check if this is a Vercel cron request
  const isVercelCron = req.headers["vercel-cron"] === "1";

  if (!isVercelCron) {
    // Manual trigger - check authorization
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.CLEANUP_SECRET_TOKEN;

    if (
      !authHeader ||
      !expectedToken ||
      authHeader !== `Bearer ${expectedToken}`
    ) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  try {
    console.log("🧹 Starting expired orders cleanup...");

    // ✅ დროებით 1 წუთი ტესტირებისთვის (როცა მორჩები, დააბრუნე 30-ზე)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 1); 
    // cutoffTime.setMinutes(cutoffTime.getMinutes() - 30); // Production setting

    // Find all pending orders
    const pendingOrdersQuery = adminDb
      .collection("orders")
      .where("paymentStatus", "==", "pending")
      .limit(100);

    const pendingOrdersSnapshot = await pendingOrdersQuery.get();

    if (pendingOrdersSnapshot.empty) {
      console.log("✅ No pending orders found");
      res.status(200).json({
        success: true,
        message: "No pending orders to clean up",
        processedCount: 0,
      });
      return;
    }

    // Filter expired orders in code
    const expiredOrders = pendingOrdersSnapshot.docs.filter((doc) => {
      const orderData = doc.data();
      // Safety check if createdAt exists
      if (!orderData.createdAt) return false;
      
      const createdAt = orderData.createdAt.toDate();
      return createdAt <= cutoffTime;
    });

    if (expiredOrders.length === 0) {
      console.log("✅ No expired orders found (all pending orders are recent)");
      res.status(200).json({
        success: true,
        message: "No expired orders to clean up",
        processedCount: 0,
      });
      return;
    }

    console.log(
      `🔍 Found ${expiredOrders.length} expired orders to process`
    );

    let processedCount = 0;
    let errorCount = 0;

    for (const orderDoc of expiredOrders) {
      try {
        const orderData = orderDoc.data();
        const orderId = orderDoc.id;

        console.log(
          `🗑️ Processing expired order: ${orderData.orderNumber} (${orderId})`
        );

        const batch = adminDb.batch();

        // 1. Update order status
        batch.update(orderDoc.ref, {
          paymentStatus: "cancelled",
          status: "cancelled",
          orderStatus: "cancelled", // Update both status fields just in case
          cancellationReason: "Automatic cleanup - expired",
          cancelledAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 2. Restore inventory
        if (orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            // Skip manual items or items without ID
            if (!item.productId || item.productId.startsWith("manual_")) continue;

            const productRef = adminDb.collection("products").doc(item.productId);

            if (item.variantId) {
              // Variant logic
              const productDoc = await productRef.get();
              if (productDoc.exists) {
                const productData = productDoc.data();
                if (productData && productData.variants) {
                  const variants = [...productData.variants];
                  const variantIndex = variants.findIndex(
                    (v: any) => v.id === item.variantId
                  );

                  if (variantIndex !== -1) {
                    // Restore variant stock
                    variants[variantIndex].stock = (variants[variantIndex].stock || 0) + item.quantity;
                    variants[variantIndex].updatedAt = new Date(); // Update timestamp

                    batch.update(productRef, {
                      variants: variants,
                      stock: FieldValue.increment(item.quantity),
                      totalStock: FieldValue.increment(item.quantity),
                      updatedAt: FieldValue.serverTimestamp(),
                    });
                    
                    console.log(`📦 Restoring variant stock for ${item.productId}`);
                  }
                }
              }
            } else {
              // Simple product logic
              batch.update(productRef, {
                stock: FieldValue.increment(item.quantity),
                totalStock: FieldValue.increment(item.quantity),
                updatedAt: FieldValue.serverTimestamp(),
              });
              console.log(`📦 Restoring simple stock for ${item.productId}`);
            }
          }
        }

        await batch.commit();
        processedCount++;
      } catch (orderError) {
        console.error(`❌ Error processing order ${orderDoc.id}:`, orderError);
        errorCount++;
      }
    }

    console.log(`🧹 Cleanup completed: ${processedCount} processed`);

    res.status(200).json({
      success: true,
      message: "Cleanup completed",
      processedCount,
      errorCount,
    });
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}