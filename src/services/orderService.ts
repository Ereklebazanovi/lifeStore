import {
  collection,
  doc,
  setDoc,
  addDoc, // ✅ დამატებულია
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, CreateOrderRequest, CartItem, OrderItem } from "../types";

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
   * Convert CartItem[] to OrderItem[]
   */
  private static convertCartItemsToOrderItems(
    cartItems: CartItem[]
  ): OrderItem[] {
    return cartItems.map((item) => ({
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      price: item.product.price,
      total: item.quantity * item.product.price,
    }));
  }

  /**
   * Calculate shipping cost
   */
  private static calculateShippingCost(city: string): number {
    return city === "თბილისი" ? 0 : 7;
  }

  /**
   * ✅ SEND EMAIL NOTIFICATION (ახალი ფუნქცია)
   * აგზავნის მეილს კლიენტთან და ადმინთან
   */
  private static async sendEmailNotification(order: Order): Promise<void> {
    try {
      // 1. მეილი კლიენტს (Customer Confirmation)
      await addDoc(collection(db, "mail"), {
        to: [order.customerInfo.email],
        message: {
          subject: `LifeStore - შეკვეთა მიღებულია! #${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">მადლობა შეკვეთისთვის!</h1>
              <p>გამარჯობა <strong>${order.customerInfo.firstName}</strong>,</p>
              <p>თქვენი შეკვეთა წარმატებით გაფორმდა და მუშავდება.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>შეკვეთის ნომერი:</strong> ${order.orderNumber}</p>
                <p style="margin: 5px 0;"><strong>თარიღი:</strong> ${new Date().toLocaleDateString('ka-GE')}</p>
                <p style="margin: 5px 0; font-size: 18px;"><strong>ჯამური თანხა:</strong> ₾${order.totalAmount.toFixed(2)}</p>
              </div>

              <p>ჩვენი მენეჯერი მალე დაგიკავშირდებათ ან მოგივათ შეტყობინება სტატუსის ცვლილების შესახებ.</p>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="https://lifestore.ge/order-success/${order.id}" 
                   style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                   შეკვეთის დეტალები
                </a>
              </div>
            </div>
          `,
        },
      });

      // 2. მეილი ადმინს (Notification)
      // აქ მითითებულია ის მეილი, რომელიც შენ დააყენე
      const adminEmail = "bazanovierekle4@gmail.com"; 

      await addDoc(collection(db, "mail"), {
        to: [adminEmail],
        message: {
          subject: `🔔 ახალი შეკვეთა: ${order.orderNumber} (₾${order.totalAmount})`,
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2 style="color: #2563eb;">ახალი შეკვეთა საიტიდან!</h2>
              <ul style="line-height: 1.6; font-size: 16px;">
                <li><strong>კლიენტი:</strong> ${order.customerInfo.firstName} ${order.customerInfo.lastName}</li>
                <li><strong>ტელეფონი:</strong> <a href="tel:${order.customerInfo.phone}">${order.customerInfo.phone}</a></li>
                <li><strong>ქალაქი:</strong> ${order.deliveryInfo.city}</li>
                <li><strong>მისამართი:</strong> ${order.deliveryInfo.address}</li>
                <li><strong>გადახდა:</strong> ${order.paymentMethod}</li>
                <li style="margin-top: 10px;"><strong>თანხა:</strong> <span style="color: #059669; font-weight: bold;">₾${order.totalAmount.toFixed(2)}</span></li>
              </ul>
              <hr style="border: 1px solid #eee; margin: 20px 0;"/>
              <p>
                <a href="https://lifestore.ge/admin" style="color: #2563eb; font-weight: bold; font-size: 16px;">
                  გადადი ადმინ პანელში
                </a>
              </p>
            </div>
          `,
        },
      });

      console.log("📧 Email notifications queued successfully");
    } catch (error) {
      console.error("❌ Failed to queue email notifications:", error);
      // არ ვისვრით ერორს (throw), რადგან შეკვეთა უკვე შექმნილია და კლიენტი არ უნდა შევაფერხოთ
    }
  }

  /**
   * Create new order
   */
  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const orderNumber = this.generateOrderNumber();
      const orderItems = this.convertCartItemsToOrderItems(orderData.items);

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

      // Save to Firestore
      await setDoc(orderRef, firestorePayload);

      console.log("✅ Order created successfully:", orderNumber);

      // ✅ გამოვიძახოთ მეილის გაგზავნა (Async, არ ველოდებით)
      this.sendEmailNotification(order);

      return order;
    } catch (error) {
      console.error("❌ Error creating order:", error);
      throw new Error("შეკვეთის შექმნა ვერ მოხერხდა");
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
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        deliveredAt: data.deliveredAt?.toDate(),
      } as Order;
    } catch (error) {
      console.error("❌ Error getting order:", error);
      throw new Error("შეკვეთის მოძიება ვერ მოხერხდა");
    }
  }

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
      return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      console.log("✅ Tracking number added to order:", orderId, trackingNumber);
    } catch (error) {
      console.error("❌ Error adding tracking number:", error);
      throw new Error("ტრეკინგ კოდის დამატება ვერ მოხერხდა");
    }
  }
}