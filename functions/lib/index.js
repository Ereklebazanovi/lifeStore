"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatus = exports.paymentCallback = exports.createPayment = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const crypto = require("crypto");
// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp();
}
// CORS setup - allow all origins for testing
const corsHandler = cors({
    origin: true,
    credentials: true,
});
// Flitt (TBC Bank) credentials
const FLITT_MERCHANT_ID = 4055351; // Number (not string)
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
const FLITT_API_URL = "https://pay.flitt.com/api/checkout/url/";
/**
 * Generate Flitt signature according to official documentation
 * Based on working example: "test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/"
 * Format: secret|amount|currency|merchant_id|order_desc|order_id|server_callback_url
 */
function generateSignature(params, secretKey) {
    // Only these specific parameters should be included in signature calculation
    const signatureParams = [
        secretKey, // Secret key goes first
        params.amount, // Amount in kopecks (tetri)
        params.currency, // "GEL"
        params.merchant_id, // Merchant ID
        params.order_desc, // Order description
        params.order_id, // Order ID
        params.server_callback_url, // Server callback URL
    ];
    // Convert all to strings and join with |
    const signatureString = signatureParams.map((param) => String(param)).join("|");
    logger.info("🔐 Signature String (exact match to docs):", signatureString);
    // Generate SHA1 hash
    const signature = crypto
        .createHash("sha1")
        .update(signatureString)
        .digest("hex");
    logger.info("🔐 Generated Signature:", signature);
    return signature;
}
/**
 * Create Flitt Payment
 * Fixed signature generation and proper data types
 */
exports.createPayment = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    return corsHandler(request, response, async () => {
        try {
            // Only allow POST requests
            if (request.method !== "POST") {
                response.status(405).json({ error: "Method not allowed" });
                return;
            }
            const { orderId, amount, customerEmail, description, } = request.body;
            // Validate required fields
            if (!orderId || !amount) {
                response
                    .status(400)
                    .json({ error: "Missing required fields: orderId, amount" });
                return;
            }
            // Convert amount to kopecks (tetri for GEL)
            const amountInKopecks = Math.round(amount * 100);
            // Clean description - remove special characters that might cause issues
            const cleanDesc = (description || `Order ${orderId}`).replace(/[^a-zA-Z0-9 -]/g, "");
            // Prepare parameters for signature generation
            // NOTE: ALL parameters as STRINGS for both signature AND JSON
            const requestParams = {
                version: "1.0.1", // Required by API
                order_id: String(orderId), // Always string
                merchant_id: String(FLITT_MERCHANT_ID), // String in both signature and JSON
                order_desc: cleanDesc,
                amount: String(amountInKopecks), // String in both signature and JSON (kopecks)
                currency: "GEL",
                server_callback_url: "https://europe-west1-lifestore-5d2b7.cloudfunctions.net/paymentCallback",
                response_url: "https://lifestore.ge/payment/success",
            };
            // Add optional email if provided
            if (customerEmail && customerEmail.trim() !== "") {
                requestParams.sender_email = customerEmail.trim();
            }
            // Generate signature
            const signature = generateSignature(requestParams, FLITT_SECRET_KEY);
            // Prepare final request body
            const requestBody = {
                request: {
                    ...requestParams,
                    signature: signature,
                },
            };
            logger.info("🚀 Sending to Flitt:", JSON.stringify(requestBody, null, 2));
            // Send request to Flitt API
            const apiResponse = await axios_1.default.post(FLITT_API_URL, requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 30000, // 30 seconds timeout
            });
            logger.info("📩 Flitt Response:", JSON.stringify(apiResponse.data, null, 2));
            const responseBody = apiResponse.data.response;
            if (responseBody && responseBody.response_status === "success") {
                // Success - return checkout URL
                const successResponse = {
                    success: true,
                    checkoutUrl: responseBody.checkout_url,
                    paymentId: responseBody.payment_id,
                };
                response.status(200).json(successResponse);
                return;
            }
            else {
                // Payment creation failed
                logger.error("❌ Flitt Payment Failed:", responseBody);
                const errorResponse = {
                    success: false,
                    error: responseBody?.error_message || "Payment creation failed",
                    errorCode: responseBody?.error_code,
                    details: responseBody,
                };
                response.status(400).json(errorResponse);
                return;
            }
        }
        catch (error) {
            logger.error("🔥 System Error:", error.response?.data || error.message);
            const errorResponse = {
                success: false,
                error: "Internal server error",
                details: error.response?.data,
            };
            response.status(500).json(errorResponse);
        }
    });
});
/**
 * Handle Flitt Payment Callback
 * This endpoint receives payment status updates from Flitt
 */
exports.paymentCallback = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    try {
        logger.info("📞 Payment Callback Received:", JSON.stringify(request.body, null, 2));
        const callbackData = request.body;
        // Extract callback data
        const { order_id: orderId, order_status: orderStatus, payment_id: paymentId, amount, } = callbackData;
        if (orderStatus === "approved") {
            logger.info(`✅ Payment APPROVED for order ${orderId}`, {
                paymentId,
                amount,
            });
            // Update order status in Firestore
            try {
                const orderRef = admin.firestore().collection("orders").doc(orderId);
                await orderRef.update({
                    paymentStatus: "paid",
                    paymentId: paymentId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                logger.info(`💾 Order ${orderId} marked as PAID in Firestore`);
            }
            catch (firestoreError) {
                logger.error(`❌ Failed to update order ${orderId}:`, firestoreError);
            }
        }
        else if (orderStatus === "declined") {
            logger.info(`❌ Payment DECLINED for order ${orderId}`);
            // Update order status in Firestore
            try {
                const orderRef = admin.firestore().collection("orders").doc(orderId);
                await orderRef.update({
                    paymentStatus: "failed",
                    paymentId: paymentId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                logger.info(`💾 Order ${orderId} marked as FAILED in Firestore`);
            }
            catch (firestoreError) {
                logger.error(`❌ Failed to update order ${orderId}:`, firestoreError);
            }
        }
        // Always respond with 200 OK to acknowledge receipt
        response.status(200).send("OK");
    }
    catch (error) {
        logger.error("❌ Error processing payment callback:", error);
        response.status(200).send("OK"); // Still return OK to avoid retries from Flitt
    }
});
/**
 * Get Payment Status
 * Check the current status of a payment by payment ID
 */
exports.getPaymentStatus = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    return corsHandler(request, response, async () => {
        try {
            const { paymentId } = request.query;
            if (!paymentId || typeof paymentId !== "string") {
                response.status(400).json({
                    success: false,
                    error: "Missing paymentId parameter",
                });
                return;
            }
            // For now, return pending status
            // You can implement actual status checking with Flitt API later
            response.status(200).json({
                success: true,
                status: "pending",
                paymentId: paymentId,
            });
        }
        catch (error) {
            logger.error("❌ Error getting payment status:", error);
            response.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
});
//# sourceMappingURL=index.js.map