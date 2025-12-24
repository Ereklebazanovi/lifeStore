import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ⚠️ შეამოწმე, რომ ეს 100% ემთხვევა პორტალს
const MERCH_ID = "4055351";
const SECRET = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
const CALLBACK = "https://lifestore.ge/api/payment/callback"; // ეს უნდა იყოს პორტალზეც!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { orderId, amount } = req.body;
    const amountInt = Math.round(amount * 100);

    // 🛑 HARDCODED აღწერა, რომ სფეისებმა არ აურიოს
    const desc = "Order123";

    // 1. ვაგროვებთ მონაცემებს (ანბანის მიხედვით!)
    // Flitt ითხოვს: amount, currency, merchant_id, order_desc, order_id, server_callback_url
    // თანმიმდევრობა (A-Z):
    // 1. amount
    // 2. currency
    // 3. merchant_id
    // 4. order_desc
    // 5. order_id
    // 6. server_callback_url

    const rawString = [
      SECRET, // პაროლი თავში
      amountInt, // amount
      "GEL", // currency
      MERCH_ID, // merchant_id
      desc, // order_desc
      orderId, // order_id
      CALLBACK, // server_callback_url
    ].join("|");

    console.log("🔐 Signing String:", rawString);

    const signature = createHash("sha1").update(rawString).digest("hex");

    const requestBody = {
      request: {
        amount: amountInt,
        currency: "GEL",
        merchant_id: MERCH_ID,
        order_desc: desc,
        order_id: String(orderId),
        server_callback_url: CALLBACK, // ესეც იგზავნება!
        signature: signature,
      },
    };

    console.log("🚀 Sending:", JSON.stringify(requestBody));

    const apiRes = await fetch("https://pay.flitt.com/api/checkout/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data: any = await apiRes.json();
    console.log("📩 Response:", data);

    if (data.response?.response_status === "success") {
      res.status(200).json({
        success: true,
        checkoutUrl: data.response.checkout_url,
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.response?.error_message,
        details: data.response,
      });
    }
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
