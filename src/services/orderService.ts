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
  runTransaction,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { ADMIN_CONFIG, SITE_CONFIG } from "../config/constants";
import type {
  Order,
  CreateOrderRequest,
  CreateManualOrderRequest, // ✅ დაემატა
  CartItem,
  OrderItem,
  ManualOrderItem, // ✅ დაემატა
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
   * Convert CartItem[] to OrderItem[] (For Website Orders)
   */
  private static convertCartItemsToOrderItems(
    cartItems: CartItem[]
  ): OrderItem[] {
    return cartItems.map((item) => {
      const orderItem: any = {
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        price: (() => {
          // Calculate correct price (considering sale price and variants)
          let actualPrice = item.product.price || 0;

          // Check if this is a variant product
          if (item.variantId && item.product.variants) {
            const variant = item.product.variants.find(v => v.id === item.variantId);
            if (variant) {
              // Use sale price if available and lower than regular price
              actualPrice = variant.salePrice && variant.salePrice < variant.price
                ? variant.salePrice
                : variant.price;
            }
          } else {
            // For simple products, check if there's a sale price
            if (item.product.salePrice && item.product.salePrice < item.product.price) {
              actualPrice = item.product.salePrice;
            }
          }
          return actualPrice;
        })(),
        total: (() => {
          // Calculate total with actual price
          let actualPrice = item.product.price || 0;

          if (item.variantId && item.product.variants) {
            const variant = item.product.variants.find(v => v.id === item.variantId);
            if (variant) {
              actualPrice = variant.salePrice && variant.salePrice < variant.price
                ? variant.salePrice
                : variant.price;
            }
          } else {
            if (item.product.salePrice && item.product.salePrice < item.product.price) {
              actualPrice = item.product.salePrice;
            }
          }
          return item.quantity * actualPrice;
        })(),
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
  private static convertManualItemsToOrderItems(
    items: ManualOrderItem[]
  ): OrderItem[] {
    return items.map((item) => ({
      productId:
        item.productId ||
        `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ✅ იყენებს product ID-ს თუ არის, სხვაგვარად ქმნის manual ID-ს
      product: {
        id: item.productId || "manual_entry",
        name: item.name,
        description: "Added manually by admin",
        price: item.price,
        images: [], // სურათის გარეშე (PDF-ში გამოჩნდება პაკეტის აიკონი)
        category: "manual",
        stock: 0,
        hasVariants: false, // Manual entries are simple products
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      },
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }));
  }

  /**
   * Calculate shipping cost
   */
  private static calculateShippingCost(city: string): number {
    return city === "თბილისი" ? 0 : 7;
  }

  /**
   * ✅ Update Product Inventory (Race Condition Safe)
   * გამოიყენება როგორც website orders-ისთვის, ასევე manual orders-ისთვის
   */
  private static async updateProductInventory(
    items: { productId: string; quantity: number; variantId?: string }[]
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

              // განვაახლოთ ვარიანტის stock
              variants[variantIndex] = {
                ...variants[variantIndex],
                stock: newVariantStock,
                updatedAt: Timestamp.now(),
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

            updateData.stock = newStock;
            updateData.totalStock = newStock; // Keep consistency for simple products
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
          return {
            id: orderDoc.id,
            userId: data.userId,
            orderNumber: data.orderNumber,
            source: data.source,
            items: data.items,
            subtotal: data.subtotal,
            shippingCost: data.shippingCost,
            totalAmount: data.totalAmount,
            customerInfo: data.customerInfo,
            deliveryInfo: data.deliveryInfo,
            orderStatus: data.orderStatus,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            paidAt: data.paidAt?.toDate(),
          } as Order;
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

      return {
        id: orderDoc.id,
        userId: data.userId,
        orderNumber: data.orderNumber,
        source: data.source,
        items: data.items,
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        totalAmount: data.totalAmount,
        customerInfo: data.customerInfo,
        deliveryInfo: data.deliveryInfo,
        orderStatus: data.orderStatus,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        paidAt: data.paidAt?.toDate(),
      } as Order;
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

      return {
        id: orderDoc.id,
        userId: data.userId,
        orderNumber: data.orderNumber,
        accessToken: data.accessToken,
        source: data.source,
        items: data.items,
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        totalAmount: data.totalAmount,
        customerInfo: data.customerInfo,
        deliveryInfo: data.deliveryInfo,
        orderStatus: data.orderStatus,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        paidAt: data.paidAt?.toDate(),
      } as Order;
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

      // 2. Only cancel if order is still pending
      if (
        orderData.paymentStatus !== "pending" ||
        orderData.orderStatus !== "pending"
      ) {
        console.log(`Order ${orderId} is not pending, cannot cancel`);
        return;
      }

      // 3. Rollback inventory
      const inventoryItems = orderData.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      await this.rollbackProductInventory(inventoryItems);

      // 4. Update order status
      await updateDoc(orderDoc.ref, {
        orderStatus: "cancelled",
        paymentStatus: "failed",
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
                <a href="${SITE_CONFIG.BASE_URL}/admin/orders"
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
   * გამოიყენება თუ order creation-ის შემდეგ რაიმე შეცდომა მოხდება
   */
  private static async rollbackProductInventory(
    items: { productId: string; quantity: number; variantId?: string }[]
  ): Promise<void> {
    const realProducts = items.filter(
      (item) =>
        item.productId &&
        !item.productId.startsWith("manual_") &&
        item.productId !== "manual_entry"
    );

    if (realProducts.length === 0) {
      return;
    }

    try {
      const batch = writeBatch(db);

      // Group items by productId for efficient rollback
      const groupedByProduct = new Map<string, typeof realProducts>();
      realProducts.forEach((item) => {
        if (!groupedByProduct.has(item.productId)) {
          groupedByProduct.set(item.productId, []);
        }
        groupedByProduct.get(item.productId)!.push(item);
      });

      for (const [productId, itemsForProduct] of groupedByProduct) {
        const productRef = doc(db, "products", productId);

        // დავაბრუნოთ უკან stock (დავამატოთ რაოდენობა)
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          const productData = productDoc.data();
          let updateData: any = { updatedAt: Timestamp.now() };

          // Handle variants and simple products
          const variantItems = itemsForProduct.filter((item) => item.variantId);
          const simpleItems = itemsForProduct.filter((item) => !item.variantId);

          // Rollback variant stocks
          if (variantItems.length > 0) {
            const variants = [...(productData.variants || [])];
            variantItems.forEach((item) => {
              const variantIndex = variants.findIndex(
                (v) => v.id === item.variantId
              );
              if (variantIndex !== -1) {
                variants[variantIndex] = {
                  ...variants[variantIndex],
                  stock: (variants[variantIndex].stock || 0) + item.quantity,
                  updatedAt: Timestamp.now(),
                };
              }
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

          // Rollback simple product stock
          if (simpleItems.length > 0) {
            const totalQuantityToRestore = simpleItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            const currentStock = productData.stock || 0;
            updateData.stock = currentStock + totalQuantityToRestore;
            updateData.totalStock = currentStock + totalQuantityToRestore; // Keep consistency for simple products
          }

          batch.update(productRef, updateData);
        }
      }

      await batch.commit();
      console.log("🔄 Product inventory rollback completed");
    } catch (error) {
      console.error("❌ Error during inventory rollback:", error);
      // ეს არ უნდა fail-დეს, მაგრამ უნდა ვიცოდეთ რა მოხდა
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
      await this.updateProductInventory(inventoryItems);

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
        deliveryInfo: orderData.deliveryInfo,
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
    const orderItems = this.convertManualItemsToOrderItems(data.items);

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
        await this.updateProductInventory(inventoryItems);
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
        deliveryInfo: data.deliveryInfo,
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

      const firestorePayload = {
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.fromDate(order.updatedAt),
      };

      // 4. Save
      await setDoc(orderRef, firestorePayload);
      console.log("✅ Manual Order created successfully:", orderNumber);

      if (data.customerInfo.email) {
        this.sendEmailNotification(order);
      }

      return order;
    } catch (error) {
      console.error("❌ Error creating manual order:", error);

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

  // --- დანარჩენი მეთოდები უცვლელია ---

  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, this.COLLECTION_NAME, orderId));
      if (!orderDoc.exists()) return null;
      const data = orderDoc.data();
      return {
        ...data,
        id: orderDoc.id, // Add document ID
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
        paidAt: data.paidAt?.toDate(), // Add paidAt
      } as Order;
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
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
        } as Order;
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
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
        } as Order;
      });
    } catch (error) {
      console.error("❌ Error getting all orders:", error);
      throw new Error("შეკვეთების მოძიება ვერ მოხერხდა");
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
