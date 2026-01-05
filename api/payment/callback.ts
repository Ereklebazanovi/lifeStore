// api/payment/callback.ts
import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";
import { OrderService } from "../../src/services/orderService";

// Flitt Configuration - Environment variables only for security
const FLITT_SECRET_KEY = process.env.FLITT_SECRET_KEY;

if (!FLITT_SECRET_KEY) {
  console.error("❌ FLITT_SECRET_KEY environment variable not set!");
  throw new Error("Missing required environment variables");
}

/**
 * Verify Flitt signature according to PHP documentation
 * Same algorithm as in create.ts but for response verification
 */
function verifyFlittSignature(responseData: any, secretKey: string): boolean {
  try {
    const signature = responseData.signature;
    if (!signature) {
      console.log("❌ No signature in response");
      return false;
    }

    // Remove signature and response_signature_string from data for verification
    const dataForVerification = { ...responseData };
    delete dataForVerification.signature;
    delete dataForVerification.response_signature_string;

    // Filter empty values
    const filteredData: Record<string, any> = {};
    Object.keys(dataForVerification).forEach((key) => {
      if (
        dataForVerification[key] !== undefined &&
        dataForVerification[key] !== null &&
        dataForVerification[key] !== ""
      ) {
        filteredData[key] = dataForVerification[key];
      }
    });

    // Sort keys alphabetically
    const sortedKeys = Object.keys(filteredData).sort();
    const sortedValues = sortedKeys.map((key) => String(filteredData[key]));

    // Add secret key at the beginning
    const signatureParams = [secretKey, ...sortedValues];
    const signatureString = signatureParams.join("|");

    // Generate SHA1 hash
    const expectedSignature = createHash("sha1")
      .update(signatureString, "utf8")
      .digest("hex");

    console.log("🔐 Callback Signature Verification:");
    console.log("  📝 Filtered data:", filteredData);
    console.log("  🔤 Sorted keys:", sortedKeys);
    console.log("  📊 Sorted values:", sortedValues);
    console.log("  🔗 Signature string:", signatureString);
    console.log("  ✅ Expected signature:", expectedSignature);
    console.log("  📩 Received signature:", signature);
    console.log("  🎯 Signature match:", expectedSignature === signature);

    return expectedSignature === signature;
  } catch (error) {
    console.error("❌ Error verifying signature:", error);
    return false;
  }
}

/**
 * Update order status in Firestore and send confirmation email if payment successful
 */
async function updateOrderStatus(
  orderId: string,
  isPaymentSuccessful: boolean,
  paymentData: any
): Promise<void> {
  try {
    const orderRef = adminDb.collection("orders").doc(orderId);

    // Check if order exists
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      console.error(`❌ Order ${orderId} not found in database`);
      return;
    }

    const orderData = orderDoc.data();

    // ✅ IDEMPOTENCY CHECK: Prevent duplicate payment processing
    if (isPaymentSuccessful && orderData?.paymentStatus === "paid") {
      console.log(`⚠️ Order ${orderId} already marked as paid. Skipping duplicate processing.`);
      return;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (isPaymentSuccessful) {
      updateData.paymentStatus = "paid";
      updateData.orderStatus = "confirmed";
      updateData.paidAt = new Date();
      console.log(`✅ Order ${orderId} marked as PAID and CONFIRMED`);

      // ✅ NOW SEND EMAIL NOTIFICATION AFTER PAYMENT SUCCESS
      try {
        // Get order details to send email
        const orderData = orderDoc.data();
        if (orderData) {
          // Convert Firestore data to Order object
          const order = {
            id: orderId,
            userId: orderData.userId,
            orderNumber: orderData.orderNumber,
            source: orderData.source,
            items: orderData.items,
            subtotal: orderData.subtotal,
            shippingCost: orderData.shippingCost,
            totalAmount: orderData.totalAmount,
            customerInfo: orderData.customerInfo,
            deliveryInfo: orderData.deliveryInfo,
            orderStatus: "confirmed", // Updated status
            paymentMethod: orderData.paymentMethod,
            paymentStatus: "paid", // Updated status
            createdAt: orderData.createdAt.toDate(),
            updatedAt: new Date(),
            paidAt: new Date(),
          };

          console.log(`📧 Sending order confirmation email for ${orderId}`);
          await OrderService.sendEmailNotification(order);
          console.log(`✅ Email sent successfully for order ${orderId}`);
        }
      } catch (emailError) {
        console.error(`❌ Failed to send email for order ${orderId}:`, emailError);
        // Don't fail the payment process if email fails
      }
    } else {
      updateData.paymentStatus = "failed";
      console.log(`❌ Order ${orderId} marked as PAYMENT FAILED`);
    }

    // Update the order in Firestore
    await orderRef.update(updateData);

    console.log(`🔄 Order ${orderId} updated successfully:`, updateData);
  } catch (error) {
    console.error(`❌ Error updating order ${orderId}:`, error);
  }
}

module.exports = async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Accept both GET and POST requests (TBC uses GET for callbacks)
  if (req.method !== "GET" && req.method !== "POST") {
    console.log(`❌ Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("📞 Flitt Payment Callback Received:");
    console.log(`📋 Method: ${req.method}`);
    console.log("📋 Request body:", JSON.stringify(req.body, null, 2));
    console.log("📋 Query params:", JSON.stringify(req.query, null, 2));
    console.log("📋 Request headers:", JSON.stringify(req.headers, null, 2));

    // Extract response data based on request method
    let responseData;
    if (req.method === "GET") {
      // For GET requests, data is in query parameters
      responseData = req.query;
    } else {
      // For POST requests, data is in body (legacy support)
      responseData = req.body.response || req.body;
    }

    if (!responseData) {
      console.error("❌ No response data received");
      return res.status(400).send("No data received");
    }

    // ✅ CRITICAL: Verify signature to ensure request is from Flitt
    const isSignatureValid = verifyFlittSignature(
      responseData,
      FLITT_SECRET_KEY
    );

    if (!isSignatureValid) {
      console.error(
        "❌ SECURITY: Invalid signature from callback. Possible fraud attempt!"
      );
      console.error("📋 Received data:", responseData);
      // Return OK to avoid retries, but don't process the payment
      return res.status(200).send("OK");
    }

    console.log("✅ Signature verified successfully");

    // Extract payment information
    const {
      order_id: orderId,
      order_status: orderStatus,
      payment_id: paymentId,
      amount,
      currency,
      response_status,
    } = responseData;

    console.log(`📋 Payment Details:`, {
      orderId,
      orderStatus,
      paymentId,
      amount,
      currency,
      response_status,
    });

    // Validate required fields
    if (!orderId) {
      console.error("❌ Missing order_id in callback");
      return res.status(400).send("Missing order_id");
    }

    // Determine if payment was successful
    const isPaymentSuccessful =
      orderStatus === "approved" && response_status === "success";

    if (isPaymentSuccessful) {
      console.log(`✅ Payment APPROVED for order ${orderId}`, {
        paymentId,
        amount,
        currency,
      });
    } else {
      console.log(`❌ Payment FAILED for order ${orderId}`, {
        orderStatus,
        response_status,
        paymentId,
      });
    }

    // ✅ Update order status in Firestore
    await updateOrderStatus(orderId, isPaymentSuccessful, responseData);

    // Always respond with 200 OK to acknowledge receipt
    console.log(`📤 Sending OK response to Flitt for order ${orderId}`);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error processing payment callback:", error);
    // Still return OK to avoid infinite retries from Flitt
    return res.status(200).send("OK");
  }
};
