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
    // Based on Flitt documentation, only these specific parameters should be in signature:
    // secret|amount|currency|merchant_id|order_desc|order_id|server_callback_url
    // Convert all to strings and log details
    const amount = String(params.amount);
    const merchantId = String(params.merchant_id);
    const signatureParams = [
        secretKey,
        amount,
        params.currency,
        merchantId,
        params.order_desc,
        params.order_id,
        params.server_callback_url,
    ];
    const signatureString = signatureParams.join("|");
    console.log("🔍 Debug Info:");
    console.log("  - Amount (type):", typeof params.amount, "value:", params.amount);
    console.log("  - Amount as string:", amount);
    console.log("  - Merchant ID (type):", typeof params.merchant_id, "value:", params.merchant_id);
    console.log("  - Order desc:", params.order_desc);
    console.log("🔐 Signature String:", signatureString);
    // Try multiple approaches
    const sig1 = crypto
        .createHash("sha1")
        .update(signatureString, "utf8")
        .digest("hex");
    const sig2 = crypto
        .createHash("sha1")
        .update(signatureString, "ascii")
        .digest("hex");
    console.log("🔐 Signature UTF-8:", sig1);
    console.log("🔐 Signature ASCII:", sig2);
    return sig1;
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
            // Try both formats to debug the issue
            const amountInKopecks = Math.round(amount * 100); // 2.00 GEL = 200 tetri
            const amountInLari = amount; // 2.00 GEL = 2 lari
            console.log("💰 Amount Debug:");
            console.log("  - Original amount:", amount);
            console.log("  - Amount in kopecks/tetri:", amountInKopecks);
            console.log("  - Amount in lari:", amountInLari);
            // Clean description - remove special chars but keep spaces for now
            const rawDesc = description || `Order ${orderId}`;
            const cleanDesc = rawDesc.replace(/[^a-zA-Z0-9 -]/g, "");
            console.log("📝 Description processing:");
            console.log("  - Raw description:", rawDesc);
            console.log("  - Clean description:", cleanDesc);
            console.log("  - Clean desc length:", cleanDesc.length);
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
            console.log("🧪 Testing both amount formats:");
            // Test 1: Amount in tetri/kopecks (current: 200)
            console.log("🧪 Testing with tetri format (200):");
            const sig1 = generateSignature(requestParams, FLITT_SECRET_KEY);
            // Test 2: Amount in lari (2.00)
            console.log("🧪 Testing with lari format (2):");
            const paramsWithLariAmount = { ...requestParams, amount: amountInLari };
            const sig2 = generateSignature(paramsWithLariAmount, FLITT_SECRET_KEY);
            console.log("🧪 Final choice: Using tetri format");
            console.log("🧪 Comparison - Tetri signature:", sig1);
            console.log("🧪 Comparison - Lari signature:", sig2);
            const signature = sig1;
            // 2. ვამზადებთ გასაგზავნ მონაცემებს
            const requestBody = {
                request: {
                    ...requestParams,
                    signature: signature,
                },
            };
            logger.info("🚀 Sending Request:", JSON.stringify(requestBody, null, 2));
            const apiResponse = await axios_1.default.post(FLITT_API_URL, requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 30000,
            });
            logger.info("📩 Flitt Response:", JSON.stringify(apiResponse.data, null, 2));
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