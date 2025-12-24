// src/services/paymentService.ts

export interface CreatePaymentRequest {
  orderId: string;
  amount: number; // ლარებში (მაგ: 25.50)
  customerEmail?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  error?: string;
  errorCode?: string;
  details?: any;
}

export class PaymentService {
  /**
   * API URL-ის განსაზღვრა გარემოს მიხედვით.
   * * DEVELOPMENT: თუ მუშაობთ 'npm run dev'-ით (Vite), ის ეშვება 5173 პორტზე.
   * მაგრამ Vercel API ('vercel dev') ეშვება 3000 პორტზე.
   * ამიტომ, დეველოპმენტში ხელით ვუთითებთ localhost:3000-ს.
   * * PRODUCTION: ვიყენებთ ფარდობით მისამართს (Relative Path), რადგან
   * ფრონტიც და ბექიც ერთ დომენზე იქნება.
   */
  private static getApiUrl(): string {
    // Vite-ს გარემოს შემოწმება (import.meta.env.DEV ავტომატურად true-ა ლოკალურად)
    if (import.meta.env.DEV) {
      console.log("🔧 Dev Mode Detected: Targeting localhost:3000");
      return "http://localhost:3000/api/payment/create";
    }
    // Production Mode (Vercel)
    return "/api/payment/create";
  }

  /**
   * გადახდის შექმნა (Flitt)
   */
  static async createFlittPayment(
    paymentData: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    const apiUrl = this.getApiUrl();

    try {
      console.log("🚀 Initializing Payment...");
      console.log("🔗 Target API:", apiUrl);
      console.log("📦 Payload:", paymentData);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ეს ჰედერები ეხმარება CORS-ის პრობლემების თავიდან აცილებაში
          Accept: "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      // HTTP შეცდომების დამუშავება (მაგ: 404, 500, 405)
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = { error: errorText };
        }

        console.error("❌ API Error Response:", errorJson);
        throw new Error(
          errorJson.error ||
            `HTTP Error ${response.status}: ${response.statusText}`
        );
      }

      const result: PaymentResponse = await response.json();
      console.log("✅ Payment API Success:", result);

      return result;
    } catch (error: any) {
      console.error("❌ Payment Service Error:", error);
      // შეცდომის გადაგდება, რომ UI-მ (CheckoutPage) დაიჭიროს და Toast აჩვენოს
      throw new Error(error.message || "გადახდის ინიციალიზაცია ვერ მოხერხდა");
    }
  }

  /**
   * მომხმარებლის გადამისამართება ბანკის გვერდზე
   */
  static redirectToCheckout(checkoutUrl: string): void {
    if (!checkoutUrl) {
      console.error("❌ Checkout URL is missing!");
      return;
    }
    console.log("🔗 Redirecting user to:", checkoutUrl);
    window.location.href = checkoutUrl;
  }

  /**
   * მთავარი მეთოდი: ქმნის გადახდას და ამისამართებს მომხმარებელს
   */
  static async processPayment(
    paymentData: CreatePaymentRequest
  ): Promise<void> {
    // eslint-disable-next-line no-useless-catch
    try {
      // 1. გადახდის შექმნა
      const paymentResponse = await this.createFlittPayment(paymentData);

      if (!paymentResponse.success || !paymentResponse.checkoutUrl) {
        throw new Error(
          paymentResponse.error || "ვერ მოხერხდა გადახდის ლინკის მიღება"
        );
      }

      // 2. ინფორმაციის შენახვა (ოპციონალური, დებაგისთვის კარგია, რომ შეკვეთა არ დაიკარგოს)
      localStorage.setItem(
        "pendingPayment",
        JSON.stringify({
          orderId: paymentData.orderId,
          paymentId: paymentResponse.paymentId,
          amount: paymentData.amount,
          timestamp: Date.now(),
        })
      );

      // 3. გადამისამართება
      this.redirectToCheckout(paymentResponse.checkoutUrl);
    } catch (error) {
      // ერორს ვატარებთ ზევით, რომ კომპონენტმა (CheckoutPage) Toast გამოაჩინოს
      throw error;
    }
  }
}
