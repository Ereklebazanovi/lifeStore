import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as cors from "cors";
import * as admin from "firebase-admin";
import axios from "axios";
import * as crypto from "crypto";

// ინიციალიზაცია
if (!admin.apps.length) {
  admin.initializeApp();
}

// CORS (უსაფრთხოება)
const corsHandler = cors({
  origin: true,
  credentials: true,
});

// კონფიგურაცია
const FLITT_MERCHANT_ID = 4055351;
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url";

// ✅ სწორი, დინამიური ხელმოწერის ფუნქცია
function generateSignature(params: any, secretKey: string): string {
  // 1. ვიღებთ ყველა ველს (გარდა signature-ისა და ცარიელი ველებისა)
  const activeKeys = Object.keys(params).filter(
    (key) =>
      key !== "signature" &&
      params[key] !== null &&
      params[key] !== undefined &&
      String(params[key]).trim() !== ""
  );

  // 2. ⚠️ სორტირება ანბანის მიხედვით (A-Z) - ეს აუცილებელია!
  // ეს ავტომატურად დაალაგებს: amount, currency, merchant_id, order_desc, order_id, response_url, server_callback_url, version
  activeKeys.sort();

  // 3. ვიღებთ მნიშვნელობებს (ყველაფერს ვაქცევთ სტრინგად)
  const values = activeKeys.map((key) => String(params[key]));

  // 4. Secret Key ემატება თავში (Start) - PHP-ის array_unshift-ის ანალოგი
  values.unshift(secretKey);

  // 5. გაერთიანება | სიმბოლოთი
  const signatureString = values.join("|");

  console.log("🔐 FINAL SIGNING STRING:", signatureString);

  // 6. SHA1 ჰეშირება
  return crypto.createHash("sha1").update(signatureString).digest("hex");
}

export const createPayment = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    return corsHandler(request, response, async () => {
      try {
        if (request.method !== "POST") {
          response.status(405).json({ error: "Method not allowed" });
          return;
        }

        const { orderId, amount, customerEmail, description } = request.body;

        if (!orderId || !amount) {
          response.status(400).json({ error: "Missing required fields" });
          return;
        }

        const amountInKopecks = Math.round(amount * 100);
        // აღწერის გასუფთავება სპეც. სიმბოლოებისგან
        const cleanDesc = (description || `Order ${orderId}`).replace(
          /[^a-zA-Z0-9 -]/g,
          ""
        );

        // ✅ ვამზადებთ ობიექტს ყველა საჭირო ველით.
        // რადგან generateSignature ფუნქცია დინამიურია, ის აქ ჩაწერილ ყველა ველს
        // (version-საც და response_url-საც) ავტომატურად ჩასვამს ხელმოწერაში.
        const requestParams: any = {
          version: "1.0.1",
          order_id: String(orderId),
          merchant_id: FLITT_MERCHANT_ID, // JSON-ში წავა როგორც Number
          order_desc: cleanDesc,
          amount: amountInKopecks, // JSON-ში წავა როგორც Number
          currency: "GEL",
          server_callback_url:
            "https://europe-west1-lifestore-5d2b7.cloudfunctions.net/paymentCallback",
          response_url: "https://lifestore.ge/payment/success",
        };

        // Email-ს ვამატებთ მხოლოდ თუ მომხმარებელმა შეიყვანა (და არ არის ცარიელი)
        if (customerEmail && customerEmail.trim() !== "") {
          requestParams.sender_email = customerEmail;
        }

        // 1. ვაგენერირებთ ხელმოწერას ამ ობიექტზე
        // ფუნქცია თავისით აიღებს ყველა ველს ზემოთ შექმნილი ობიექტიდან
        const signature = generateSignature(requestParams, FLITT_SECRET_KEY);

        // 2. ვამზადებთ საბოლოო გასაგზავნ მონაცემებს
        const requestBody = {
          request: {
            ...requestParams,
            signature: signature,
          },
        };

        logger.info("🚀 Sending Request:", JSON.stringify(requestBody));

        // 3. ვაგზავნით მოთხოვნას
        const apiResponse = await axios.post(FLITT_API_URL, requestBody);

        logger.info("📩 Flitt Response:", apiResponse.data);

        const responseBody = apiResponse.data.response;

        if (responseBody && responseBody.response_status === "success") {
          response.status(200).json({
            success: true,
            checkoutUrl: responseBody.checkout_url,
            paymentId: responseBody.payment_id,
          });
        } else {
          logger.error("❌ Flitt Payment Failed:", responseBody);
          response.status(400).json({
            success: false,
            error: responseBody?.error_message || "Payment failed",
            errorCode: responseBody?.error_code,
            details: responseBody,
          });
        }
      } catch (error: any) {
        logger.error("🔥 System Error:", error.response?.data || error.message);
        response.status(500).json({
          success: false,
          error: "Internal server error",
        });
      }
    });
  }
);

// Callback ფუნქცია (Flitt-დან სტატუსის მისაღებად)
export const paymentCallback = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    logger.info("Callback received:", request.body);
    response.status(200).send("OK");
  }
);

// სტატუსის შემოწმების ფუნქცია (Frontend-ისთვის)
export const getPaymentStatus = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    response.status(200).json({ status: "pending" });
  }
);
