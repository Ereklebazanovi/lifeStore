// New Payment Service for Vercel API Integration
// Much faster than Firebase Functions for debugging

export interface CreatePaymentRequest {
  orderId: string
  amount: number
  customerEmail?: string
  description?: string
}

export interface PaymentResponse {
  success: boolean
  checkoutUrl?: string
  paymentId?: string
  error?: string
  errorCode?: string
  details?: any
}

export class PaymentService {
  private static readonly API_BASE_URL = import.meta.env.MODE === 'development'
    ? 'http://localhost:3000'
    : 'https://lifestore.ge'

  /**
   * Create Flitt payment using Vercel API
   */
  static async createFlittPayment(paymentData: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('🚀 Creating payment via Vercel API:', paymentData)

      const response = await fetch(`${this.API_BASE_URL}/api/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: PaymentResponse = await response.json()
      console.log('✅ Payment created:', result)

      return result
    } catch (error) {
      console.error('❌ Error creating Flitt payment:', error)
      throw error
    }
  }

  /**
   * Redirect user to Flitt checkout page
   */
  static redirectToCheckout(checkoutUrl: string): void {
    console.log('🔗 Redirecting to checkout:', checkoutUrl)
    window.location.href = checkoutUrl
  }

  /**
   * Process complete payment flow (create + redirect)
   */
  static async processPayment(paymentData: CreatePaymentRequest): Promise<void> {
    try {
      // 1. Create payment
      const paymentResponse = await this.createFlittPayment(paymentData)

      if (!paymentResponse.success || !paymentResponse.checkoutUrl) {
        throw new Error(paymentResponse.error || 'Failed to create payment link')
      }

      // 2. Store payment info in localStorage for tracking
      localStorage.setItem('pendingPayment', JSON.stringify({
        orderId: paymentData.orderId,
        paymentId: paymentResponse.paymentId,
        amount: paymentData.amount,
        timestamp: Date.now(),
      }))

      // 3. Redirect to checkout
      this.redirectToCheckout(paymentResponse.checkoutUrl)
    } catch (error) {
      console.error('❌ Error processing payment:', error)
      throw error
    }
  }

  /**
   * Get pending payment info from localStorage
   */
  static getPendingPayment(): {
    orderId: string
    paymentId: string
    amount: number
    timestamp: number
  } | null {
    try {
      const pending = localStorage.getItem('pendingPayment')
      return pending ? JSON.parse(pending) : null
    } catch {
      return null
    }
  }

  /**
   * Clear pending payment info
   */
  static clearPendingPayment(): void {
    localStorage.removeItem('pendingPayment')
  }
}