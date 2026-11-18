/**
 * TaskLynk — Production Safaricom M-PESA Daraja Service
 * 
 * Implements M-PESA Express (STK Push, STK Query) & C2B v2 (Register URL)
 * with robust OAuth token caching, phone normalization, idempotency,
 * and comprehensive audit logging.
 */

import { db } from '@/db';
import { payments, paymentAuditLogs, jobs, users, orderHistory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as crypto from 'crypto';

// ============================================================================
// CONFIGURATION & TYPES
// ============================================================================

export interface DarajaConfig {
  env: 'production' | 'sandbox';
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  storeNumber?: string;
  tillNumber?: string;
  stkCallbackUrl: string;
  c2bValidationUrl: string;
  c2bConfirmationUrl: string;
  transactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
}

export interface StkInitiateRequest {
  phoneNumber: string;
  amount: number;
  orderId?: number;
  projectId?: number;
  invoiceId?: number;
  userId?: number;
  accountReference: string;
  transactionDesc?: string;
  metadata?: Record<string, any>;
}

export interface StkInitiateResponse {
  success: boolean;
  paymentId: number;
  reference: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  customerMessage: string;
  amount: number;
  currency: string;
  phoneMasked: string;
}

export interface ParsedStkCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  success: boolean;
  receiptNumber?: string;
  transactionDate?: string;
  amount?: number;
  phoneNumber?: string;
  raw: any;
}

export interface ParsedC2BCallback {
  transactionType?: string;
  transId: string;
  transTime: string;
  transAmount: number;
  businessShortCode: string;
  billRefNumber: string;
  invoiceNumber?: string;
  orgAccountBalance?: string;
  thirdPartyTransId?: string;
  msisdn: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  raw: any;
}

// In-memory OAuth token cache
interface CachedToken {
  token: string;
  expiresAt: number; // UNIX timestamp in ms
}
let tokenCache: CachedToken | null = null;

// ============================================================================
// ENVIRONMENT & CONFIG RESOLUTION
// ============================================================================

function cleanEnvString(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

export function getDarajaConfig(): DarajaConfig {
  const envRaw = cleanEnvString(process.env.MPESA_ENV || process.env.MPESA_ENVIRONMENT || 'production').toLowerCase();
  const env = envRaw === 'sandbox' ? 'sandbox' : 'production';

  const consumerKey = cleanEnvString(process.env.MPESA_CONSUMER_KEY);
  const consumerSecret = cleanEnvString(process.env.MPESA_CONSUMER_SECRET);
  const passkey = cleanEnvString(process.env.MPESA_PASSKEY);
  const shortcode = cleanEnvString(process.env.MPESA_SHORTCODE || process.env.MPESA_BUSINESS_SHORTCODE);
  const storeNumber = cleanEnvString(process.env.MPESA_STORE_NUMBER || process.env.MPESA_HO_NUMBER || process.env.MPESA_STORE);
  const tillNumber = cleanEnvString(process.env.MPESA_TILL_NUMBER || process.env.MPESA_PARTY_B || process.env.MPESA_TILL);

  const baseUrl = cleanEnvString(process.env.NEXT_PUBLIC_APP_URL) || 'https://tasklynk.co.ke';
  const stkCallbackUrl = cleanEnvString(process.env.MPESA_STK_CALLBACK_URL || process.env.MPESA_CALLBACK_URL) || `${baseUrl}/api/payments/mpesa/callback`;
  const c2bValidationUrl = cleanEnvString(process.env.MPESA_C2B_VALIDATION_URL) || `${baseUrl}/api/payments/mpesa/c2b/validation`;
  const c2bConfirmationUrl = cleanEnvString(process.env.MPESA_C2B_CONFIRMATION_URL) || `${baseUrl}/api/payments/mpesa/c2b/confirmation`;

  const rawTxType = cleanEnvString(process.env.MPESA_TRANSACTION_TYPE);
  const transactionType =
    rawTxType === 'CustomerBuyGoodsOnline' || (rawTxType !== 'CustomerPayBillOnline' && (Boolean(tillNumber) || Boolean(storeNumber)))
      ? 'CustomerBuyGoodsOnline'
      : (rawTxType === 'CustomerBuyGoodsOnline' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline');

  return {
    env,
    consumerKey,
    consumerSecret,
    passkey,
    shortcode,
    storeNumber: storeNumber || undefined,
    tillNumber: tillNumber || undefined,
    stkCallbackUrl,
    c2bValidationUrl,
    c2bConfirmationUrl,
    transactionType,
  };
}

export function assertDarajaCredentials(config = getDarajaConfig()): void {
  const missing: string[] = [];
  if (!config.consumerKey) missing.push('MPESA_CONSUMER_KEY');
  if (!config.consumerSecret) missing.push('MPESA_CONSUMER_SECRET');
  if (!config.passkey) missing.push('MPESA_PASSKEY');
  if (!config.shortcode) missing.push('MPESA_SHORTCODE');

  if (missing.length > 0) {
    throw new Error(`Missing required M-PESA configuration environment variable(s): ${missing.join(', ')}`);
  }
  const activeBusinessNumbers = config.transactionType === 'CustomerBuyGoodsOnline'
    ? [config.storeNumber || config.shortcode, config.tillNumber || config.shortcode]
    : [config.shortcode];
  if (config.env === 'production' && activeBusinessNumbers.includes('174379')) {
    throw new Error('M-PESA production is configured with the sandbox shortcode 174379. Configure your approved live business credentials.');
  }
  let callback: URL;
  try { callback = new URL(config.stkCallbackUrl); } catch { throw new Error('Invalid M-PESA callback URL'); }
  if (callback.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(callback.hostname)) throw new Error('M-PESA requires a publicly reachable HTTPS callback URL');
}

function getBaseApiUrl(config = getDarajaConfig()): string {
  return config.env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

// ============================================================================
// PHONE NUMBER NORMALIZATION & VALIDATION
// ============================================================================

/**
 * Normalizes Kenyan phone numbers to the 254XXXXXXXXX standard format.
 * Accepts formats:
 * - 0712345678
 * - 0112345678
 * - +254712345678
 * - 254712345678
 * - 712345678
 * - 112345678
 */
export function normalizeKenyanPhoneNumber(phone: string): {
  normalized: string;
  valid: boolean;
  masked: string;
  formatted: string;
} {
  if (!phone || typeof phone !== 'string') {
    return { normalized: '', valid: false, masked: '', formatted: '' };
  }

  // Strip all whitespace, hyphens, parentheses, and leading plus
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle leading 0 (e.g. 0712345678 or 0112345678)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.substring(1);
  }
  // Handle 9-digit input without 0 (e.g. 712345678 or 112345678)
  else if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }

  // Validate format: exactly 12 digits, starting with 254 followed by 7 or 1
  const isValid = /^254[17]\d{8}$/.test(cleaned);

  const masked = isValid
    ? `${cleaned.slice(0, 6)}****${cleaned.slice(-2)}`
    : 'Invalid Phone';

  const formatted = isValid
    ? `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
    : phone;

  return {
    normalized: isValid ? cleaned : '',
    valid: isValid,
    masked,
    formatted,
  };
}

// ============================================================================
// REFERENCE GENERATION & SECURITY HELPERS
// ============================================================================

/**
 * Generates an internal unique TaskLynk payment reference: TLK-YYYYMMDD-XXXXXXXX
 */
export function generatePaymentReference(prefix = 'TLK'): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${randomBytes}`;
}

/**
 * Generates the Daraja timestamp string: YYYYMMDDHHmmss
 */
export function getDarajaTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generates the base64-encoded Daraja password: Base64(ShortCode + Passkey + Timestamp)
 */
export function generateDarajaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

// ============================================================================
// OAUTH SERVICE (Cached & Auto-Refreshing)
// ============================================================================

/**
 * Obtains a live Daraja OAuth access token with caching and automatic refresh.
 * Never exposes credentials to client.
 */
export async function getDarajaAccessToken(forceRefresh = false): Promise<string> {
  const config = getDarajaConfig();
  assertDarajaCredentials(config);

  const now = Date.now();
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > now + 60000) {
    return tokenCache.token;
  }

  const authString = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  const url = `${getBaseApiUrl(config)}/oauth/v1/generate?grant_type=client_credentials`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authString}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detailedMsg = '';
      try {
        const parsed = JSON.parse(errText);
        detailedMsg = parsed.errorMessage || parsed.error_description || parsed.message || '';
      } catch {}

      const reason = detailedMsg
        ? `${detailedMsg} (${errText.trim()})`
        : response.status === 400
        ? `Invalid Daraja credentials (MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET) or environment mismatch (${config.env} vs live) on Safaricom Daraja.`
        : (errText.trim() || 'Unknown error');

      console.error(`[M-Pesa OAuth] Token request failed [${config.env}]: HTTP ${response.status} - ${reason}`);
      throw new Error(`Daraja OAuth request failed: HTTP ${response.status} - ${reason}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('Daraja OAuth response missing access_token');
    }

    const expiresInSec = Number(data.expires_in) || 3599;
    tokenCache = {
      token: data.access_token,
      expiresAt: now + expiresInSec * 1000,
    };

    return tokenCache.token;
  } catch (err: any) {
    // Do not retry 400 bad credentials
    if (!forceRefresh && !err.message?.includes('HTTP 400')) {
      console.warn('[M-Pesa OAuth] Retrying token fetch once...');
      return getDarajaAccessToken(true);
    }
    throw err;
  }
}

// ============================================================================
// STK PUSH SERVICE
// ============================================================================

/**
 * Initiates an M-PESA STK Push via Safaricom Daraja Lipa na M-PESA production API.
 */
export async function sendDarajaStkPush(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
  customCallbackUrl?: string;
}): Promise<{
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}> {
  const config = getDarajaConfig();
  assertDarajaCredentials(config);

  const phoneInfo = normalizeKenyanPhoneNumber(params.phoneNumber);
  if (!phoneInfo.valid) {
    throw new Error(`Invalid Kenyan phone number: ${params.phoneNumber}. Expected format 07XXXXXXXX or 01XXXXXXXX.`);
  }

  const amountInt = Math.round(params.amount);
  if (!Number.isSafeInteger(amountInt) || amountInt <= 0) {
    throw new Error(`Invalid amount: ${params.amount}. Amount must be a positive integer.`);
  }

  const token = await getDarajaAccessToken();
  const timestamp = getDarajaTimestamp();

  const isBuyGoods = config.transactionType === 'CustomerBuyGoodsOnline';
  const businessShortCode = isBuyGoods
    ? (config.storeNumber || config.shortcode)
    : config.shortcode;
  const partyB = isBuyGoods
    ? (config.tillNumber || config.shortcode)
    : config.shortcode;

  const password = generateDarajaPassword(businessShortCode, config.passkey, timestamp);

  const callbackUrl = params.customCallbackUrl || config.stkCallbackUrl;
  const desc = (params.transactionDesc || `TaskLynk payment ${params.accountReference}`).slice(0, 100);
  const accountRef = (params.accountReference || phoneInfo.normalized).slice(0, 12);

  const payload = {
    BusinessShortCode: businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: config.transactionType,
    Amount: amountInt,
    PartyA: phoneInfo.normalized,
    PartyB: partyB,
    PhoneNumber: phoneInfo.normalized,
    CallBackURL: callbackUrl,
    AccountReference: accountRef,
    TransactionDesc: desc,
  };

  const url = `${getBaseApiUrl(config)}/mpesa/stkpush/v1/processrequest`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  const responseData = await response.json();

  if (!response.ok || responseData.errorCode || (responseData.ResponseCode && responseData.ResponseCode !== '0')) {
    const errorMsg =
      responseData.errorMessage ||
      responseData.ResponseDescription ||
      `STK Push failed with status ${response.status}`;
    console.error('[M-Pesa STK] Error response:', response.status, responseData);
    throw new Error(errorMsg);
  }

  if (!responseData.CheckoutRequestID || !responseData.MerchantRequestID) {
    throw new Error('M-PESA did not return expected transaction request IDs');
  }

  return {
    merchantRequestId: responseData.MerchantRequestID,
    checkoutRequestId: responseData.CheckoutRequestID,
    responseCode: responseData.ResponseCode,
    responseDescription: responseData.ResponseDescription || 'Success',
    customerMessage: responseData.CustomerMessage || 'Please complete the M-PESA prompt on your phone.',
  };
}

// ============================================================================
// STK PUSH STATUS QUERY
// ============================================================================

/**
 * Queries Daraja for the status of an ongoing STK Push request.
 * Used for real-time verification when callbacks are delayed or lost.
 */
export async function queryDarajaStkStatus(checkoutRequestId: string): Promise<{
  responseCode: string;
  responseDescription: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
}> {
  const config = getDarajaConfig();
  assertDarajaCredentials(config);

  const token = await getDarajaAccessToken();
  const timestamp = getDarajaTimestamp();

  const isBuyGoods = config.transactionType === 'CustomerBuyGoodsOnline';
  const businessShortCode = isBuyGoods
    ? (config.storeNumber || config.shortcode)
    : config.shortcode;
  const password = generateDarajaPassword(businessShortCode, config.passkey, timestamp);

  const payload = {
    BusinessShortCode: businessShortCode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const url = `${getBaseApiUrl(config)}/mpesa/stkpushquery/v1/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });

  const data = await response.json();
  const resultCode = data.ResultCode !== undefined ? Number(data.ResultCode) : -1;
  return {
    responseCode: String(data.ResponseCode || ''),
    responseDescription: String(data.ResponseDescription || ''),
    merchantRequestId: String(data.MerchantRequestID || ''),
    checkoutRequestId: String(data.CheckoutRequestID || checkoutRequestId),
    resultCode,
    resultDesc: String(data.ResultDesc || data.errorMessage || ''),
  };
}

export function formatDarajaErrorMessage(resultCode: number, rawDesc?: string): string {
  switch (resultCode) {
    case 1032:
      return 'Payment was cancelled on your phone.';
    case 1037:
      return 'The prompt timed out. Please unlock your phone and try again.';
    case 1:
      return 'Insufficient M-PESA balance.';
    case 2001:
      console.error('[M-Pesa STK] Code 2001: Invalid initiator credentials.');
      return 'Payment authorization failed. Please try again.';
    case 2002:
      console.error('[M-Pesa STK] Code 2002: The Agent number (Till) and Store number do not match. Set MPESA_STORE_NUMBER in .env to the Store Number linked to this Till.');
      return 'Payment could not be routed to the business Till. Please contact support.';
    case 2029:
      console.error('[M-Pesa STK] Code 2029: Routing failed. For Buy Goods Till, set MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline and configure MPESA_STORE_NUMBER in .env.');
      return 'Payment service temporarily unavailable. Please try again.';
    default:
      return rawDesc || 'Transaction could not be completed on your phone.';
  }
}

// ============================================================================
// C2B v2 REGISTER URL
// ============================================================================

/**
 * Registers validation and confirmation endpoints with Safaricom C2B v2 API.
 */
export async function registerDarajaC2BUrls(customConfig?: {
  shortcode?: string;
  validationUrl?: string;
  confirmationUrl?: string;
  responseType?: 'Completed' | 'Cancelled';
}): Promise<{
  conversationId: string;
  originatorConversationId: string;
  responseDescription: string;
}> {
  const config = getDarajaConfig();
  assertDarajaCredentials(config);

  const token = await getDarajaAccessToken();
  const shortcode = customConfig?.shortcode || config.shortcode;
  const validationUrl = customConfig?.validationUrl || config.c2bValidationUrl;
  const confirmationUrl = customConfig?.confirmationUrl || config.c2bConfirmationUrl;
  const responseType = customConfig?.responseType || 'Completed';

  const payload = {
    ShortCode: shortcode,
    ResponseType: responseType,
    ConfirmationURL: confirmationUrl,
    ValidationURL: validationUrl,
  };

  const url = `${getBaseApiUrl(config)}/mpesa/c2b/v2/registerurl`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  const data = await response.json();

  if (!response.ok || data.ResponseCode !== '0') {
    throw new Error(data.errorMessage || data.ResponseDescription || `C2B Registration failed: HTTP ${response.status}`);
  }

  return {
    conversationId: data.ConversationID,
    originatorConversationId: data.OriginatorConversationID,
    responseDescription: data.ResponseDescription,
  };
}

// ============================================================================
// CALLBACK PARSING
// ============================================================================

export function parseDarajaStkCallback(body: any): ParsedStkCallback | null {
  const stkCallback = body?.Body?.stkCallback || body?.stkCallback;
  if (!stkCallback) return null;

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

  let receiptNumber: string | undefined;
  let transactionDate: string | undefined;
  let amount: number | undefined;
  let phoneNumber: string | undefined;

  if (CallbackMetadata?.Item && Array.isArray(CallbackMetadata.Item)) {
    for (const item of CallbackMetadata.Item) {
      if (item.Name === 'MpesaReceiptNumber') receiptNumber = String(item.Value);
      if (item.Name === 'TransactionDate') transactionDate = String(item.Value);
      if (item.Name === 'Amount') amount = Number(item.Value);
      if (item.Name === 'PhoneNumber') phoneNumber = String(item.Value);
    }
  }

  return {
    merchantRequestId: MerchantRequestID,
    checkoutRequestId: CheckoutRequestID,
    resultCode: Number(ResultCode),
    resultDesc: ResultDesc || '',
    success: Number(ResultCode) === 0,
    receiptNumber,
    transactionDate,
    amount,
    phoneNumber,
    raw: body,
  };
}

export function parseDarajaC2BCallback(body: any): ParsedC2BCallback | null {
  if (!body || (!body.TransID && !body.TransactionType)) return null;

  return {
    transactionType: body.TransactionType,
    transId: body.TransID,
    transTime: body.TransTime,
    transAmount: Number(body.TransAmount) || 0,
    businessShortCode: body.BusinessShortCode,
    billRefNumber: body.BillRefNumber || '',
    invoiceNumber: body.InvoiceNumber,
    orgAccountBalance: body.OrgAccountBalance,
    thirdPartyTransId: body.ThirdPartyTransID,
    msisdn: body.MSISDN,
    firstName: body.FirstName,
    middleName: body.MiddleName,
    lastName: body.LastName,
    raw: body,
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export async function recordPaymentAuditLog(
  paymentId: number,
  event: string,
  actor = 'system',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Sanitize metadata to never include sensitive credentials or PINs
    const sanitizedMetadata: Record<string, any> = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passkey;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.pin;
    delete sanitizedMetadata.consumerSecret;
    delete sanitizedMetadata.consumerKey;

    if (sanitizedMetadata.phoneNumber) {
      sanitizedMetadata.phoneNumber = normalizeKenyanPhoneNumber(String(sanitizedMetadata.phoneNumber)).masked;
    }

    await db.insert(paymentAuditLogs).values({
      paymentId,
      event,
      actor,
      metadata: sanitizedMetadata,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[Payment Audit] Failed to record audit log for payment ${paymentId}:`, err);
  }
}
