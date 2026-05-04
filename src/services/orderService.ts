// src/services/orderService.ts
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  deleteField,
  runTransaction,
  writeBatch,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { ADMIN_CONFIG, SITE_CONFIG } from "../config/constants";
import type {
  Order,
  CreateOrderRequest,
  CreateManualOrderRequest,
  UpdateManualOrderRequest,
  CartItem,
  OrderItem,
  ManualOrderItem,
  Product,
  ProductVariant,
  StockHistory,
} from "../types";

export class OrderService {
  private static readonly COLLECTION_NAME = "orders";

  /**
   * Generate unique order number
   */
  private static generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime().toString().slice(-6);
    return `LS-${year}-${timestamp}`;
  }

  /**
   * Generate unique access token for order
   */
  private static generateAccessToken(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean object by removing undefined values (Firestore safe)
   */
  private static cleanObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // Preserve Firestore-special values (Timestamp, Date, etc.)
    // cleanObject is only meant to strip undefined fields, not to serialize objects.
    if (obj instanceof Date) {
      return obj;
    }
    if (obj instanceof Timestamp) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.cleanObject(value);
      }
    }
    return cleaned;
  }

  /**
   * Helper function to calculate actual price for a product/variant
   */
  private static calculateActualPrice(product: any, variantId?: string): number {
    let actualPrice = product.price || 0;

    // Check if this is a variant product
    if (variantId && product.variants) {
      const variant = product.variants.find((v: any) => v.id === variantId);
      if (variant) {
        // Use sale price if available and lower than regular price
        actualPrice = variant.salePrice && variant.salePrice < variant.price
          ? variant.salePrice
          : variant.price;
      }
    } else {
      // For simple products, check if there's a sale price
      if (product.salePrice && product.salePrice < product.price) {
        actualPrice = product.salePrice;
      }
    }
    return actualPrice;
  }

  private static toDateSafe(value: any): Date | undefined {
    if (!value) return undefined;

    if (value instanceof Date) {
      return !isNaN(value.getTime()) ? value : undefined;
    }

    // Firestore Timestamp (web SDK)
    if (value?.toDate && typeof value.toDate === "function") {
      try {
        const converted = value.toDate();
        return converted instanceof Date && !isNaN(converted.getTime())
          ? converted
          : undefined;
      } catch {
        return undefined;
      }
    }

    // Plain object timestamp shape: { seconds, nanoseconds }
    if (
      typeof value === "object" &&
      value !== null &&
      (typeof (value as any).seconds === "number" ||
        typeof (value as any)._seconds === "number")
    ) {
      const seconds =
        (typeof (value as any).seconds === "number"
          ? (value as any).seconds
          : (value as any)._seconds) as number;
      const nanoseconds =
        (typeof (value as any).nanoseconds === "number"
          ? (value as any).nanoseconds
          : typeof (value as any)._nanoseconds === "number"
            ? (value as any)._nanoseconds
            : 0) as number;
      const millis = seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
      const converted = new Date(millis);
      return !isNaN(converted.getTime()) ? converted : undefined;
    }

    // ISO string / numeric timestamps
    try {
      const parsed = new Date(value);
      return !isNaN(parsed.getTime()) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Helper function to convert Firestore timestamps to Date objects
   */
  private static convertFirestoreTimestamps(data: any): any {
    return {
      ...data,
      createdAt: this.toDateSafe(data.createdAt) || data.createdAt,
      updatedAt: this.toDateSafe(data.updatedAt) || data.updatedAt,
      paidAt: this.toDateSafe(data.paidAt) || data.paidAt,
      deliveredAt: this.toDateSafe(data.deliveredAt) || data.deliveredAt,
      cancelledAt: this.toDateSafe(data.cancelledAt) || data.cancelledAt,
    };
  }

  /**
   * Helper function to create consistent Order object structure
   */
  private static createOrderObject(orderDoc: any, data: any): Order {
    const convertedData = this.convertFirestoreTimestamps(data);

    return {
      id: orderDoc.id,
      userId: convertedData.userId,
      orderNumber: convertedData.orderNumber,
      accessToken: convertedData.accessToken,
      source: convertedData.source,
      items: convertedData.items,
      subtotal: convertedData.subtotal,
      shippingCost: convertedData.shippingCost,
      totalAmount: convertedData.totalAmount,
      customerInfo: convertedData.customerInfo,
      deliveryInfo: convertedData.deliveryInfo,
      orderStatus: convertedData.orderStatus,
      paymentMethod: convertedData.paymentMethod,
      paymentStatus: convertedData.paymentStatus,
      createdAt: convertedData.createdAt,
      updatedAt: convertedData.updatedAt,
      paidAt: convertedData.paidAt,
      deliveredAt: convertedData.deliveredAt,
      cancelledAt: convertedData.cancelledAt,
      ...(convertedData.adminNotes && { adminNotes: convertedData.adminNotes }),
      ...(convertedData.trackingNumber && { trackingNumber: convertedData.trackingNumber }),
      ...(convertedData.cancelReason && { cancelReason: convertedData.cancelReason }),
      ...(convertedData.cancellationReason && { cancellationReason: convertedData.cancellationReason }),
      ...(convertedData.stockRestored !== undefined && { stockRestored: convertedData.stockRestored }),
      ...(convertedData.stockRestoredAt && { stockRestoredAt: convertedData.stockRestoredAt }),
    } as Order;
  }

  /**
   * Convert CartItem[] to OrderItem[] (For Website Orders)
   */
  private static convertCartItemsToOrderItems(
    cartItems: CartItem[]
  ): OrderItem[] {
    return cartItems.map((item) => {
      const actualPrice = this.calculateActualPrice(item.product, item.variantId);

      const orderItem: any = {
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        price: actualPrice,
        total: item.quantity * actualPrice,
      };

      // Only add variantId if it exists (avoid undefined)
      if (item.variantId) {
        orderItem.variantId = item.variantId;
      }

      return orderItem;
    });
  }

  /**
   * ✅ Convert Manual Items to Order Items (For Admin Manual Entry)
   * ქმნის "ფეიკ" პროდუქტის ობიექტს, რომ სისტემამ შეცდომა არ ამოაგდოს
   */
  private static async convertManualItemsToOrderItems(
    items: ManualOrderItem[]
  ): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      // If it's a real product, fetch the product data
      if (item.productId && !item.productId.startsWith("manual_")) {
        try {
          const productDoc = await getDoc(doc(db, "products", item.productId));
          if (productDoc.exists()) {
            const productData = productDoc.data() as Product;

            // Find variant if specified
            let variant: ProductVariant | undefined;
            if (item.variantId && productData.variants) {
              variant = productData.variants.find((v: ProductVariant) => v.id === item.variantId);
            }

            const orderItem: OrderItem = {
              productId: item.productId,
              product: productData,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
            };
            if (item.variantId) {
              orderItem.variantId = item.variantId;
            }
            if (variant) {
              orderItem.variant = variant;
            }
            orderItems.push(orderItem);
            continue;
          }
        } catch (error) {
          console.warn(`Failed to fetch product ${item.productId}:`, error);
        }
      }

      // Fallback for manual entries or failed product fetches
      const manualProduct: any = {
        id: item.productId || "manual_entry",
        productCode: "MANUAL",
        name: item.name,
        description: "Added manually by admin",
        price: item.price,
        images: [],
        category: "manual",
        stock: 0,
        hasVariants: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      // Only add weight if it exists
      if (item.weight) {
        manualProduct.weight = item.weight;
      }

      const manualOrderItem: OrderItem = {
        productId:
          item.productId ||
          `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product: manualProduct,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      };
      if (item.variantId) {
        manualOrderItem.variantId = item.variantId;
      }
      orderItems.push(manualOrderItem);
    }

    return orderItems;
  }

  /**
   * Calculate shipping cost
   */
  private static calculateShippingCost(city: string): number {
    if (city === "თბილისი" || city === "რუსთავი") {
      return 5;
    }
    return 10;
  }

  /**
   * ✅ Update Product Inventory (Race Condition Safe)
   * გამოიყენება როგორც website orders-ისთვის, ასევე manual orders-ისთვის
   */
  private static async updateProductInventory(
    items: { productId: string; quantity: number; variantId?: string }[],
    orderNumber?: string
  ): Promise<void> {
    // ვაგზავნით batch transaction-ს მხოლოდ ნამდვილი productId-ებისთვის
    const realProducts = items.filter(
      (item) =>
        item.productId &&
        !item.productId.startsWith("manual_") &&
        item.productId !== "manual_entry"
    );

    if (realProducts.length === 0) {
      console.log("📦 No real products to update inventory for");
      return;
    }

    console.log("🚨 updateProductInventory called!", {
      orderNumber,
      items: realProducts,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(0, 5).join('\n')
    });

    try {
      await runTransaction(db, async (transaction) => {
        // 1. დავაჯგუფოთ items productId-ით (ერთ პროდუქტში შესაძლოა მრავალი ვარიანტი იყოს)
        const groupedByProduct = new Map<string, typeof realProducts>();

        realProducts.forEach((item) => {
          if (!groupedByProduct.has(item.productId)) {
            groupedByProduct.set(item.productId, []);
          }
          groupedByProduct.get(item.productId)!.push(item);
        });

        // 2. წავიკითხოთ თითოეული unique product-ის მონაცემები
        const uniqueProductIds = Array.from(groupedByProduct.keys());
        const productRefs = uniqueProductIds.map((productId) =>
          doc(db, "products", productId)
        );

        const productDocs = await Promise.all(
          productRefs.map((ref) => transaction.get(ref))
        );

        // 3. თითოეული პროდუქტისთვის ავამუშაოთ ყველა ვარიანტი ერთდროულად
        for (let i = 0; i < productDocs.length; i++) {
          const productDoc = productDocs[i];
          const productId = uniqueProductIds[i];
          const itemsForThisProduct = groupedByProduct.get(productId)!;

          if (!productDoc.exists()) {
            throw new Error(`პროდუქტი ვერ მოიძებნა: ${productId}`);
          }

          const productData = productDoc.data();

          // ავამუშაოთ ვარიანტები და სიმპლური პროდუქტები ცალ-ცალკე
          const variantItems = itemsForThisProduct.filter(
            (item) => item.variantId
          );
          const simpleItems = itemsForThisProduct.filter(
            (item) => !item.variantId
          );

          let updateData: any = { updatedAt: Timestamp.now() };

          // ვარიანტების დამუშავება
          if (variantItems.length > 0) {
            const variants = [...(productData.variants || [])];

            variantItems.forEach((item) => {
              const variantIndex = variants.findIndex(
                (v) => v.id === item.variantId
              );

              if (variantIndex === -1) {
                throw new Error(`ვარიანტი ვერ მოიძებნა: ${item.variantId}`);
              }

              const currentVariantStock = variants[variantIndex].stock || 0;
              const newVariantStock = currentVariantStock - item.quantity;

              if (newVariantStock < 0) {
                throw new Error(
                  `არასაკმარისი რაოდენობა: "${productData.name}" (${variants[variantIndex].name}) (მოთხოვნილია: ${item.quantity}, ხელმისაწვდომია: ${currentVariantStock})`
                );
              }

              // Add stock history entry for this variant
              const existingVariantHistory = variants[variantIndex].stockHistory || [];
              const newHistoryEntry: StockHistory = {
                timestamp: new Date(),
                quantity: newVariantStock,
                reason: orderNumber ? `Order #${orderNumber}` : "Stock reduction",
                notes: `Stock reduced by ${item.quantity} (order completion)`
              };

              // განვაახლოთ ვარიანტის stock
              variants[variantIndex] = {
                ...variants[variantIndex],
                stock: newVariantStock,
                updatedAt: Timestamp.now(),
                stockHistory: [...existingVariantHistory, newHistoryEntry]
              };
            });

            updateData.variants = variants;

            // Calculate and update parent stock fields for consistency
            const totalStock = variants.reduce(
              (sum, variant) => sum + (variant.stock || 0),
              0
            );
            updateData.stock = totalStock;
            updateData.totalStock = totalStock;
          }

          // სიმპლური პროდუქტების დამუშავება
          if (simpleItems.length > 0) {
            const totalQuantityToDeduct = simpleItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            const currentStock = productData.stock || 0;
            const newStock = currentStock - totalQuantityToDeduct;

            if (newStock < 0) {
              throw new Error(
                `არასაკმარისი რაოდენობა: "${productData.name}" (მოთხოვნილია: ${totalQuantityToDeduct}, ხელმისაწვდომია: ${currentStock})`
              );
            }

            // Add stock history for simple product
            const existingProductHistory = productData.stockHistory || [];
            const newProductHistoryEntry: StockHistory = {
              timestamp: new Date(),
              quantity: newStock,
              reason: orderNumber ? `Order #${orderNumber}` : "Stock reduction",
              notes: `Stock reduced by ${totalQuantityToDeduct} (order completion)`
            };

            updateData.stock = newStock;
            updateData.totalStock = newStock; // Keep consistency for simple products
            updateData.stockHistory = [...existingProductHistory, newProductHistoryEntry];
          }

          // ერთიანი update ამ პროდუქტისთვის
          transaction.update(productRefs[i], updateData);
        }

        console.log("📦 Product inventory updated successfully in transaction");
      });
    } catch (error) {
      console.error("❌ Error updating product inventory:", error);
      throw error; // re-throw to prevent order creation
    }
  }

  /**
   * Get order by order number (needed for payment callback)
   */
  public static async getOrderByNumber(
    orderNumber: string
  ): Promise<Order | null> {
    try {
      // 1. ჯერ ვცადოთ ჩვეულებრივი მოძებნა (თუ user დალოგინებულია ან ადმინია)
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("orderNumber", "==", orderNumber),
          limit(1)
        );
        const querySnapshot = await getDocs(ordersQuery);

        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          const data = orderDoc.data();
          return this.createOrderObject(orderDoc, data);
        }
      } catch (authError) {
        // თუ უფლებების ერორია, ესეიგი Guest-ია, ვაგრძელებთ ქვემოთ...
      }

      // 2. თუ ზემოთ ვერ იპოვა ან ერორი იყო, ვცადოთ როგორც GUEST
      const guestQuery = query(
        collection(db, "orders"),
        where("orderNumber", "==", orderNumber),
        where("customerInfo.isGuest", "==", true), // 👈 აუცილებელია Rules-ისთვის!
        limit(1)
      );

      const guestSnapshot = await getDocs(guestQuery);

      if (guestSnapshot.empty) {
        console.log(`Order not found: ${orderNumber}`);
        return null;
      }

      const orderDoc = guestSnapshot.docs[0];
      const data = orderDoc.data();

      return this.createOrderObject(orderDoc, data);
    } catch (error) {
      console.error("Error getting order by number:", error);
      return null;
    }
  }

  /**
   * Get order by access token (for email links)
   */
  public static async getOrderByToken(
    orderNumber: string,
    accessToken: string
  ): Promise<Order | null> {
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderNumber", "==", orderNumber),
        where("accessToken", "==", accessToken),
        limit(1)
      );

      const querySnapshot = await getDocs(ordersQuery);

      if (querySnapshot.empty) {
        console.log(`Order not found with token: ${orderNumber}`);
        return null;
      }

      const orderDoc = querySnapshot.docs[0];
      const data = orderDoc.data();

      return this.createOrderObject(orderDoc, data);
    } catch (error) {
      console.error("Error getting order by token:", error);
      return null;
    }
  }

  /**
   * Cancel order and rollback inventory
   */
  public static async cancelOrder(
    orderId: string,
    reason: string = "User cancelled"
  ): Promise<void> {
    try {
      console.log(`🚫 Cancelling order ${orderId}: ${reason}`);

      // 1. Get order data
      const orderDoc = await getDoc(doc(db, this.COLLECTION_NAME, orderId));
      if (!orderDoc.exists()) {
        console.log(`Order ${orderId} not found`);
        return;
      }

      const orderData = orderDoc.data();

      // 2. Check if order is already cancelled
      if (orderData.orderStatus === "cancelled") {
        console.log(`Order ${orderId} is already cancelled`);
        throw new Error("შეკვეთა უკვე გაუქმებულია");
      }

      // Allow cancellation of orders in any status except already cancelled
      console.log(`📋 Cancelling order with status: ${orderData.orderStatus}, payment: ${orderData.paymentStatus}`);

      // 3. No inventory rollback for manual cancellations
      // Only automated expired order cleanup should rollback inventory
      console.log(`⚠️ Manual cancellation - inventory NOT restored automatically`);
      console.log(`📋 Admin should manually restore inventory if needed`);

      // 4. Update order status to cancelled
      await updateDoc(orderDoc.ref, {
        orderStatus: "cancelled",
        // Only update paymentStatus to failed if it was pending
        ...(orderData.paymentStatus === "pending" && { paymentStatus: "failed" }),
        cancelReason: reason,
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ Order ${orderId} cancelled successfully`);
    } catch (error) {
      console.error(`❌ Error cancelling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * ✅ RESTORE ORDER STOCK (Manual - Admin/Manager action)
   * მენეჯერი ხელით აბრუნებს გაუქმებული შეკვეთის პროდუქტების მარაგს
   */
  static async restoreOrderStock(orderId: string): Promise<void> {
    try {
      const orderDoc = await getDoc(doc(db, this.COLLECTION_NAME, orderId));
      if (!orderDoc.exists()) {
        throw new Error("შეკვეთა ვერ მოიძებნა");
      }

      const orderData = orderDoc.data();

      if (orderData.orderStatus !== "cancelled") {
        throw new Error("მარაგის დაბრუნება მხოლოდ გაუქმებულ შეკვეთებზეა შესაძლებელი");
      }

      if (orderData.stockRestored === true) {
        throw new Error("ამ შეკვეთის მარაგი უკვე დაბრუნებულია");
      }

      // inventory rollback
      const inventoryItems = (orderData.items || [])
        .filter((item: { productId?: string }) => item.productId && !item.productId.startsWith("manual_") && item.productId !== "manual_entry")
        .map((item: { productId: string; quantity: number; variantId?: string }) => ({
          productId: item.productId,
          quantity: item.quantity,
          ...(item.variantId ? { variantId: item.variantId } : {}),
        }));

      if (inventoryItems.length > 0) {
        await this.rollbackProductInventory(inventoryItems);
      }

      // შეკვეთაზე ვნიშნავთ რომ მარაგი დაბრუნდა
      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), {
        stockRestored: true,
        stockRestoredAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ Stock restored for cancelled order ${orderData.orderNumber}`);
    } catch (error) {
      console.error("❌ Error restoring order stock:", error);
      throw error;
    }
  }

  /**
   * Send Email Notification
   * Made public to be called from payment callback
   */
  public static async sendEmailNotification(order: Order): Promise<void> {
    // თუ მეილი არ არის მითითებული (მაგ: manual order-ის დროს), არ ვაგზავნით
    if (!order.customerInfo.email || order.customerInfo.email.trim() === "") {
      return;
    }

    try {
      // 1. მეილი კლიენტს
      await addDoc(collection(db, "mail"), {
        to: [order.customerInfo.email],
        message: {
          subject: `LifeStore - შეკვეთა მიღებულია! #${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">მადლობა შეკვეთისთვის!</h1>
              <p>გამარჯობა <strong>${order.customerInfo.firstName}</strong>,</p>
              <p>თქვენი შეკვეთა წარმატებით გაფორმდა.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>შეკვეთის ნომერი:</strong> ${
                  order.orderNumber
                }</p>
                <p style="margin: 5px 0;"><strong>თარიღი:</strong> ${new Date().toLocaleDateString(
                  "ka-GE"
                )}</p>
                <p style="margin: 5px 0; font-size: 18px;"><strong>ჯამური თანხა:</strong> ₾${order.totalAmount.toFixed(
                  2
                )}</p>
              </div>

              <div style="margin-top: 30px; text-align: center;">
                <a href="${SITE_CONFIG.BASE_URL}/order-success/${
            order.id
          }?action=print"
                   style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                   📄 ინვოისის ჩამოტვირთვა (PDF)
                </a>
              </div>
            </div>
          `,
        },
      });

      // 2. მეილი ადმინს (მხოლოდ თუ საიტიდანაა, manual-ზე შეიძლება არ იყოს საჭირო, მაგრამ იყოს)
      const adminEmail = ADMIN_CONFIG.EMAIL;
      await addDoc(collection(db, "mail"), {
        to: [adminEmail],
        message: {
          subject: `🔔 ახალი შეკვეთა: ${order.orderNumber} (${
            order.source || "website"
          })`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                🔔 ახალი შეკვეთა: ${order.orderNumber}
              </h2>

              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">📊 შეკვეთის დეტალები</h3>

                <p style="margin: 8px 0;">
                  <strong>📍 წყარო:</strong>
                  <span style="background-color: ${
                    order.source === "website" ? "#10b981" : "#f59e0b"
                  }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${order.source === "website" ? "🌐 ვებსაიტი" :
                      order.source === "instagram" ? "📱 Instagram" :
                      order.source === "facebook" ? "👥 Facebook" :
                      order.source === "tiktok" ? "🎵 TikTok" :
                      order.source === "phone" ? "📞 ტელეფონი" :
                      order.source === "personal" ? "🤝 პირადი" :
                      order.source || "🌐 ვებსაიტი"}
                  </span>
                </p>

                <p style="margin: 8px 0;"><strong>👤 კლიენტი:</strong> ${order.customerInfo.firstName} ${
            order.customerInfo.lastName
          }</p>
                <p style="margin: 8px 0;"><strong>📞 ტელეფონი:</strong> ${order.customerInfo.phone}</p>
                <p style="margin: 8px 0;"><strong>📧 იმეილი:</strong> ${order.customerInfo.email || "არ არის მითითებული"}</p>
                <p style="margin: 8px 0;"><strong>🏠 მისამართი:</strong> ${order.deliveryInfo.city}, ${order.deliveryInfo.address}</p>
                <p style="margin: 8px 0;"><strong>💰 გადახდის მეთოდი:</strong> ${
                  order.paymentMethod === "cash" ? "💵 ნაღდი ფული (ადგილზე)" : "💳 ბანკო კარტი"
                }</p>
                <p style="margin: 8px 0; font-size: 18px; color: #059669;">
                  <strong>💰 ჯამური თანხა:</strong> ₾${order.totalAmount.toFixed(2)}
                </p>
              </div>

              <div style="margin-top: 30px; text-align: center;">
                <a href="${SITE_CONFIG.BASE_URL}/admin"
                   style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                   🖥️ ადმინ პანელში ნახვა
                </a>
              </div>
            </div>
          `,
        },
      });

      console.log("📧 Email notifications queued successfully");
    } catch (error) {
      console.error("❌ Failed to queue email notifications:", error);
    }
  }

  /**
   * ✅ Rollback Product Inventory (Emergency Recovery)
   * With History Logging!
   */
  public static async rollbackProductInventory(
    items: { productId: string; quantity: number; variantId?: string }[]
  ): Promise<void> {
    const realProducts = items.filter(
      (item) =>
        item.productId &&
        !item.productId.startsWith("manual_") &&
        item.productId !== "manual_entry"
    );

    if (realProducts.length === 0) return;

    try {
      const batch = writeBatch(db);
      const timestamp = new Date(); // დროის ფიქსაცია

      // დაჯგუფება
      const groupedByProduct = new Map<string, typeof realProducts>();
      realProducts.forEach((item) => {
        if (!groupedByProduct.has(item.productId)) {
          groupedByProduct.set(item.productId, []);
        }
        groupedByProduct.get(item.productId)!.push(item);
      });

      // თითოეული პროდუქტისთვის
      for (const [productId, itemsForProduct] of groupedByProduct) {
        const productRef = doc(db, "products", productId);
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
          const productData = productDoc.data() as Product;
          let updateData: any = { updatedAt: Timestamp.now() };

          let currentHistory: StockHistory[] = productData.stockHistory || [];

          // Variants handling
          const variantItems = itemsForProduct.filter((item) => item.variantId);
          const simpleItems = itemsForProduct.filter((item) => !item.variantId);

          // 1. ვარიანტების უკან დაბრუნება
          if (variantItems.length > 0) {
            const variants = [...(productData.variants || [])];

            variantItems.forEach((item) => {
              const variantIndex = variants.findIndex((v) => v.id === item.variantId);

              if (variantIndex !== -1) {
                const oldStock = variants[variantIndex].stock || 0;
                const newStock = oldStock + item.quantity;

                // ✅ ისტორიის ჩანაწერი ვარიანტისთვის
                const historyEntry: StockHistory = {
                  timestamp: timestamp,
                  quantity: newStock,
                  reason: "Rollback (Error)",
                  notes: `System rollback: +${item.quantity} returned (create failed)`
                };

                const variantHistory = variants[variantIndex].stockHistory || [];

                variants[variantIndex] = {
                  ...variants[variantIndex],
                  stock: newStock,
                  stockHistory: [...variantHistory, historyEntry] // ვამატებთ ისტორიას
                };
              }
            });
            updateData.variants = variants;

            // მშობლის სტოკების განახლება
            const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
            updateData.stock = totalStock;
            updateData.totalStock = totalStock;
          }

          // 2. მარტივი პროდუქტის უკან დაბრუნება
          if (simpleItems.length > 0) {
            const totalQuantityToRestore = simpleItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            const currentStock = productData.stock || 0;
            const newStock = currentStock + totalQuantityToRestore;

            // ✅ ისტორიის ჩანაწერი!
            const historyEntry: StockHistory = {
               timestamp: timestamp,
               quantity: newStock,
               reason: "Rollback (Error)",
               notes: `System rollback: +${totalQuantityToRestore} returned (create failed)`
            };

            currentHistory.push(historyEntry);

            updateData.stock = newStock;
            updateData.totalStock = newStock;
          }

          // ისტორიის განახლება
          updateData.stockHistory = currentHistory;

          batch.update(productRef, updateData);
        }
      }

      await batch.commit();
      console.log("🔄 Product inventory rollback completed WITH HISTORY");
    } catch (error) {
      console.error("❌ Error during inventory rollback:", error);
    }
  }

  /**
   * Create new order (FROM WEBSITE) - ✅ With Inventory Management
   */
  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // ვამზადებთ აიტემებს inventory-სთვის
    const orderItems = this.convertCartItemsToOrderItems(orderData.items);
    const inventoryItems = orderItems.map((item) => {
      const inventoryItem: any = {
        productId: item.productId,
        quantity: item.quantity,
      };

      // Include variantId if it exists
      if (item.variantId) {
        inventoryItem.variantId = item.variantId;
      }

      return inventoryItem;
    });

    try {
      const orderNumber = this.generateOrderNumber();
      const accessToken = this.generateAccessToken(); // ✅ უნიქალური token

      // ✅ 1. TRANSACTION: Update inventory first
      await this.updateProductInventory(inventoryItems, orderNumber);

      // ✅ 2. Create order
      const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
      const shippingCost = this.calculateShippingCost(
        orderData.deliveryInfo.city
      );
      const totalAmount = subtotal + shippingCost;

      const orderRef = doc(collection(db, this.COLLECTION_NAME));

      const order: Order = {
        id: orderRef.id,
        userId: orderData.userId || null,
        orderNumber,
        accessToken, // ✅ უნიქალური token
        source: "website",
        items: orderItems,
        subtotal,
        shippingCost,
        totalAmount,
        customerInfo: {
          ...orderData.customerInfo,
          isGuest: orderData.userId === null || orderData.userId === undefined,
        },
        deliveryInfo: {
          ...orderData.deliveryInfo,
          shippingCost
        },
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "pending",
        orderStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const firestorePayload = {
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.fromDate(order.updatedAt),
      };

      await setDoc(orderRef, firestorePayload);

      console.log("✅ Order created successfully:", orderNumber);

      // ✅ ნაღდი ფულით გადახდისთვის მაშინვე ვაგზავნოთ email notifications
      if (orderData.paymentMethod === "cash") {
        console.log("💰 Cash payment detected - sending email notifications immediately");
        try {
          await this.sendEmailNotification(order);
        } catch (emailError) {
          console.error("❌ Failed to send email notification:", emailError);
          // არ ვაფაილებთ შეკვეთას email ერორის გამო
        }
      }
      // ✅ კარტით გადახდისთვის email გაიგზავნება payment callback-ში

      return order;
    } catch (error) {
      console.error("❌ Error creating order:", error);

      // 🛑 ROLLBACK: თუ შეკვეთის შექმნა ჩავარდა, მაგრამ მარაგი უკვე მოკლებულია
      // ვამოწმებთ, რომ შეცდომა "არასაკმარისი რაოდენობა" არ არის (მაგ დროს მარაგი ისედაც არ მოკლებულა)
      const isInventoryError =
        error instanceof Error &&
        error.message.includes("არასაკმარისი რაოდენობა");

      if (!isInventoryError) {
        console.log(
          "🔄 Performing inventory rollback due to order creation failure..."
        );
        await this.rollbackProductInventory(inventoryItems);
      }

      if (isInventoryError) {
        throw error; // ვაბრუნებთ სტოკის ერორს კლიენტთან
      }
      throw new Error("შეკვეთის შექმნა ვერ მოხერხდა");
    }
  }

  /**
   * ✅ CREATE MANUAL ORDER (FROM ADMIN PANEL) - With Inventory Management
   * ეს ფუნქცია გამოიძახება მენეჯერის მიერ ხელით დამატებისას
   */

  static async createManualOrder(
    data: CreateManualOrderRequest
  ): Promise<Order> {
    // 1. ვამზადებთ აიტემებს
    const orderItems = await this.convertManualItemsToOrderItems(data.items);

    // ვფილტრავთ მხოლოდ რეალურ პროდუქტებს ინვენტარისთვის
    const inventoryItems = data.items
      .filter((item) => item.productId && !item.productId.startsWith("manual_"))
      .map((item) => {
        const inventoryItem: any = {
          productId: item.productId!,
          quantity: item.quantity,
        };

        // Include variantId if it exists
        if (item.variantId) {
          inventoryItem.variantId = item.variantId;
        }

        return inventoryItem;
      });

    try {
      const orderNumber = this.generateOrderNumber();
      const accessToken = this.generateAccessToken(); // ✅ უნიქალური token

      // ✅ 2. TRANSACTION: Update inventory
      if (inventoryItems.length > 0) {
        await this.updateProductInventory(inventoryItems, orderNumber);
      }

      // 3. Create Order Object
      const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
      const totalAmount = subtotal + data.shippingCost;
      const orderRef = doc(collection(db, this.COLLECTION_NAME));

      const order: Order = {
        id: orderRef.id,
        userId: null,
        orderNumber,
        accessToken, // ✅ უნიქალური token
        source: data.source,
        items: orderItems,
        subtotal,
        shippingCost: data.shippingCost,
        totalAmount,
        customerInfo: {
          firstName: data.customerInfo.firstName,
          lastName: data.customerInfo.lastName,
          phone: data.customerInfo.phone,
          email: data.customerInfo.email || "",
          isGuest: true,
        },
        deliveryInfo: {
          ...data.deliveryInfo,
          shippingCost: data.shippingCost
        },
        paymentMethod: data.paymentMethod,
        paymentStatus:
          data.status === "delivered" ||
          data.status === "shipped" ||
          data.paymentMethod === "cash"
            ? "paid"
            : "pending",
        orderStatus: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        adminNotes: "Manually added via Admin Panel",
      };

      const firestorePayload = this.cleanObject({
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.fromDate(order.updatedAt),
      });

      console.log("🔍 Order object before save:", {
        orderNumber,
        orderKeys: Object.keys(order),
        payloadKeys: Object.keys(firestorePayload),
        undefinedFields: Object.entries(firestorePayload).filter(([_, v]) => v === undefined).map(([k]) => k)
      });

      // 4. Save
      await setDoc(orderRef, firestorePayload);
      console.log("✅ Manual Order created successfully:", orderNumber);

      if (data.customerInfo.email) {
        this.sendEmailNotification(order);
      }

      return order;
    } catch (error) {
      console.error("❌ Error creating manual order:", error);

      if (error instanceof Error) {
        console.error("🔍 Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 8).join('\n')
        });
      }

      // 🛑 ROLLBACK
      const isInventoryError =
        error instanceof Error &&
        error.message.includes("არასაკმარისი რაოდენობა");

      if (!isInventoryError && inventoryItems.length > 0) {
        console.log("🔄 Performing manual order rollback...");
        await this.rollbackProductInventory(inventoryItems);
      }

      if (isInventoryError) {
        throw error;
      }
      throw new Error("მექანიკური შეკვეთის შექმნა ვერ მოხერხდა");
    }
  }

  /**
   * ✅ ADJUST INVENTORY FOR ORDER EDIT (Diff-based, Atomic Transaction)
   * ითვლის ძველ და ახალ items-ებს შორის სხვაობას და ატომურად ასწორებს stock-ს
   */
  private static async adjustInventoryForOrderEdit(
    oldItems: { productId: string; quantity: number; variantId?: string }[],
    newItems: { productId: string; quantity: number; variantId?: string }[],
    orderNumber: string
  ): Promise<void> {
    // ვაგზავნით მხოლოდ რეალური პროდუქტების items-ებს
    const filterReal = (
      items: { productId: string; quantity: number; variantId?: string }[]
    ) =>
      items.filter(
        (i) => i.productId && !i.productId.startsWith("manual_") && i.productId !== "manual_entry"
      );

    const realOld = filterReal(oldItems);
    const realNew = filterReal(newItems);

    // key = productId|variantId (ან productId| თუ variant არ არის)
    const makeKey = (productId: string, variantId?: string) =>
      `${productId}|${variantId || ""}`;

    // ვაგებთ map-ებს
    const oldMap = new Map<string, { productId: string; quantity: number; variantId?: string }>();
    realOld.forEach((i) => oldMap.set(makeKey(i.productId, i.variantId), i));

    const newMap = new Map<string, { productId: string; quantity: number; variantId?: string }>();
    realNew.forEach((i) => newMap.set(makeKey(i.productId, i.variantId), i));

    // ვითვლით diff-ს: positive = მეტი ჩამოვაჭრათ, negative = დავაბრუნოთ
    const diffs = new Map<string, { productId: string; variantId?: string; diff: number }>();

    // ძველი items
    oldMap.forEach((item, key) => {
      const newItem = newMap.get(key);
      const newQty = newItem ? newItem.quantity : 0;
      const diff = newQty - item.quantity; // negative = restore, positive = deduct more
      if (diff !== 0) {
        diffs.set(key, { productId: item.productId, variantId: item.variantId, diff });
      }
    });

    // ახალი items, რომლებიც ძველში არ იყო (სრულად ახალი პროდუქტები)
    newMap.forEach((item, key) => {
      if (!oldMap.has(key)) {
        diffs.set(key, { productId: item.productId, variantId: item.variantId, diff: item.quantity });
      }
    });

    if (diffs.size === 0) {
      console.log("📦 No inventory changes needed for order edit");
      return;
    }

    // დავაჯგუფოთ productId-ით
    const groupedByProduct = new Map<string, { variantId?: string; diff: number }[]>();
    diffs.forEach(({ productId, variantId, diff }) => {
      if (!groupedByProduct.has(productId)) {
        groupedByProduct.set(productId, []);
      }
      groupedByProduct.get(productId)!.push({ variantId, diff });
    });

    const uniqueProductIds = Array.from(groupedByProduct.keys());
    const productRefs = uniqueProductIds.map((id) => doc(db, "products", id));

    try {
      await runTransaction(db, async (transaction) => {
        const productDocs = await Promise.all(
          productRefs.map((ref) => transaction.get(ref))
        );

        for (let i = 0; i < productDocs.length; i++) {
          const productDoc = productDocs[i];
          const productId = uniqueProductIds[i];
          const diffsForProduct = groupedByProduct.get(productId)!;

          if (!productDoc.exists()) {
            throw new Error(`პროდუქტი ვერ მოიძებნა: ${productId}`);
          }

          const productData = productDoc.data();
          const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };

          const variantDiffs = diffsForProduct.filter((d) => d.variantId);
          const simpleDiffs = diffsForProduct.filter((d) => !d.variantId);

          if (variantDiffs.length > 0) {
            const variants = [...(productData.variants || [])];

            variantDiffs.forEach(({ variantId, diff }) => {
              const variantIndex = variants.findIndex((v) => v.id === variantId);
              if (variantIndex === -1) {
                throw new Error(`ვარიანტი ვერ მოიძებნა: ${variantId}`);
              }

              const currentStock = variants[variantIndex].stock || 0;
              const newStock = currentStock - diff; // diff>0 deduct, diff<0 restore

              if (newStock < 0) {
                throw new Error(
                  `არასაკმარისი მარაგი: "${productData.name}" (${variants[variantIndex].name}) (ხელმისაწვდომია: ${currentStock}, საჭირო: ${diff})`
                );
              }

              const existingHistory = variants[variantIndex].stockHistory || [];
              const historyEntry: StockHistory = {
                timestamp: new Date(),
                quantity: newStock,
                reason: `Order Edit #${orderNumber}`,
                notes: diff > 0
                  ? `Stock reduced by ${diff} (order edit)`
                  : `Stock restored by ${Math.abs(diff)} (order edit)`,
              };

              variants[variantIndex] = {
                ...variants[variantIndex],
                stock: newStock,
                updatedAt: Timestamp.now(),
                stockHistory: [...existingHistory, historyEntry],
              };
            });

            updateData.variants = variants;
            updateData.stock = variants.reduce((sum: number, v: { stock?: number }) => sum + (v.stock || 0), 0);
            updateData.totalStock = updateData.stock;
          }

          if (simpleDiffs.length > 0) {
            const totalDiff = simpleDiffs.reduce((sum, d) => sum + d.diff, 0);
            const currentStock = productData.stock || 0;
            const newStock = currentStock - totalDiff;

            if (newStock < 0) {
              throw new Error(
                `არასაკმარისი მარაგი: "${productData.name}" (ხელმისაწვდომია: ${currentStock}, საჭირო: ${totalDiff})`
              );
            }

            const existingHistory = productData.stockHistory || [];
            const historyEntry: StockHistory = {
              timestamp: new Date(),
              quantity: newStock,
              reason: `Order Edit #${orderNumber}`,
              notes: totalDiff > 0
                ? `Stock reduced by ${totalDiff} (order edit)`
                : `Stock restored by ${Math.abs(totalDiff)} (order edit)`,
            };

            updateData.stock = newStock;
            updateData.totalStock = newStock;
            updateData.stockHistory = [...existingHistory, historyEntry];
          }

          transaction.update(productRefs[i], updateData);
        }

        console.log("📦 Inventory adjusted for order edit successfully");
      });
    } catch (error) {
      console.error("❌ Error adjusting inventory for order edit:", error);
      throw error;
    }
  }

  /**
   * ✅ UPDATE MANUAL ORDER (FROM ADMIN PANEL)
   * განაახლებს ხელით გატარებულ შეკვეთას და ასწორებს inventory-ს diff-ის მიხედვით
   */
  static async updateManualOrder(
    orderId: string,
    data: UpdateManualOrderRequest,
    originalOrder: Order
  ): Promise<void> {
    // 1. ვამზადებთ ახალ items-ებს
    const newOrderItems = await this.convertManualItemsToOrderItems(data.items);

    // 2. ძველი inventory items (originalOrder-იდან)
    const oldInventoryItems = originalOrder.items
      .filter((item) => item.productId && !item.productId.startsWith("manual_") && item.productId !== "manual_entry")
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        ...(item.variantId ? { variantId: item.variantId } : {}),
      }));

    // 3. ახალი inventory items
    const newInventoryItems = data.items
      .filter((item) => item.productId && !item.productId.startsWith("manual_"))
      .map((item) => ({
        productId: item.productId!,
        quantity: item.quantity,
        ...(item.variantId ? { variantId: item.variantId } : {}),
      }));

    try {
      // 4. Inventory diff - atomic transaction
      await this.adjustInventoryForOrderEdit(
        oldInventoryItems,
        newInventoryItems,
        originalOrder.orderNumber
      );

      // 5. გამოვთვალოთ ახალი totals
      const subtotal = newOrderItems.reduce((sum, item) => sum + item.total, 0);
      const totalAmount = subtotal + data.shippingCost;

      // 6. განვაახლოთ Firestore document
      const updatePayload = this.cleanObject({
        source: data.source,
        items: newOrderItems,
        subtotal,
        shippingCost: data.shippingCost,
        totalAmount,
        customerInfo: {
          firstName: data.customerInfo.firstName,
          lastName: data.customerInfo.lastName,
          phone: data.customerInfo.phone,
          email: data.customerInfo.email || "",
          isGuest: true,
        },
        deliveryInfo: {
          ...data.deliveryInfo,
          shippingCost: data.shippingCost,
        },
        paymentMethod: data.paymentMethod,
        updatedAt: Timestamp.now(),
        adminNotes: "Manually added via Admin Panel",
      });

      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), updatePayload);

      console.log(`✅ Manual order ${originalOrder.orderNumber} updated successfully`);
    } catch (error) {
      console.error("❌ Error updating manual order:", error);
      throw error;
    }
  }

  // --- დანარჩენი მეთოდები უცვლელია ---

  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, this.COLLECTION_NAME, orderId));
      if (!orderDoc.exists()) return null;
      const data = orderDoc.data();
      return this.createOrderObject(orderDoc, data);
    } catch (error) {
      console.error("❌ Error getting order:", error);
      throw new Error("შეკვეთის მოძიება ვერ მოხერხდა");
    }
  }

  // Removed duplicate getOrderByNumber method - using the one above instead

  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const ordersRef = collection(db, this.COLLECTION_NAME);
      const userQuery = query(ordersRef, where("userId", "==", userId));
      const snapshot = await getDocs(userQuery);
      const orders = snapshot.docs.map((doc) => {
        const data = doc.data();
        return this.createOrderObject(doc, data);
      });
      return orders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error("❌ Error getting user orders:", error);
      throw new Error("შეკვეთების მოძიება ვერ მოხერხდა");
    }
  }

  static async getAllOrders(): Promise<Order[]> {
    try {
      const ordersRef = collection(db, this.COLLECTION_NAME);
      const allQuery = query(ordersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(allQuery);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return this.createOrderObject(doc, data);
      });
    } catch (error) {
      console.error("❌ Error getting all orders:", error);
      throw new Error("შეკვეთების მოძიება ვერ მოხერხდა");
    }
  }

  /**
   * Subscribe to real-time orders updates
   */
  static subscribeToOrders(
    callback: (orders: Order[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const ordersRef = collection(db, this.COLLECTION_NAME);
      const allQuery = query(ordersRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        allQuery,
        (snapshot) => {
          const orders = snapshot.docs.map((doc) => {
            const data = doc.data();

            // Log if createdAt is missing
            if (!data.createdAt) {
              console.warn("⚠️ Order missing createdAt:", {
                orderNumber: data.orderNumber,
                docId: doc.id,
                data: Object.keys(data)
              });
            }

            const toDate = (value: any): Date | undefined => this.toDateSafe(value);

            return {
              ...this.createOrderObject(doc, data),
              // Override with safe date conversion for real-time subscription
              // Never fall back to "now" for createdAt because it makes old orders look like today's.
              // If createdAt is missing/invalid (legacy docs), fall back to updatedAt, else epoch.
              createdAt: toDate(data.createdAt) || toDate(data.updatedAt) || new Date(0),
              updatedAt:
                toDate(data.updatedAt) ||
                toDate(data.createdAt) ||
                new Date(0),
              paidAt: toDate(data.paidAt),
              deliveredAt: toDate(data.deliveredAt),
              cancelledAt: toDate(data.cancelledAt),
            };
          });
          callback(orders);
        },
        (error) => {
          console.error("❌ Error in orders subscription:", error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("❌ Error setting up orders subscription:", error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  static async updateOrderStatus(
    orderId: string,
    status: Order["orderStatus"]
  ): Promise<void> {
    try {
      const orderRef = doc(db, this.COLLECTION_NAME, orderId);
      const updates: any = {
        orderStatus: status,
        updatedAt: Timestamp.now(),
      };
      if (status === "delivered") {
        updates.deliveredAt = Timestamp.now();
      } else {
        updates.deliveredAt = deleteField();
      }
      await updateDoc(orderRef, updates);
      console.log("✅ Order status updated:", orderId, status);
    } catch (error) {
      console.error("❌ Error updating order status:", error);
      throw new Error("სტატუსის განახლება ვერ მოხერხდა");
    }
  }

  static async addAdminNotes(orderId: string, notes: string): Promise<void> {
    try {
      const orderRef = doc(db, this.COLLECTION_NAME, orderId);
      await updateDoc(orderRef, {
        adminNotes: notes,
        updatedAt: Timestamp.now(),
      });
      console.log("✅ Admin notes added to order:", orderId);
    } catch (error) {
      console.error("❌ Error adding admin notes:", error);
      throw new Error("კომენტარის დამატება ვერ მოხერხდა");
    }
  }

  static async addTrackingNumber(
    orderId: string,
    trackingNumber: string
  ): Promise<void> {
    try {
      const orderRef = doc(db, this.COLLECTION_NAME, orderId);
      await updateDoc(orderRef, {
        trackingNumber,
        updatedAt: Timestamp.now(),
      });
      console.log(
        "✅ Tracking number added to order:",
        orderId,
        trackingNumber
      );
    } catch (error) {
      console.error("❌ Error adding tracking number:", error);
      throw new Error("ტრეკინგ კოდის დამატება ვერ მოხერხდა");
    }
  }

  static async deleteOrder(orderId: string): Promise<void> {
    try {
      const orderRef = doc(db, this.COLLECTION_NAME, orderId);
      await deleteDoc(orderRef);
      console.log("✅ Order deleted successfully:", orderId);
    } catch (error) {
      console.error("❌ Error deleting order:", error);
      throw new Error("შეკვეთის წაშლა ვერ მოხერხდა");
    }
  }
}
