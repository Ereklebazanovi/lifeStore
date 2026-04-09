// api/payment/callback.ts
import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../lib/firebase-admin";
 
const ADMIN_CONFIG = {
  EMAIL: "lifestoreorders@gmail.com",
  BUSINESS_NAME: "LifeStore",
  BUSINESS_PHONE: "+995 511 72 72 57",
  BUSINESS_EMAIL: "info@lifestore.ge",
};

const SITE_CONFIG = {
  BASE_URL: "https://lifestore.ge",
  SITE_NAME: "LifeStore",
  DESCRIPTION: "ონლაინ მაღაზია სახლის ნივთებისთვის",
};

// Flitt Configuration - Environment variables only for security
const FLITT_SECRET_KEY = process.env.FLITT_SECRET_KEY;

if (!FLITT_SECRET_KEY) {
  console.error("❌ FLITT_SECRET_KEY environment variable not set!");
  throw new Error("Missing required environment variables");
}

/**
 * Verify Flitt signature according to PHP documentation
 * Same algorithm as in create.ts but for response verification
 */
function verifyFlittSignature(responseData: any, secretKey: string): boolean {
  try {
    const signature = responseData.signature;
    if (!signature) {
      console.log("❌ No signature in response");
      return false;
    }

    // Remove fields that Flitt excludes from signature calculation
    const dataForVerification = { ...responseData };
    delete dataForVerification.signature;
    delete dataForVerification.response_signature_string;
    delete dataForVerification.get_without_parameters;

    // Filter empty values
    const filteredData: Record<string, any> = {};
    Object.keys(dataForVerification).forEach((key) => {
      if (
        dataForVerification[key] !== undefined &&
        dataForVerification[key] !== null &&
        dataForVerification[key] !== ""
      ) {
        filteredData[key] = dataForVerification[key];
      }
    });

    // Sort keys alphabetically
    const sortedKeys = Object.keys(filteredData).sort();
    const sortedValues = sortedKeys.map((key) => String(filteredData[key]));

    // Add secret key at the beginning
    const signatureParams = [secretKey, ...sortedValues];
    const signatureString = signatureParams.join("|");

    // Generate SHA1 hash
    const expectedSignature = createHash("sha1")
      .update(signatureString, "utf8")
      .digest("hex");

    // Signature verification
    const isMatch = expectedSignature === signature;
    if (!isMatch) {
      console.log("🔐 Signature verification failed:");
      console.log("  Fields used:", sortedKeys.join(", "));
      console.log("  Signing string:", signatureString.replace(secretKey, "[SECRET]"));
      console.log("  Expected:", expectedSignature);
      console.log("  Received:", signature);
    }

    return isMatch;
  } catch (error) {
    console.error("❌ Error verifying signature:", error);
    return false;
  }
}

/**
 * Update order status in Firestore and send confirmation email if payment successful
 */
async function updateOrderStatus(
  orderNumber: string,
  isPaymentSuccessful: boolean
): Promise<void> {
  try {
    // Find order by orderNumber first
    const ordersRef = adminDb.collection("orders");
    const snapshot = await ordersRef
      .where("orderNumber", "==", orderNumber)
      .get();

    if (snapshot.empty) {
      console.error(`❌ Order ${orderNumber} not found in database`);
      return;
    }

    const orderDoc = snapshot.docs[0];
    const orderRef = orderDoc.ref;

    const orderData = orderDoc.data();

    // ✅ IDEMPOTENCY CHECK: Prevent duplicate payment processing
    if (isPaymentSuccessful && orderData?.paymentStatus === "paid") {
      console.log(
        `⚠️ Order ${orderNumber} already marked as paid. Skipping duplicate processing.`
      );
      return;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (isPaymentSuccessful) {
      updateData.paymentStatus = "paid";
      updateData.orderStatus = "confirmed";
      updateData.paidAt = new Date();
      console.log(`✅ Order ${orderNumber} marked as PAID and CONFIRMED`);

      // ✅ NOW SEND EMAIL NOTIFICATION AFTER PAYMENT SUCCESS
      try {
        // Get order details to send email
        const orderData = orderDoc.data();
        if (orderData) {
          // Convert Firestore data to Order object
          const order = {
            id: orderDoc.id,
            userId: orderData.userId,
            orderNumber: orderData.orderNumber,
            source: orderData.source,
            items: orderData.items,
            subtotal: orderData.subtotal,
            shippingCost: orderData.shippingCost,
            totalAmount: orderData.totalAmount,
            customerInfo: orderData.customerInfo,
            deliveryInfo: orderData.deliveryInfo,
            orderStatus: "confirmed", // Updated status
            paymentMethod: orderData.paymentMethod,
            paymentStatus: "paid", // Updated status
            createdAt: orderData.createdAt.toDate(),
            updatedAt: new Date(),
            paidAt: new Date(),
          };

          console.log(`📧 Sending order confirmation email for ${orderNumber}`);
          await sendEmailNotification(order);
          console.log(`✅ Email sent successfully for order ${orderNumber}`);
        }
      } catch (emailError) {
        console.error(
          `❌ Failed to send email for order ${orderNumber}:`,
          emailError
        );
        // Don't fail the payment process if email fails
      }
    } else {
      updateData.paymentStatus = "failed";
      console.log(`❌ Order ${orderNumber} marked as PAYMENT FAILED`);
    }

    // Update the order in Firestore
    await orderRef.update(updateData);

    console.log(`🔄 Order ${orderNumber} updated successfully:`, updateData);
  } catch (error) {
    console.error(`❌ Error updating order ${orderNumber}:`, error);
  }
}

/**
 * Send email notification using Firebase mail collection
 */
async function sendEmailNotification(order: any): Promise<void> {
  // Skip if no email provided
  if (!order.customerInfo.email || order.customerInfo.email.trim() === "") {
    return;
  }

  try {
    // Add customer email to Firebase mail collection
    await adminDb.collection("mail").add({
      to: [order.customerInfo.email],
      message: {
        subject: `✅ თქვენი შეკვეთა დადასტურებულია - #${order.orderNumber}`,
        html: `
          <div style="font-family: Georgian, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin-bottom: 10px;">✅ შეკვეთა მიღებულია!</h1>
                <p style="color: #666; font-size: 16px;">მადლობა LifeStore-დან შესყიდვისთვის</p>
              </div>

              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1d4ed8; margin-bottom: 15px;">📋 შეკვეთის დეტალები</h2>
                <p><strong>შეკვეთის ნომერი:</strong> ${order.orderNumber}</p>
                <p><strong>თარიღი:</strong> ${new Date(
                  order.createdAt
                ).toLocaleDateString("ka-GE")}</p>
                <p><strong>მიწოდების მისამართი:</strong> ${
                  order.deliveryInfo.city
                }, ${order.deliveryInfo.address}</p>
                <p><strong>სულ ღირებულება:</strong> ₾${order.totalAmount.toFixed(
                  2
                )}</p>
              </div>

              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">🛍️ შეკვეთილი პროდუქტები:</h3>
                ${order.items
                  .map(
                    (item: any) => `
                  <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
                    <p style="margin: 5px 0;"><strong>${
                      item.product.name
                    }</strong></p>
                    ${
                      item.variantId
                        ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">ვარიანტი: ${
                            item.variantName || ""
                          }</p>`
                        : ""
                    }
                    <p style="margin: 5px 0;">რაოდენობა: ${
                      item.quantity
                    } ცალი</p>
                    <p style="margin: 5px 0; color: #059669; font-weight: bold;">₾${(
                      item.total || item.price * item.quantity
                    ).toFixed(2)}</p>
                  </div>
                `
                  )
                  .join("")}
              </div>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
                <p style="margin: 0; color: #065f46;"><strong>💡 მნიშვნელოვანი ინფორმაცია:</strong></p>
                <p style="margin: 10px 0 0 0; color: #065f46;">თქვენი შეკვეთა გადაეცა მუშაობის რეჟიმში და მალე დაიწყება მისი დამუშავება. მიწოდების დროისა და დეტალების შესახებ დამატებით დაგიკავშირდებით.</p>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; margin-bottom: 5px;">კითხვების შემთხვევაში დაგვიკავშირდით:</p>
                <p style="color: #2563eb; font-weight: bold; margin: 5px 0;">📞 მობ: ${
                  ADMIN_CONFIG.BUSINESS_PHONE
                }</p>
                <p style="color: #2563eb; font-weight: bold; margin: 5px 0;">✉️ ემაილი: ${
                  ADMIN_CONFIG.BUSINESS_EMAIL
                }</p>

                <div style="margin-top: 20px; text-align: center;">
                  <a href="${SITE_CONFIG.BASE_URL}/order-success/${
          order.orderNumber
        }?token=${order.accessToken}"
                     style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                    📄 შეკვეთის დეტალები და PDF
                  </a>
                </div>

                <div style="margin-top: 20px;">
                  <p style="color: #999; font-size: 14px; margin: 0;">მადლობა LifeStore-ის არჩევისთვის! 🎉</p>
                </div>
              </div>
            </div>
          </div>
        `,
      },
    });

    // Add admin notification email
    console.log(`📧 Sending admin notification to: ${ADMIN_CONFIG.EMAIL}`);
    await adminDb.collection("mail").add({
      to: [ADMIN_CONFIG.EMAIL],
      message: {
        subject: `🔔 ახალი შეკვეთა - #${order.orderNumber}`,
        html: `
          <div style="font-family: Georgian, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">🔔 ახალი შეკვეთა მიღებულია!</h2>
            <p><strong>შეკვეთის ნომერი:</strong> ${order.orderNumber}</p>
            <p><strong>კლიენტი:</strong> ${order.customerInfo.firstName} ${
          order.customerInfo.lastName
        }</p>
            <p><strong>ტელეფონი:</strong> ${order.customerInfo.phone}</p>
            <p><strong>ემაილი:</strong> ${order.customerInfo.email}</p>
            <p><strong>მისამართი:</strong> ${order.deliveryInfo.city}, ${
          order.deliveryInfo.address
        }</p>
            <p><strong>სულ ღირებულება:</strong> ₾${order.totalAmount.toFixed(
              2
            )}</p>

            <h3>პროდუქტები:</h3>
            ${order.items
              .map(
                (item: any) => `
              <div style="border: 1px solid #ccc; padding: 10px; margin: 5px 0;">
                <p><strong>${item.product.name}</strong></p>
                ${
                  item.variantId
                    ? `<p>ვარიანტი: ${item.variantName || ""}</p>`
                    : ""
                }
                <p>რაოდენობა: ${item.quantity} ცალი</p>
                <p>ღირებულება: ₾${(
                  item.total || item.price * item.quantity
                ).toFixed(2)}</p>
              </div>
            `
              )
              .join("")}
          </div>
        `,
      },
    });

    console.log("✅ Email notifications added to Firebase mail collection");
    console.log(`📧 Customer email sent to: ${order.customerInfo.email}`);
    console.log(`👨‍💼 Admin notification sent to: ${ADMIN_CONFIG.EMAIL}`);
  } catch (error) {
    console.error("❌ Error adding email to mail collection:", error);
    throw error;
  }
}

module.exports = async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log("Payment callback received:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("Query params:", JSON.stringify(req.query, null, 2));
  console.log(
    "Headers:",
    JSON.stringify(
      {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
        "x-forwarded-for": req.headers["x-forwarded-for"],
      },
      null,
      2
    )
  );

  // Health check
  if (req.method === "GET" && Object.keys(req.query).length === 0) {
    return res.status(200).json({
      status: "ok",
      message: "Payment callback endpoint is working",
      timestamp: new Date().toISOString(),
    });
  }

  // Accept both GET and POST requests (TBC uses GET for callbacks)
  if (req.method !== "GET" && req.method !== "POST") {
    console.log(`❌ Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(`Processing payment callback - Method: ${req.method}`);

    // Extract response data based on request method
    let responseData;
    if (req.method === "GET") {
      // For GET requests, data is in query parameters
      responseData = req.query;
    } else {
      // For POST requests, data is in body (legacy support)
      responseData = req.body.response || req.body;
    }

    if (!responseData) {
      console.error("❌ No response data received");
      return res.status(400).send("No data received");
    }

    // ✅ SECURITY: Verify request authenticity
    let isSignatureValid = false;

    if (responseData.signature) {
      // Preferred: cryptographic signature verification
      isSignatureValid = verifyFlittSignature(responseData, FLITT_SECRET_KEY);
    }

    if (!isSignatureValid) {
      console.error("❌ SECURITY: Callback rejected — invalid signature or amount mismatch.");
      console.error("📋 Received data:", responseData);
      return res.status(200).send("OK");
    }

    console.log("✅ Signature verified successfully");

    // Extract payment information
    const {
      order_id: orderId,
      order_status: orderStatus,
      response_status,
    } = responseData;

    // Validate required fields
    if (!orderId) {
      console.error("❌ Missing order_id in callback");
      return res.status(400).send("Missing order_id");
    }

    // Determine if payment was successful
    const isPaymentSuccessful =
      orderStatus === "approved" && response_status === "success";

    if (isPaymentSuccessful) {
      console.log(`✅ Payment APPROVED for order ${orderId}`);
    } else {
      console.log(
        `❌ Payment FAILED for order ${orderId} - Status: ${orderStatus}, Response: ${response_status}`
      );
    }

    // ✅ Update order status in Firestore
    await updateOrderStatus(orderId, isPaymentSuccessful);

    // Always respond with 200 OK to acknowledge receipt
    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error processing payment callback:", error);
    // Still return OK to avoid infinite retries from Flitt
    return res.status(200).send("OK");
  }
};
