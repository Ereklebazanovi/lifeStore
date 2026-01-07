// Test endpoint to manually trigger callback functionality
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderNumber } = req.body;

  if (!orderNumber) {
    return res.status(400).json({ error: "orderNumber is required" });
  }

  try {
    console.log(`🧪 Testing callback for order: ${orderNumber}`);

    // Find the order by orderNumber
    const ordersSnapshot = await adminDb.collection("orders")
      .where("orderNumber", "==", orderNumber)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderDoc = ordersSnapshot.docs[0];
    const orderData = orderDoc.data();

    console.log(`📋 Found order: ${orderNumber}`, orderData);

    // Update order status to paid
    await orderDoc.ref.update({
      paymentStatus: "paid",
      orderStatus: "confirmed",
      paidAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Order ${orderNumber} marked as paid`);

    // Send test emails
    await adminDb.collection("mail").add({
      to: [orderData.customerInfo.email],
      message: {
        subject: `✅ TEST - შეკვეთა დადასტურებულია - #${orderNumber}`,
        html: `
          <h1>🧪 ტესტ - შეკვეთა დადასტურდა!</h1>
          <p>შეკვეთის ნომერი: ${orderNumber}</p>
          <p>კლიენტი: ${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}</p>
          <p>ეს ტესტ მეილია callback ფუნქციონალობის შესამოწმებლად.</p>
        `
      }
    });

    console.log(`📧 Test email sent for order ${orderNumber}`);

    return res.status(200).json({
      success: true,
      message: `Order ${orderNumber} status updated and test email sent`,
      orderData: {
        id: orderDoc.id,
        orderNumber: orderData.orderNumber,
        paymentStatus: "paid",
        orderStatus: "confirmed"
      }
    });

  } catch (error) {
    console.error("❌ Test callback error:", error);
    return res.status(500).json({ error: error.message });
  }
}