// api/cleanup/expired-orders.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Serverless function to clean up expired orders
 * This function should be called periodically (every 5-10 minutes) via cron job
 * It finds orders that are older than 30 minutes and still pending, then cancels them
 * and restores the inventory.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Allow POST requests (for manual triggers) and cron requests from Vercel
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if this is a Vercel cron request or manual trigger
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
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    console.log("🧹 Starting expired orders cleanup...");

    // Calculate cutoff time (30 minutes ago)
    // const cutoffTime = new Date();
    // cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);

    // ✅ შეცვალე ამით (დროებით):
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 1); // 1 წუთი

    // Find all pending orders (filter by time in code to avoid index requirement)
    const pendingOrdersQuery = adminDb
      .collection("orders")
      .where("paymentStatus", "==", "pending")
      .limit(100); // Get more since we'll filter in code

    const pendingOrdersSnapshot = await pendingOrdersQuery.get();

    if (pendingOrdersSnapshot.empty) {
      console.log("✅ No pending orders found");
      return res.status(200).json({
        success: true,
        message: "No pending orders to clean up",
        processedCount: 0,
      });
    }

    // Filter expired orders in code (older than 30 minutes)
    const expiredOrders = pendingOrdersSnapshot.docs.filter((doc) => {
      const orderData = doc.data();
      const createdAt = orderData.createdAt.toDate();
      return createdAt <= cutoffTime;
    });

    if (expiredOrders.length === 0) {
      console.log("✅ No expired orders found (all pending orders are recent)");
      return res.status(200).json({
        success: true,
        message: "No expired orders to clean up",
        processedCount: 0,
      });
    }

    console.log(
      `🔍 Found ${expiredOrders.length} expired orders to process (out of ${pendingOrdersSnapshot.size} pending)`
    );

    let processedCount = 0;
    let errorCount = 0;

    // Process each expired order
    for (const orderDoc of expiredOrders) {
      try {
        const orderData = orderDoc.data();
        const orderId = orderDoc.id;

        console.log(
          `🗑️ Processing expired order: ${orderData.orderNumber} (${orderId})`
        );

        // Create batch for atomic operations
        const batch = adminDb.batch();

        // 1. Update order status to cancelled
        batch.update(orderDoc.ref, {
          paymentStatus: "cancelled",
          status: "cancelled",
          cancellationReason: "Automatic cleanup - expired after 30 minutes",
          cancelledAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 2. Restore inventory for each item (including variants)
        if (orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            const productRef = adminDb
              .collection("products")
              .doc(item.productId);

            // Check if this item has a variant
            if (item.variantId) {
              // For variants, we need to read first, then update the specific variant
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
                    variants[variantIndex].stock =
                      (variants[variantIndex].stock || 0) + item.quantity;

                    batch.update(productRef, {
                      variants: variants, // Updated variants array
                      stock: FieldValue.increment(item.quantity), // And general stock too
                      updatedAt: FieldValue.serverTimestamp(),
                    });

                    console.log(
                      `📦 Restoring ${item.quantity} units to product ${item.productId} variant ${item.variantId}`
                    );
                  } else {
                    console.warn(
                      `⚠️ Variant ${item.variantId} not found in product ${item.productId}`
                    );
                  }
                } else {
                  console.warn(
                    `⚠️ No variants found in product ${item.productId}`
                  );
                }
              } else {
                console.warn(`⚠️ Product ${item.productId} not found`);
              }
            } else {
              // For simple products (no variants)
              batch.update(productRef, {
                stock: FieldValue.increment(item.quantity),
                updatedAt: FieldValue.serverTimestamp(),
              });

              console.log(
                `📦 Restoring ${item.quantity} units to product ${item.productId}`
              );
            }
          }
        }

        // Commit the batch
        await batch.commit();
        processedCount++;

        console.log(
          `✅ Successfully cleaned up order: ${orderData.orderNumber}`
        );
      } catch (orderError) {
        console.error(`❌ Error processing order ${orderDoc.id}:`, orderError);
        errorCount++;
      }
    }

    console.log(
      `🧹 Cleanup completed: ${processedCount} orders processed, ${errorCount} errors`
    );

    return res.status(200).json({
      success: true,
      message: "Expired orders cleanup completed",
      processedCount,
      errorCount,
      totalFound: expiredOrders.length,
    });
  } catch (error) {
    console.error("❌ Error during expired orders cleanup:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during cleanup",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
