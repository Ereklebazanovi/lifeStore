import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as cors from "cors";
import * as admin from "firebase-admin";
import axios from "axios";
import * as crypto from "crypto";

if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHandler = cors({ origin: true, credentials: true });

// ესენი სწორია (შენი ბოლო ლოგებიდან)
const FLITT_MERCHANT_ID = 4055351;
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
// URL-ის ბოლოში "/" არ უნდა იყოს!
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url";

// ✅ დინამიური ხელმოწერა (ყველაზე სანდო მეთოდი)
function generateSignature(params: any, secretKey: string): string {
  // 1. ვიღებთ ყველა ველს
  const activeKeys = Object.keys(params).filter(
    (key) => key !== "signature" && params[key]
  );

  // 2. სორტირება ანბანის მიხედვით (A-Z)
  activeKeys.sort();

  // 3. მნიშვნელობების აღება სტრინგებად
  const values = activeKeys.map((key) => String(params[key]));

  // 4. Secret Key ემატება თავში (Start)
  values.unshift(secretKey);

  // 5. გაერთიანება
  const signatureString = values.join("|");

  console.log("🔐 FINAL SIGNING STRING:", signatureString);

  return crypto.createHash("sha1").update(signatureString).digest("hex");
}

export const createPayment = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    return corsHandler(request, response, async () => {
      try {
        const { orderId, amount, description } = request.body;

        // თანხა თეთრებში (მაგ: 1.00 GEL = 100)
        const amountInKopecks = Math.round(amount * 100);
        const cleanDesc = (description || `Order ${orderId}`).replace(
          /[^a-zA-Z0-9 -]/g,
          ""
        );

        // ✅ სუპერ-მინიმალისტური ობიექტი.
        // ამოვიღე "version", "response_url", "email".
        // ვტოვებთ მხოლოდ იმ 5 პარამეტრს, რაც სასიცოცხლოდ აუცილებელია.
        const requestParams: any = {
          amount: amountInKopecks, // Number
          currency: "GEL",
          merchant_id: FLITT_MERCHANT_ID, // Number
          order_desc: cleanDesc,
          order_id: String(orderId),
          server_callback_url:
            "https://europe-west1-lifestore-5d2b7.cloudfunctions.net/paymentCallback",
        };

        // Signature გენერაცია (ავტომატურად აიღებს ამ 6 ველს)
        const signature = generateSignature(requestParams, FLITT_SECRET_KEY);

        const requestBody = {
          request: {
            ...requestParams,
            signature: signature,
          },
        };

        logger.info("🚀 Sending Minimal Request:", JSON.stringify(requestBody));

        const apiResponse = await axios.post(FLITT_API_URL, requestBody);

        const responseBody = apiResponse.data.response;

        if (responseBody?.response_status === "success") {
          response.status(200).json({
            success: true,
            checkoutUrl: responseBody.checkout_url,
            paymentId: responseBody.payment_id,
          });
        } else {
          logger.error("❌ Flitt Error:", responseBody);
          // შეცდომის დეტალური დაბრუნება, რომ ფრონტზეც გამოჩნდეს
          response.status(400).json({
            success: false,
            error: responseBody?.error_message,
            details: responseBody,
          });
        }
      } catch (error: any) {
        logger.error("🔥 System Error:", error.message);
        response.status(500).json({ error: "Internal Error" });
      }
    });
  }
);

// Callback (ეს გვჭირდება რომ Order ID დავაფიქსიროთ)
export const paymentCallback = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    logger.info("✅ Payment Callback Received:", request.body);
    response.status(200).send("OK");
  }
);
export const getPaymentStatus = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    response.status(200).json({ status: "pending" });
  }
);
