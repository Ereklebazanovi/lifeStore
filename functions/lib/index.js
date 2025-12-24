"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatus = exports.paymentCallback = exports.createPayment = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const crypto = require("crypto");
if (!admin.apps.length) {
    admin.initializeApp();
}
const corsHandler = cors({
    origin: true,
    credentials: true,
});
const FLITT_MERCHANT_ID = 4055351;
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url";
function generateSignature(params, secretKey) {
    // 1. ვიღებთ მხოლოდ არაცარიელ ველებს (signature-ის გარეშე)
    const activeKeys = Object.keys(params).filter((key) => key !== "signature" &&
        params[key] !== null &&
        params[key] !== undefined &&
        String(params[key]).trim() !== "");
    // 2. ვასორტირებთ ანბანის მიხედვით (A-Z) - ეს აუცილებელია!
    activeKeys.sort();
    // 3. ვიღებთ მნიშვნელობებს (ყველაფერი სტრინგად)
    const values = activeKeys.map((key) => String(params[key]));
    // 4. Secret Key თავში (array_unshift)
    values.unshift(secretKey);
    // 5. გაერთიანება
    const signatureString = values.join("|");
    console.log("🔐 Signing String (Should match sent params):", signatureString);
    return crypto.createHash("sha1").update(signatureString).digest("hex");
}
exports.createPayment = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
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
            const cleanDesc = (description || `Order ${orderId}`).replace(/[^a-zA-Z0-9 -]/g, "");
            // ✅ ვქმნით ერთ ობიექტს.
            // რადგან აქ წერია response_url და version, ისინი ავტომატურად მოხვდებიან ხელმოწერაშიც!
            const requestParams = {
                version: "1.0.1",
                order_id: String(orderId),
                merchant_id: FLITT_MERCHANT_ID, // Number
                order_desc: cleanDesc,
                amount: amountInKopecks, // Number
                currency: "GEL",
                server_callback_url: "https://europe-west1-lifestore-5d2b7.cloudfunctions.net/paymentCallback",
                response_url: "https://lifestore.ge/payment/success",
            };
            // Email-ს ვამატებთ მხოლოდ თუ არსებობს
            if (customerEmail && customerEmail.trim() !== "") {
                requestParams.sender_email = customerEmail;
            }
            // 1. ვაგენერირებთ ხელმოწერას ამ ობიექტზე (დინამიურად)
            const signature = generateSignature(requestParams, FLITT_SECRET_KEY);
            // 2. ვამზადებთ გასაგზავნ მონაცემებს
            const requestBody = {
                request: {
                    ...requestParams,
                    signature: signature,
                },
            };
            logger.info("🚀 Sending Request:", JSON.stringify(requestBody));
            const apiResponse = await axios_1.default.post(FLITT_API_URL, requestBody);
            logger.info("📩 Flitt Response:", apiResponse.data);
            const responseBody = apiResponse.data.response;
            if (responseBody && responseBody.response_status === "success") {
                response.status(200).json({
                    success: true,
                    checkoutUrl: responseBody.checkout_url,
                    paymentId: responseBody.payment_id,
                });
            }
            else {
                logger.error("❌ Flitt Payment Failed:", responseBody);
                response.status(400).json({
                    success: false,
                    error: responseBody?.error_message || "Payment failed",
                    errorCode: responseBody?.error_code,
                    details: responseBody,
                });
            }
        }
        catch (error) {
            logger.error("🔥 System Error:", error.response?.data || error.message);
            response.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    });
});
// ... დანარჩენი იგივე
exports.paymentCallback = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    logger.info("Callback received:", request.body);
    response.status(200).send("OK");
});
exports.getPaymentStatus = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    response.status(200).json({ status: "pending" });
});
//# sourceMappingURL=index.js.map