import {
  collection,
  doc,
  setDoc,
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
   * Generate unique order number in format LS-YYYY###
   */
  private static async generateOrderNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();

    // Get count of orders for current year
    const ordersRef = collection(db, this.COLLECTION_NAME);
    const yearQuery = query(
      ordersRef,
      where("orderNumber", ">=", `LS-${currentYear}000`),
      where("orderNumber", "<=", `LS-${currentYear}999`)
    );

    const snapshot = await getDocs(yearQuery);
    const orderCount = snapshot.size;

    // Generate next number
    const nextNumber = String(orderCount + 1).padStart(3, "0");
    return `LS-${currentYear}${nextNumber}`;
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
   * Calculate shipping cost based on city
   */
  private static calculateShippingCost(city: string): number {
    return city === "თბილისი" ? 0 : 7;
  }

  /**
   * Create new order
   */
  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();

      // Convert cart items to order items
      const orderItems = this.convertCartItemsToOrderItems(orderData.items);

      // Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
      const shippingCost = this.calculateShippingCost(
        orderData.deliveryInfo.city
      );
      const totalAmount = subtotal + shippingCost;

      // Create new document reference
      const orderRef = doc(collection(db, this.COLLECTION_NAME));

      // Build order object
      const order: Order = {
        id: orderRef.id,
        userId: orderData.userId,
        orderNumber,

        // Product info
        items: orderItems,
        subtotal,
        shippingCost,
        totalAmount,

        // Customer info
        customerInfo: {
          ...orderData.customerInfo,
          isGuest: !orderData.userId,
        },

        // Delivery info
        deliveryInfo: orderData.deliveryInfo,

        // Payment & Status
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "pending",
        orderStatus: "pending",

        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Firestore
      await setDoc(orderRef, {
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.fromDate(order.updatedAt),
      });

      console.log("✅ Order created successfully:", orderNumber);
      return order;
    } catch (error) {
      console.error("❌ Error creating order:", error);
      throw new Error("შეკვეთის შექმნა ვერ მოხერხდა");
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, this.COLLECTION_NAME, orderId));

      if (!orderDoc.exists()) {
        return null;
      }

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

  /**
   * Get all orders for a user
   */
  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const ordersRef = collection(db, this.COLLECTION_NAME);
      const userQuery = query(
        ordersRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(userQuery);
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
      console.error("❌ Error getting user orders:", error);
      throw new Error("შეკვეთების მოძიება ვერ მოხერხდა");
    }
  }

  /**
   * Get all orders (for admin)
   */
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

  /**
   * Update order status
   */
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

      // If marking as delivered, set deliveredAt timestamp
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

  /**
   * Add admin notes to order
   */
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

  /**
   * Add tracking number
   */
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
}
