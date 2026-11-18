import crypto from 'crypto';

/**
 * Centralized Paystack Integration Library for TaskLynk
 * Handles payment processing for tasklynk.co.ke, app.tasklynk.co.ke, and api.tasklynk.co.ke
 */

export interface PaystackInitializePaymentParams {
  email: string;
  amount: number; // Amount in KSh (will be converted to smallest currency unit / cents)
  reference?: string;
  source?: 'website' | 'app';
  product?: string;
  plan?: string;
  purpose?: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
  channels?: string[];
  phoneNumber?: string;
}

export interface PaystackInitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number; // Amount in kobo/cents
    currency: string;
    paid_at?: string;
    paidAt?: string;
    channel: string;
    customer: {
      email: string;
      customer_code?: string;
      customerCode?: string;
    };
    metadata?: Record<string, any>;
    authorization?: {
      authorization_code?: string;
      card_type?: string;
      last4?: string;
      exp_month?: string;
      exp_year?: string;
      bin?: string;
      bank?: string;
    };
  };
}

/**
 * Allowed origin domains for CORS and Callback URLs
 */
export const ALLOWED_ORIGINS = [
  'https://tasklynk.co.ke',
  'https://app.tasklynk.co.ke',
  'https://api.tasklynk.co.ke',
  'https://www.tasklynk.co.ke',
];

const LOCALHOST_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Check if an origin is permitted
 */
export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && LOCALHOST_ORIGIN_REGEX.test(origin)) {
    return true;
  }
  return false;
}

/**
 * Check if a callback / return URL is valid and allowed
 */
export function isAllowedCallbackUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;
    return isAllowedOrigin(origin);
  } catch {
    return false;
  }
}

/**
 * Generate standard CORS headers for payment API routes
 */
export function getPaymentCorsHeaders(request?: Request | null): HeadersInit {
  const origin = request ? request.headers.get('origin') : null;
  const isAllowed = isAllowedOrigin(origin);
  const allowOrigin = isAllowed && origin ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, x-paystack-signature',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Generate unique transaction reference
 * Format: TASKLYNK-<ENV>-<UNIQUE_ID>
 * e.g. TASKLYNK-LIVE-8f72c91a / TASKLYNK-TEST-9d41b63e
 */
export function generatePaymentReference(customPrefix?: string): string {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  const isLive = secretKey.startsWith('sk_live_');
  const envTag = isLive ? 'LIVE' : 'TEST';
  const random = crypto.randomBytes(6).toString('hex');
  const timestamp = Date.now().toString(36).toUpperCase();

  if (customPrefix) {
    const cleanPrefix = customPrefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    return `TASKLYNK-${envTag}-${cleanPrefix}-${timestamp}-${random}`.toUpperCase();
  }

  return `TASKLYNK-${envTag}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Initialize a payment with Paystack
 */
export async function initializePaystackPayment(
  params: PaystackInitializePaymentParams
): Promise<PaystackInitializePaymentResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Paystack secret key not configured');
  }

  // Convert amount to smallest currency unit (pesewas/cents for KES: KSh 1 = 100 pesewas)
  const amountInPesewas = Math.round(params.amount * 100);
  const reference = params.reference || generatePaymentReference(params.source);

  // Validate or fallback callback URL
  let callbackUrl = params.callbackUrl;
  if (!callbackUrl || !isAllowedCallbackUrl(callbackUrl)) {
    const baseDomain = params.source === 'app' ? 'https://app.tasklynk.co.ke' : 'https://tasklynk.co.ke';
    callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || baseDomain}/payment/callback`;
  }

  const payload: Record<string, any> = {
    email: params.email,
    amount: amountInPesewas,
    reference,
    callback_url: callbackUrl,
    currency: 'KES',
    metadata: {
      ...params.metadata,
      source: params.source || 'website',
      product: params.product || 'tasklynk',
      plan: params.plan || null,
      purpose: params.purpose || 'general',
      customer_email: params.email,
      custom_fields: [
        {
          display_name: 'Platform Source',
          variable_name: 'source',
          value: params.source || 'website',
        },
        {
          display_name: 'Product / Plan',
          variable_name: 'plan',
          value: params.plan || params.product || 'TaskLynk Service',
        },
      ],
    },
  };

  if (params.channels && params.channels.length > 0) {
    payload.channels = params.channels;
  }

  if (params.phoneNumber) {
    let cleanPhone = params.phoneNumber.replace(/[\s\-+]/g, '');
    if (cleanPhone.startsWith('07') || cleanPhone.startsWith('01')) {
      cleanPhone = '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('2540')) {
      cleanPhone = '254' + cleanPhone.substring(4);
    }

    if (/^254[17]\d{8}$/.test(cleanPhone)) {
      payload.mobile_money = {
        phone: cleanPhone,
        provider: 'mpesa',
      };
    }
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to initialize Paystack payment');
  }

  return response.json();
}

/**
 * Verify a payment transaction directly with Paystack API
 */
export async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerifyPaymentResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Paystack secret key not configured');
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to verify Paystack payment');
  }

  return response.json();
}

/**
 * Format amount for Kenyan currency display
 */
export function formatKsh(amount: number): string {
  return `KSh ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Validate payment amount limits
 */
export function validatePaymentAmount(
  amount: number,
  minAmount: number = 10,
  maxAmount: number = 1000000
): { valid: boolean; error?: string } {
  if (!Number.isFinite(amount) || amount < minAmount) {
    return {
      valid: false,
      error: `Amount must be at least ${formatKsh(minAmount)}`,
    };
  }

  if (amount > maxAmount) {
    return {
      valid: false,
      error: `Amount cannot exceed ${formatKsh(maxAmount)}`,
    };
  }

  return { valid: true };
}

/**
 * Parse Paystack webhook payload
 */
export function parsePaystackWebhook(payload: any): {
  event: string;
  data: any;
} {
  return {
    event: payload?.event || '',
    data: payload?.data || {},
  };
}

/**
 * Verify Paystack webhook signature using HMAC SHA512
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || !signature) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch (err) {
    console.error('[Paystack] Signature verification error:', err);
    return false;
  }
}
