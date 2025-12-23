import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as cors from "cors";
import * as admin from "firebase-admin";
import axios from "axios";
import * as crypto from "crypto"; // დაგვჭირდება ხელმოწერისთვის

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// CORS setup
const corsHandler = cors({
  origin: true,
  credentials: true,
});

// ✅ Flitt (TBC Bank) credentials - გადაამოწმე, რომ სწორია!
const FLITT_MERCHANT_ID = "4055351";
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu"; // შენი Payment Key

// ✅ Flitt-ის ოფიციალური API მისამართი
const FLITT_API_URL = "https://api.flitt.com/api/checkout/url/";

// დამხმარე ფუნქცია: ხელმოწერის (Signature) გენერაცია
// Flitt ითხოვს, რომ პარამეტრები დალაგდეს ანბანის მიხედვით და დაემატოს Secret Key
function generateSignature(params: any, secretKey: string): string {
  const orderedKeys = Object.keys(params).sort().filter(key => params[key] !== "" && key !== "signature");
  const values = orderedKeys.map(key => params[key]);
  // ბოლოში ვამატებთ საიდუმლო გასაღებს
  values.push(secretKey);
  
  const signatureString = values.join("|");
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

        if (!orderId || !amount || !customerEmail) {
          response.status(400).json({ error: "Missing required fields" });
          return;
        }

        // Flitt ითხოვს თანხას თეთრებში (მაგ: 10.00 GEL = 1000)
        const amountInKopecks = Math.round(amount * 100);

        // 1. ვამზადებთ მონაცემებს (ჯერ Signature-ის გარეშე)
        const requestData: any = {
          request: {
            order_id: orderId,
            merchant_id: FLITT_MERCHANT_ID,
            order_desc: description || `Order ${orderId}`,
            amount: amountInKopecks,
            currency: "GEL",
            server_callback_url: "https://europe-west1-lifestore-5d2b7.cloudfunctions.net/paymentCallback",
            response_url: "https://lifestore.ge/payment/success", // აქ დაბრუნდება მომხმარებელი
            sender_email: customerEmail,
            lang: "ka"
          }
        };

        // 2. ვაგენერირებთ Signature-ს
        const signature = generateSignature(requestData.request, FLITT_SECRET_KEY);
        requestData.request.signature = signature;

        logger.info("Sending request to Flitt:", JSON.stringify(requestData));

        // 3. ვაგზავნით მოთხოვნას პირდაპირ Flitt-ის სერვერზე
        const apiResponse = await axios.post(FLITT_API_URL, requestData);

        logger.info("Flitt Response:", apiResponse.data);

        // 4. ვამოწმებთ პასუხს
        const responseBody = apiResponse.data.response;

        if (responseBody && responseBody.response_status === "success") {
          response.status(200).json({
            success: true,
            checkoutUrl: responseBody.checkout_url,
            paymentId: responseBody.payment_id
          });
        } else {
          // თუ ისევ Error 1016 ამოაგდო, ზუსტად გვეცოდინება რა ხდება
          logger.error("Flitt API Error:", responseBody);
          response.status(400).json({
            success: false,
            error: responseBody?.error_message || "Payment generation failed",
            details: responseBody
          });
        }

      } catch (error: any) {
        logger.error("System Error:", error.response?.data || error.message);
        response.status(500).json({
          success: false,
          error: "Internal server error"
        });
      }
    });
  }
);

// ესენი უცვლელი რჩება, უბრალოდ იმპორტებს ვასწორებ
export const paymentCallback = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
    // ... (იგივე ლოგიკა რაც იყო, უბრალოდ დარწმუნდი რომ admin.firestore() მუშაობს)
    response.status(200).send("OK"); 
  }
);

export const getPaymentStatus = onRequest(
  { cors: true, region: "europe-west1" },
  async (request, response) => {
     // ... (დროებით შეგვიძლია ეს დავტოვოთ ან დავაკომენტაროთ, მთავარია createPayment)
     response.status(200).json({ status: "pending" });
  }
);