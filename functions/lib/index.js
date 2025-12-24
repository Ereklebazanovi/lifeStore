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
const corsHandler = cors({ origin: true, credentials: true });
// ✅ შემოწმებულია შენი სქრინით - სწორია
const FLITT_MERCHANT_ID = 4055351;
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url";
function generateSignature(params, secretKey) {
    // 1. ვიღებთ მხოლოდ იმას, რასაც ვაგზავნით
    const activeKeys = Object.keys(params).filter((key) => key !== "signature" && params[key]);
    // 2. სორტირება (აუცილებელია!)
    activeKeys.sort();
    // 3. მნიშვნელობები
    const values = activeKeys.map((key) => String(params[key]));
    // 4. Secret Key თავში (დაზღვევის მიზნით ვუკეთებთ trim-ს)
    values.unshift(secretKey.trim());
    // 5. გაერთიანება
    const signatureString = values.join("|");
    console.log("🔐 FINAL SIGNING STRING:", signatureString);
    return crypto.createHash("sha1").update(signatureString).digest("hex");
}
exports.createPayment = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    return corsHandler(request, response, async () => {
        try {
            const { orderId, amount } = request.body;
            const amountInKopecks = Math.round(amount * 100);
            // 🛑 ყურადღება: ამოვიღე "server_callback_url" და "order_desc"
            // ვაგზავნით მხოლოდ 4 პარამეტრს, რაც უეჭველი უნდა მიიღოს.
            const requestParams = {
                amount: amountInKopecks, // Number
                currency: "GEL",
                merchant_id: FLITT_MERCHANT_ID, // Number
                order_id: String(orderId),
            };
            const signature = generateSignature(requestParams, FLITT_SECRET_KEY);
            const requestBody = {
                request: {
                    ...requestParams,
                    signature: signature,
                },
            };
            logger.info("🚀 Sending NAKED Request:", JSON.stringify(requestBody));
            const apiResponse = await axios_1.default.post(FLITT_API_URL, requestBody);
            const responseBody = apiResponse.data.response;
            if (responseBody?.response_status === "success") {
                response.status(200).json({
                    success: true,
                    checkoutUrl: responseBody.checkout_url,
                    paymentId: responseBody.payment_id,
                });
            }
            else {
                logger.error("❌ Flitt Error:", responseBody);
                response.status(400).json({
                    success: false,
                    error: responseBody?.error_message,
                    details: responseBody,
                });
            }
        }
        catch (error) {
            logger.error("🔥 System Error:", error.message);
            response.status(500).json({ error: "Internal Error" });
        }
    });
});
// Callback ფუნქცია რჩება (ბანკი პორტალიდან წაიკითხავს მისამართს)
exports.paymentCallback = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    response.status(200).send("OK");
});
exports.getPaymentStatus = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    response.status(200).json({ status: "pending" });
});
//# sourceMappingURL=index.js.map