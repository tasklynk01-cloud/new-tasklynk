import { headers } from 'next/headers'

const BASE_URL = process.env.PESAPAL_BASE_URL?.trim() || 'https://pay.pesapal.com'
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY?.trim()
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET?.trim()
const IPN_ID = process.env.PESAPAL_IPN_ID?.trim()
const WEBHOOK_SECRET = process.env.PESAPAL_WEBHOOK_SECRET?.trim() || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://tasklynk.co.ke'

// Validate required credentials
function validateCredentials() {
  const missing = []
  if (!CONSUMER_KEY) missing.push('PESAPAL_CONSUMER_KEY')
  if (!CONSUMER_SECRET) missing.push('PESAPAL_CONSUMER_SECRET')
  if (!IPN_ID) missing.push('PESAPAL_IPN_ID')
  
  if (missing.length > 0) {
    throw new Error(
      `Pesapal credentials not configured. Missing: ${missing.join(', ')}. ` +
      'Please set these in your .env file. Get them from https://developer.pesapal.com/'
    )
  }
}

export function getCallbackUrl() {
  return `${APP_URL}/api/v2/payments/pesapal/callback`
}

export function getIpnUrl() {
  return `${APP_URL}/api/v2/payments/pesapal/ipn`
}

export type PesapalAccessToken = {
  token: string
  expiryDate: string
  status: string
  message: string
  error: any
}

export type PesapalStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED' | string

export type PesapalOrderRequest = {
  id: string
  currency: 'KES'
  amount: number
  description: string
  callback_url: string
  notification_id: string
  billing_address: {
    email_address: string
    phone_number: string
    first_name: string
    last_name: string
    country_code: 'KE'
  }
}

export type PesapalOrderResponse = {
  status: string
  message: string
  error?: any
  order_tracking_id: string
  merchant_reference: string
  redirect_url?: string
}

export async function getAccessToken(): Promise<PesapalAccessToken> {
  validateCredentials()
  
  console.log('[Pesapal Auth] Requesting token from:', `${BASE_URL}/v3/api/Auth/RequestToken`)
  console.log('[Pesapal Auth] Consumer Key (first 10 chars):', CONSUMER_KEY?.substring(0, 10) + '...')
  
  const res = await fetch(`${BASE_URL}/v3/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET }),
    cache: 'no-store',
  })
  
  if (!res.ok) {
    const error = await res.text().catch(() => 'Unknown error')
    console.error('[Pesapal Auth] Failed:', {
      status: res.status,
      statusText: res.statusText,
      error,
      url: `${BASE_URL}/v3/api/Auth/RequestToken`
    })
    throw new Error(`Pesapal authentication failed (${res.status}): ${error}`)
  }
  
  const token = await res.json()
  console.log('[Pesapal Auth] Token received, status:', token.status, 'expiry:', token.expiryDate)
  
  if (token.error || token.status !== '200') {
    throw new Error(`Pesapal auth failed: ${token.message || token.error}`)
  }
  
  return token
}

export async function submitOrder(payload: PesapalOrderRequest, token: PesapalAccessToken): Promise<PesapalOrderResponse> {
  console.log('[Pesapal Submit] Submitting order:', {
    merchantRef: payload.id,
    amount: payload.amount,
    phone: payload.billing_address.phone_number,
    tokenPreview: token.token.substring(0, 20) + '...'
  })
  
  const res = await fetch(`${BASE_URL}/v3/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    console.error('[Pesapal Submit Error]', { 
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      merchantRef: payload.id,
      url: `${BASE_URL}/v3/api/Transactions/SubmitOrderRequest`
    })
    throw new Error(`Pesapal submit error ${res.status}: ${errorText}`)
  }
  
  const response = await res.json()
  
  // Check for INVALID status in response
  if (response.status && response.status.toUpperCase() === 'INVALID') {
    console.error('[Pesapal Submit] INVALID STATUS:', {
      status: response.status,
      message: response.message,
      error: response.error,
      orderTrackingId: response.order_tracking_id,
      fullResponse: response,
    })
  } else {
    console.log('[Pesapal Submit] Success:', {
      orderTrackingId: response.order_tracking_id,
      status: response.status
    })
  }
  
  return response
}

export async function getTransactionStatus(orderTrackingId: string, token: PesapalAccessToken) {
  const res = await fetch(`${BASE_URL}/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.token}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Pesapal status error: ${res.status}`)
  return res.json()
}

export function verifyWebhookSignature(signature: string | null, rawBody: string): boolean {
  if (!WEBHOOK_SECRET) return false
  if (!signature) return false
  // Simple constant-time compare using crypto HMAC
  const crypto = require('crypto') as typeof import('crypto')
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
  const sig = signature.replace(/^sha256=/, '')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
}

export function getPesapalConfig() {
  return { BASE_URL, CONSUMER_KEY, CONSUMER_SECRET, IPN_ID, WEBHOOK_SECRET, APP_URL }
}

