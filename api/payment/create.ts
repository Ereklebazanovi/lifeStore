import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Flitt Configuration - Environment variables only for security
const FLITT_SECRET_KEY = process.env.FLITT_SECRET_KEY;
const FLITT_MERCHANT_ID = process.env.FLITT_MERCHANT_ID;
const FLITT_CALLBACK_URL = process.env.FLITT_CALLBACK_URL || "https://lifestore.ge/api/payment/callback";

// Validate required environment variables
if (!FLITT_SECRET_KEY || !FLITT_MERCHANT_ID) {
  console.error("❌ Required Flitt environment variables not set!");
  console.error("Missing:", {
    FLITT_SECRET_KEY: !FLITT_SECRET_KEY,
    FLITT_MERCHANT_ID: !FLITT_MERCHANT_ID
  });
  throw new Error("Missing required Flitt environment variables");
} 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
//
  try {
    const { orderId, amount, description } = req.body; // email ამოვიღეთ აქედანაც

    if (!orderId || !amount) return res.status(400).json({ error: "Missing required fields" });

    const amountInKopecks = Math.round(amount * 100);
    // Description-ს ვასუფთავებთ სფეისებისგან, როგორც ლოკალურ ტესტში
    const cleanDesc = (description || "Order").replace(/[^a-zA-Z0-9]/g, "") || "Order";

    // 1. სტრიქონის აწყობა (ზუსტად ისე, როგორც test-flitt.cjs-ში!)
    // თანმიმდევრობა: Secret | Amount | Currency | MerchID | Desc | OrderID | Callback
    // ❌ Sender Email აქ არ არის!
    const rawString = [
      FLITT_SECRET_KEY,
      amountInKopecks,
      "GEL",
      FLITT_MERCHANT_ID,
      cleanDesc,
      String(orderId),
      FLITT_CALLBACK_URL
    ].join("|");

    console.log("🔐 Signing String:", rawString);

    // 2. ჰეშირება
    const signature = createHash("sha1").update(rawString).digest("hex");

    // 3. რექვესთის მომზადება
    // ❌ Sender Email-ს არც აქ ვსვამთ! რომ 100% დაემთხვეს ხელმოწერას.
    const requestBody = {
      request: {
        amount: amountInKopecks,
        currency: "GEL",
        merchant_id: Number(FLITT_MERCHANT_ID),
        order_desc: cleanDesc,
        order_id: String(orderId),
        server_callback_url: FLITT_CALLBACK_URL,
        signature: signature
      },
    };

    console.log("🚀 Sending to Flitt:", JSON.stringify(requestBody));

    const response = await fetch("https://pay.flitt.com/api/checkout/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data: any = await response.json();
    console.log("📩 Flitt Response:", data);

    if (data.response?.response_status === "success") {
      return res.status(200).json({
        success: true,
        checkoutUrl: data.response.checkout_url,
        paymentId: data.response.payment_id,
      });
    } else {
      console.error("❌ Flitt Error:", data);
      return res.status(400).json({
        success: false,
        error: data.response?.error_message || "Payment Failed",
        details: data.response,
      });
    }

  } catch (error: any) {
    console.error("🔥 Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}