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

const FLITT_MERCHANT_ID = 4055351;
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
// URL-ის ბოლოში არ უნდა იყოს "/"
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url";

// ✅ დინამიური ხელმოწერა (შეცდომის დაშვების შანსი 0-ია)
function generateSignature(params: any, secretKey: string): string {
  // 1. ვიღებთ ყველა ველს, რასაც ვაგზავნით (signature-ის გარეშე)
  const activeKeys = Object.keys(params).filter(
    (key) => key !== "signature" && params[key]
  );

  // 2. სორტირება ანბანის მიხედვით (A-Z) - ეს უმნიშვნელოვანესია!
  activeKeys.sort();

  // 3. მნიშვნელობების აღება
  const values = activeKeys.map((key) => String(params[key]));

  // 4. Secret Key თავში (Start)
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
        const amountInKopecks = Math.round(amount * 100);
        const cleanDesc = (description || `Order ${orderId}`).replace(
          /[^a-zA-Z0-9 -]/g,
          ""
        );

        // ✅ ვამზადებთ ობიექტს.
        // აქედან ამოვიღე "version", რადგან დოკუმენტაციის მაგალითში არ არის.
        // თუ მაინც დაგვჭირდა, უბრალოდ აქ დაამატებ და კოდი ავტომატურად მოაწერს ხელს.
        const requestParams: any = {
          order_id: String(orderId),
          merchant_id: FLITT_MERCHANT_ID, // Number
          order_desc: cleanDesc,
          amount: amountInKopecks, // Number
          currency: "GEL",
          server_callback_url:
            "https://europe-west1-lifestore-5d2b7.cloudfunctions.net/paymentCallback",
          response_url: "https://lifestore.ge/payment/success",
        };

        // Signature გენერაცია (ავტომატურად აიღებს ზემოთ ჩამოწერილ ველებს)
        const signature = generateSignature(requestParams, FLITT_SECRET_KEY);

        const requestBody = {
          request: {
            ...requestParams,
            signature: signature,
          },
        };

        logger.info("🚀 Sending Request:", JSON.stringify(requestBody));

        const apiResponse = await axios.post(FLITT_API_URL, requestBody);

        // ლოგირება, თუ რა მოვიდა ბანკიდან
        console.log("📩 Bank Response:", apiResponse.data);

        const responseBody = apiResponse.data.response;

        if (responseBody?.response_status === "success") {
          response.status(200).json({
            success: true,
            checkoutUrl: responseBody.checkout_url,
            paymentId: responseBody.payment_id,
          });
        } else {
          logger.error("❌ Flitt Error:", responseBody);
          response.status(400).json({ success: false, details: responseBody });
        }
      } catch (error: any) {
        logger.error("🔥 System Error:", error.message);
        response.status(500).json({ error: "Internal Error" });
      }
    });
  }
);

// Callback და Status ფუნქციები იგივე რჩება...
export const paymentCallback = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    response.status(200).send("OK");
  }
);
export const getPaymentStatus = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    response.status(200).json({ status: "pending" });
  }
);
