"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatus = exports.paymentCallback = exports.createPayment = void 0;
//index.ts
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors");
const admin = require("firebase-admin");
// Cloudipsp SDK import
const CloudIpsp = require("cloudipsp-node-js-sdk");
// Initialize Firebase Admin
admin.initializeApp();
// CORS setup - allow requests from your domain
const corsHandler = cors({
    origin: [
        "https://lifestore.ge",
        "http://localhost:5173", // Vite dev server
        "http://localhost:3000", // React dev server (backup)
    ],
    credentials: true,
});
// Flitt (TBC Bank) credentials
const FLITT_MERCHANT_ID = "4055351";
const FLITT_SECRET_KEY = "hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu";
// Initialize Cloudipsp
const fondy = new CloudIpsp({
    merchantId: FLITT_MERCHANT_ID,
    secretKey: FLITT_SECRET_KEY,
});
/**
 * Create Flitt (TBC Bank) Payment
 *
 * Expected request body:
 * {
 *   "orderId": "LS-2025-123456",
 *   "amount": 50.00,
 *   "customerEmail": "customer@example.com",
 *   "customerName": "John Doe",
 *   "description": "LifeStore Order #LS-2025-123456"
 * }
 */
exports.createPayment = (0, https_1.onRequest)({ cors: true, region: "europe-west1" }, async (request, response) => {
    return corsHandler(request, response, async () => {
        try {
            // Only allow POST requests
            if (request.method !== "POST") {
                response.status(405).json({
                    success: false,
                    error: "Method not allowed",
                });
                return;
            }
            const { orderId, amount, customerEmail, customerName, description, } = request.body;
            // Validation
            if (!orderId || !amount || !customerEmail || !customerName) {
                response.status(400).json({
                    success: false,
                    error: "Missing required fields: orderId, amount, customerEmail, customerName",
                });
                return;
            }
            // Convert amount to kopecks (multiply by 100)
            const amountInKopecks = Math.round(amount * 100);
            // Prepare payment data
            const paymentData = {
                order_id: orderId,
                order_desc: description || `LifeStore Order #${orderId}`,
                amount: amountInKopecks,
                currency: "GEL", // Georgian Lari
                merchant_data: JSON.stringify({
                    orderId: orderId,
                    customerEmail: customerEmail,
                    source: "website",
                }),
                // Customer information
                sender_email: customerEmail,
                // Redirect URLs
                response_url: "https://lifestore.ge/payment/callback", // Server-to-server callback
                server_callback_url: "https://lifestore.ge/payment/callback", // Server callback
                success_url: "https://lifestore.ge/payment/success",
                failure_url: "https://lifeStore.ge/payment/failure",
                // Additional parameters
                lang: "ka", // Georgian language
                lifetime: 36000, // 10 hours in seconds
                // Payment methods (optional - let Flitt decide)
                payment_systems: "card", // Allow card payments
            };
            logger.info("Creating Flitt payment with data:", paymentData);
            // Create payment using Cloudipsp SDK
            const result = await fondy.Checkout(paymentData);
            logger.info("Flitt payment response:", result);
            if (result && result.checkout_url) {
                // Success - return checkout URL
                const successResponse = {
                    success: true,
                    checkoutUrl: result.checkout_url,
                    paymentId: result.payment_id,
                    response: result,
                };
                response.status(200).json(successResponse);
                return;
            }
            else {
                // Failed to create payment
                logger.error("Failed to create Flitt payment:", result);
                const errorResponse = {
                    success: false,
                    error: "Failed to create payment link",
                    response: result,
                };
                response.status(400).json(errorResponse);
                return;
            }
        }
        catch (error) {
            logger.error("Error creating Flitt payment:", error);
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
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
        logger.info("Received payment callback:", request.body);
        const callbackData = request.body;
        // Verify the callback signature (optional but recommended)
        // You can implement signature verification here for security
        const { order_id: orderId, order_status: orderStatus, payment_id: paymentId, amount, } = callbackData;
        if (orderStatus === "approved") {
            logger.info(`Payment approved for order ${orderId}`, {
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
                logger.info(`Order ${orderId} marked as paid in Firestore`);
            }
            catch (firestoreError) {
                logger.error(`Failed to update order ${orderId} in Firestore:`, firestoreError);
            }
        }
        else if (orderStatus === "declined") {
            logger.info(`Payment declined for order ${orderId}`);
            // Update order status in Firestore
            try {
                const orderRef = admin.firestore().collection("orders").doc(orderId);
                await orderRef.update({
                    paymentStatus: "failed",
                    paymentId: paymentId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                logger.info(`Order ${orderId} marked as failed in Firestore`);
            }
            catch (firestoreError) {
                logger.error(`Failed to update order ${orderId} in Firestore:`, firestoreError);
            }
        }
        // Always respond with 200 OK to acknowledge receipt
        response.status(200).send("OK");
    }
    catch (error) {
        logger.error("Error processing payment callback:", error);
        response.status(200).send("OK"); // Still return OK to avoid retries
    }
});
/**
 * Get Payment Status
 * Check the current status of a payment
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
            // Get payment status from Flitt
            const statusData = {
                payment_id: paymentId,
            };
            const result = await fondy.Status(statusData);
            logger.info(`Payment status for ${paymentId}:`, result);
            response.status(200).json({
                success: true,
                status: result.order_status,
                response: result,
            });
        }
        catch (error) {
            logger.error("Error getting payment status:", error);
            response.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
});
//# sourceMappingURL=index.js.map