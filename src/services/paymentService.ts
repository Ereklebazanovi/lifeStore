import type {
  CreatePaymentRequest,
  PaymentResponse,
  PaymentStatus,
} from "../types";

// ✅ შენი დადეპლოებული ფუნქციების ზუსტი მისამართები
const API_URLS = {
  createPayment: "https://createpayment-oj2s6bdcma-ew.a.run.app",
  getPaymentStatus: "https://getpaymentstatus-oj2s6bdcma-ew.a.run.app",
};

export class PaymentService {
  /**
   * Create Flitt payment and redirect to checkout
   */
  static async createFlittPayment(
    paymentData: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // ვიყენებთ პირდაპირ createPayment-ის URL-ს
      const response = await fetch(API_URLS.createPayment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const result: PaymentResponse = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating Flitt payment:", error);
      throw error;
    }
  }

  /**
   * Redirect user to Flitt checkout
   */
  static redirectToCheckout(checkoutUrl: string): void {
    window.location.href = checkoutUrl;
  }

  /**
   * Check payment status
   */
  static async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // ვიყენებთ პირდაპირ getPaymentStatus-ის URL-ს
      const response = await fetch(
        `${API_URLS.getPaymentStatus}?paymentId=${paymentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get payment status");
      }

      const result: PaymentStatus = await response.json();
      return result;
    } catch (error) {
      console.error("Error getting payment status:", error);
      throw error;
    }
  }

  /**
   * Process payment flow (create + redirect)
   */
  static async processPayment(
    paymentData: CreatePaymentRequest
  ): Promise<void> {
    try {
      // 1. Create payment
      const paymentResponse = await this.createFlittPayment(paymentData);

      if (!paymentResponse.success || !paymentResponse.checkoutUrl) {
        throw new Error(
          paymentResponse.error || "Failed to create payment link"
        );
      }

      // 2. Store payment info in localStorage
      localStorage.setItem(
        "pendingPayment",
        JSON.stringify({
          orderId: paymentData.orderId,
          paymentId: paymentResponse.paymentId,
          amount: paymentData.amount,
          timestamp: Date.now(),
        })
      );

      // 3. Redirect to checkout
      this.redirectToCheckout(paymentResponse.checkoutUrl);
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  }

  static getPendingPayment(): {
    orderId: string;
    paymentId: string;
    amount: number;
    timestamp: number;
  } | null {
    try {
      const pending = localStorage.getItem("pendingPayment");
      return pending ? JSON.parse(pending) : null;
    } catch {
      return null;
    }
  }

  static clearPendingPayment(): void {
    localStorage.removeItem("pendingPayment");
  }
}