import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ✅ შესწორებული გასაღები (დიდი I-თი და არა L-ით)
const SECRET = "hP3gV40vV3yhKM2EUeRK1IOrEoTvvhwu"; 
const MERCH_ID = "4055351";
const CALLBACK_URL = "https://lifestore.ge/api/payment/callback"; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount, customerEmail, description } = req.body;

    if (!orderId || !amount) return res.status(400).json({ error: "Missing required fields" });

    const amountInKopecks = Math.round(amount * 100);
    // აღწერის გასუფთავება (სფეისების გარეშე ჯობია, ან რაც ტესტში იმუშავა ის დავტოვოთ)
    const cleanDesc = (description || "Order").replace(/[^a-zA-Z0-9]/g, "") || "Order";

    // 1. სტრიქონის აწყობა (ზუსტად ისე, როგორც ტესტში იმუშავა!)
    // თანმიმდევრობა: Secret | Amount | Currency | MerchID | Desc | OrderID | Callback
    const rawString = [
      SECRET,
      amountInKopecks,
      "GEL",
      MERCH_ID,
      cleanDesc,
      String(orderId),
      CALLBACK_URL
    ].join("|");

    console.log("🔐 Signing String:", rawString);

    // 2. ჰეშირება
    const signature = createHash("sha1").update(rawString).digest("hex");

    // 3. რექვესთის მომზადება
    const requestBody = {
      request: {
        amount: amountInKopecks,
        currency: "GEL",
        merchant_id: Number(MERCH_ID), // რიცხვი, როგორც ტესტში
        order_desc: cleanDesc,
        order_id: String(orderId),
        server_callback_url: CALLBACK_URL,
        signature: signature,
        // email-ს ვამატებთ მხოლოდ payload-ში, ხელმოწერაში არ მონაწილეობს!
        ...(customerEmail && { sender_email: customerEmail }) 
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