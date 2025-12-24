// Vercel Serverless Function for Flitt Payment Callback
// Receives payment status updates from Flitt and updates Firestore

import type { VercelRequest, VercelResponse } from "@vercel/node";

// Note: For Firestore updates, we'll need Firebase Admin SDK
// For now, just log the callback - implement Firestore later if needed

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "📞 Payment Callback Received:",
      JSON.stringify(req.body, null, 2)
    );

    const {
      order_id: orderId,
      order_status: orderStatus,
      payment_id: paymentId,
      amount,
    } = req.body;

    if (orderStatus === "approved") {
      console.log(`✅ Payment APPROVED for order ${orderId}`, {
        paymentId,
        amount,
      });

      // TODO: Update order status in Firestore
      // For now, just log - can implement Firebase Admin SDK later if needed
    } else if (orderStatus === "declined") {
      console.log(`❌ Payment DECLINED for order ${orderId}`);

      // TODO: Update order status in Firestore
    } else {
      console.log(`ℹ️ Payment status for order ${orderId}: ${orderStatus}`);
    }

    // Always respond with 200 OK to acknowledge receipt
    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error processing payment callback:", error);
    // Still return OK to avoid retries from Flitt
    return res.status(200).send("OK");
  }
}
