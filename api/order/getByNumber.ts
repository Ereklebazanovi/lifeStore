import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { orderNumber } = req.query;

    if (!orderNumber || typeof orderNumber !== 'string') {
      res.status(400).json({ error: 'Order number is required' });
      return;
    }

    console.log("🔍 Server-side search for order:", orderNumber);

    // Use Firebase Admin to bypass security rules
    const ordersRef = adminDb.collection('orders');
    const querySnapshot = await ordersRef
      .where('orderNumber', '==', orderNumber)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      console.log("❌ No order found with number:", orderNumber);
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // Convert Firestore timestamps to ISO strings
    const order = {
      id: orderDoc.id,
      ...orderData,
      createdAt: orderData.createdAt?.toDate?.()?.toISOString() || orderData.createdAt,
      updatedAt: orderData.updatedAt?.toDate?.()?.toISOString() || orderData.updatedAt,
      paidAt: orderData.paidAt?.toDate?.()?.toISOString() || orderData.paidAt,
    };

    console.log("✅ Server-side order found:", {
      id: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus
    });

    res.status(200).json({ order });

  } catch (error) {
    console.error("❌ Server-side error getting order:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}