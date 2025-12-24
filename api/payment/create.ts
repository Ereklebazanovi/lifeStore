// Vercel Serverless Function for Flitt Payment Creation
// Much faster deployment than Firebase Functions (10-30s vs 3-4min)

const { createHash } = require('crypto')
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Flitt Configuration
const FLITT_MERCHANT_ID = process.env.FLITT_MERCHANT_ID || '4055351'
const FLITT_SECRET_KEY = process.env.FLITT_SECRET_KEY // Will be set in Vercel dashboard
const FLITT_API_URL = 'https://pay.flitt.com/api/checkout/url'

interface CreatePaymentRequest {
  orderId: string
  amount: number
  customerEmail?: string
  description?: string
}

interface FlittPaymentResponse {
  success: boolean
  checkoutUrl?: string
  paymentId?: string
  error?: string
  errorCode?: string
  details?: any
}

/**
 * Generate Flitt signature according to official documentation
 * Format: secret|amount|currency|merchant_id|order_desc|order_id|server_callback_url
 */
function generateSignature(params: any, secretKey: string): string {
  const signatureParams = [
    secretKey,
    params.amount,
    params.currency,
    params.merchant_id,
    params.order_desc,
    params.order_id,
    params.server_callback_url,
  ]

  const signatureString = signatureParams.join('|')

  console.log('🔐 Signature String:', signatureString)

  const signature = createHash('sha1')
    .update(signatureString, 'utf8')
    .digest('hex')

  console.log('🔐 Generated Signature:', signature)

  return signature
}

module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId, amount, customerEmail, description }: CreatePaymentRequest = req.body

    // Validation
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Missing required fields: orderId, amount' })
    }

    if (!FLITT_SECRET_KEY) {
      console.error('❌ FLITT_SECRET_KEY not configured in Vercel environment')
      return res.status(500).json({ error: 'Payment system configuration error' })
    }

    // Convert amount to kopecks/tetri (2.00 GEL = 200 tetri)
    const amountInKopecks = Math.round(amount * 100)

    // Clean description
    const cleanDesc = (description || `Order ${orderId}`).replace(/[^a-zA-Z0-9 -]/g, '')

    console.log('💰 Payment Request Debug:')
    console.log('  - Order ID:', orderId)
    console.log('  - Original amount:', amount)
    console.log('  - Amount in tetri:', amountInKopecks)
    console.log('  - Clean description:', cleanDesc)

    // Prepare request parameters
    const requestParams = {
      version: '1.0.1',
      order_id: String(orderId),
      merchant_id: FLITT_MERCHANT_ID,
      order_desc: cleanDesc,
      amount: amountInKopecks,
      currency: 'GEL',
      server_callback_url: 'https://lifestore.ge/api/payment/callback',
      response_url: 'https://lifestore.ge/payment/success',
    }

    // Add optional email
    if (customerEmail && customerEmail.trim() !== '') {
      requestParams.sender_email = customerEmail.trim()
    }

    // Generate signature
    const signature = generateSignature(requestParams, FLITT_SECRET_KEY)

    // Prepare final request body
    const requestBody = {
      request: {
        ...requestParams,
        signature: signature,
      },
    }

    console.log('🚀 Sending to Flitt:', JSON.stringify(requestBody, null, 2))

    // Send request to Flitt API
    const response = await fetch(FLITT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    console.log('📩 Flitt Response:', JSON.stringify(data, null, 2))

    const responseBody = data.response

    if (responseBody && responseBody.response_status === 'success') {
      // Success
      const successResponse: FlittPaymentResponse = {
        success: true,
        checkoutUrl: responseBody.checkout_url,
        paymentId: responseBody.payment_id,
      }

      return res.status(200).json(successResponse)
    } else {
      // Payment creation failed
      console.error('❌ Flitt Payment Failed:', responseBody)

      const errorResponse: FlittPaymentResponse = {
        success: false,
        error: responseBody?.error_message || 'Payment creation failed',
        errorCode: responseBody?.error_code,
        details: responseBody,
      }

      return res.status(400).json(errorResponse)
    }
  } catch (error: any) {
    console.error('🔥 System Error:', error.message)

    const errorResponse: FlittPaymentResponse = {
      success: false,
      error: 'Internal server error',
      details: error.message,
    }

    return res.status(500).json(errorResponse)
  }
}