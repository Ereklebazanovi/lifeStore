// api/payment/create.ts
import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// კონფიგურაცია (დროებით Hardcoded, სანამ გატესტავ)
const FLITT_MERCHANT_ID = "4055351";
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url";

/**
 * ✅ სწორი Signature გენერაცია (დინამიური სორტირებით)
 */
function generateSignature(params: any, secretKey: string): string {
  // 1. ვიღებთ მხოლოდ არაცარიელ მნიშვნელობებს და ვფილტრავთ signature-ს
  const activeKeys = Object.keys(params).filter(
    (key) =>
      key !== "signature" && params[key] !== undefined && params[key] !== ""
  );

  // 2. სორტირება ანბანის მიხედვით (A-Z) - აუცილებელია!
  activeKeys.sort();

  // 3. მნიშვნელობების აღება სტრინგებად
  const values = activeKeys.map((key) => String(params[key]));

  // 4. Secret Key ემატება თავში (Start) - ეს არის TPay/Flitt სტანდარტი
  values.unshift(secretKey.trim());

  // 5. გაერთიანება | სიმბოლოთი
  const signatureString = values.join("|");

  console.log("🔐 DETAILED DEBUG:");
  console.log("  📝 Active Keys:", activeKeys);
  console.log("  📊 Values:", values);
  console.log("  🔗 Final String:", signatureString);

  // 6. SHA1 ჰეშირება
  const signature = createHash("sha1").update(signatureString, "utf8").digest("hex");
  console.log("  🔐 Final SHA1:", signature);

  return signature;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers - რომ React-მა შეძლოს დაკავშირება
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*"); // ან 'http://localhost:5173'
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Preflight request-ის დამუშავება
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, amount, customerEmail, description } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountInKopecks = Math.round(amount * 100);
    const cleanDesc = (description || `Order ${orderId}`).replace(
      /[^a-zA-Z0-9 -]/g,
      ""
    );

    // პარამეტრების ობიექტი
    const requestParams: any = {
      version: "1.0.1", // ✅ აუცილებელი!
      amount: amountInKopecks,
      currency: "GEL",
      merchant_id: FLITT_MERCHANT_ID,
      order_desc: cleanDesc,
      order_id: String(orderId),
      // server_callback_url-ს აქ არ ვუთითებთ, თუ Flitt პორტალზე უკვე გაწერილი გაქვს!
      // თუ პორტალზე არ გაქვს, მაშინ დაამატე აქ, მაგრამ ჯობია პორტალზე იყოს.
      // თუ გჭირდება, გააქტიურე ეს ხაზი:
      // server_callback_url: "https://lifestore.ge/api/payment/callback",
    };

    // თუ მეილი არის, ვამატებთ (ხელმოწერამდე!)
    if (customerEmail) {
      requestParams.sender_email = customerEmail;
    }

    // გენერაცია
    const signature = generateSignature(requestParams, FLITT_SECRET_KEY);

    // საბოლოო რექვესთი
    const requestBody = {
      request: {
        ...requestParams,
        signature: signature,
      },
    };

    console.log("🚀 Sending to Flitt:", JSON.stringify(requestBody));

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
