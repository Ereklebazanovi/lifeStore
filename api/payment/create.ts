import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const FLITT_MERCHANT_ID = 4055351; // ⚠️ შევცვალე რიცხვად (Number)!
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url";
const CALLBACK_URL = "https://lifestore.ge/api/payment/callback";

function generateSignature(params: any, secretKey: string): string {
  // 1. ვიღებთ ველებს (signature-ის გარეშე)
  const activeKeys = Object.keys(params).filter(
    (key) =>
      key !== "signature" && params[key] !== undefined && params[key] !== ""
  );

  // 2. სორტირება (A-Z)
  activeKeys.sort();

  // 3. მნიშვნელობები
  const values = activeKeys.map((key) => String(params[key]));

  // 4. Secret Key თავში
  values.unshift(secretKey.trim());

  // 5. გაერთიანება
  const signatureString = values.join("|");

  console.log("🔐 Signing String:", signatureString);

  // 6. SHA1
  return createHash("sha1").update(signatureString).digest("hex");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount, customerEmail } = req.body; // description ამოვიღე დროებით

    if (!orderId || !amount)
      return res.status(400).json({ error: "Missing required fields" });

    const amountInKopecks = Math.round(amount * 100);

    // ⚠️ HARDCODE: სფეისების და სიმბოლოების გარეშე
    const simpleDesc = "TestOrder";

    const requestParams: any = {
      amount: amountInKopecks,
      currency: "GEL",
      merchant_id: FLITT_MERCHANT_ID, // Number
      order_desc: simpleDesc, // უსაფრთხო სტრინგი
      order_id: String(orderId),
      server_callback_url: CALLBACK_URL,
    };

    if (customerEmail) {
      requestParams.sender_email = customerEmail;
    }

    const signature = generateSignature(requestParams, FLITT_SECRET_KEY);

    const requestBody = {
      request: {
        ...requestParams,
        signature: signature,
      },
    };

    console.log("🚀 Sending FIXED request:", JSON.stringify(requestBody));

    const response = await fetch(FLITT_API_URL, {
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
