import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, users, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUserResult } from '@/lib/admin-auth';
import { isValidWalletTopup } from '@/lib/payment-policy';
import {
  initializePaystackPayment,
  generatePaymentReference,
  validatePaymentAmount,
  isAllowedCallbackUrl,
  getPaymentCorsHeaders,
} from '@/lib/paystack';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getPaymentCorsHeaders(request),
  });
}

/**
 * POST /payments/initialize (or /api/payments/initialize)
 * Centralized Paystack Payment Initialization Endpoint for TaskLynk
 *
 * Supported callers:
 * - https://tasklynk.co.ke (Main Website)
 * - https://app.tasklynk.co.ke (Application Portal)
 *
 * Body parameters:
 * {
 *   amount: number,                  // Amount in KES (required)
 *   currency?: 'KES',               // Must be KES
 *   email?: string,                 // Customer email (optional if authenticated)
 *   jobId?: number,                 // Order ID (if paying for an existing order)
 *   purpose?: string,               // 'order' | 'wallet_topup' | 'subscription' | 'service'
 *   source?: 'website' | 'app',     // Originating frontend ('website' or 'app')
 *   plan?: string,                  // Selected plan (e.g. 'standard', 'pro', 'business')
 *   product?: string,               // 'tasklynk'
 *   phoneNumber?: string,           // Optional for M-Pesa mobile money
 *   channel?: string[],             // ['card', 'mobile_money', 'bank']
 *   return_url?: string,            // Frontend callback destination
 *   metadata?: object               // Additional metadata
 * }
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);

  try {
    const body = await request.json().catch(() => ({}));
    const {
      amount: rawAmount,
      currency = 'KES',
      email: rawEmail,
      jobId,
      purpose = 'general',
      source = 'website',
      plan,
      product = 'tasklynk',
      phoneNumber,
      channel,
      return_url,
      metadata = {},
    } = body;

    // Validate currency
    if (currency && currency.toUpperCase() !== 'KES') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CURRENCY',
            message: 'Only KES (Kenyan Shillings) is currently supported.',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate source
    const validatedSource: 'website' | 'app' = source === 'app' ? 'app' : 'website';

    // Validate return URL against allowlist if provided
    let finalCallbackUrl = return_url;
    if (finalCallbackUrl && !isAllowedCallbackUrl(finalCallbackUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CALLBACK_URL',
            message: 'Supplied return_url is not in the allowed domain list.',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!finalCallbackUrl) {
      const baseDomain = validatedSource === 'app' ? 'https://app.tasklynk.co.ke' : 'https://tasklynk.co.ke';
      finalCallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || baseDomain}/payment/callback`;
    }

    // Check authentication
    const authResult = await getAuthenticatedUserResult(request);
    const authenticatedUser = authResult.success ? authResult.user : null;
    if (purpose === 'wallet_topup') {
      if (!authenticatedUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
      if (!isValidWalletTopup(Number(rawAmount))) return NextResponse.json({ error: 'Wallet top-ups must be whole shillings of at least KSh 100' }, { status: 400, headers: corsHeaders });
    }

    let targetClientId: number | null = authenticatedUser ? authenticatedUser.id : null;
    let customerEmail = rawEmail || authenticatedUser?.email;

    // If order ID (jobId) is provided, validate server-side order and derive amount
    let jobRecord: typeof jobs.$inferSelect | null = null;
    let finalAmount = Number(rawAmount);

    if (jobId) {
      const [foundJob] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, Number(jobId)))
        .limit(1);

      if (!foundJob) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: `Order #${jobId} does not exist.`,
            },
          },
          { status: 404, headers: corsHeaders }
        );
      }

      // Check ownership if user is authenticated and not admin
      if (authenticatedUser && authenticatedUser.role !== 'admin' && foundJob.clientId !== authenticatedUser.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You are not authorized to pay for this order.',
            },
          },
          { status: 403, headers: corsHeaders }
        );
      }

      if (foundJob.status === 'paid' || foundJob.status === 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ORDER_ALREADY_PAID',
              message: 'This order has already been paid for.',
            },
          },
          { status: 400, headers: corsHeaders }
        );
      }

      if (foundJob.status === 'cancelled') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ORDER_CANCELLED',
              message: 'Cannot pay for a cancelled order.',
            },
          },
          { status: 400, headers: corsHeaders }
        );
      }

      jobRecord = foundJob;
      targetClientId = foundJob.clientId;

      // Server-side authoritative price based on agreed order amount and approved bonuses/adjustments
      const baseAmount = Number(foundJob.amount || 0);
      const bonus = Number((foundJob as any).clientBonus || 0);
      const additional = Number((foundJob as any).managerAdditional || 0);
      const expectedJobAmount = (baseAmount + bonus + additional) > 0 ? (baseAmount + bonus + additional) : baseAmount;
      if (expectedJobAmount > 0) {
        finalAmount = expectedJobAmount;
      }
    }

    // Resolve or find client user record if not logged in but email provided
    if (!targetClientId && customerEmail) {
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, customerEmail.toLowerCase().trim()))
        .limit(1);

      if (userByEmail) {
        targetClientId = userByEmail.id;
      }
    }

    // Validate amount
    const amountValidation = validatePaymentAmount(finalAmount);
    if (!amountValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: amountValidation.error || 'Invalid payment amount.',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_REQUIRED',
            message: 'Customer email is required to initialize payment.',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate unique reference
    const reference = generatePaymentReference(jobId ? `ORD${jobId}` : validatedSource);

    // Build metadata payload
    const paymentMetadata: Record<string, any> = {
      ...metadata,
      jobId: jobId || null,
      clientId: targetClientId || null,
      source: validatedSource,
      product,
      plan: plan || null,
      purpose: jobId ? 'order' : purpose,
      customerEmail,
      orderNumber: jobRecord?.orderNumber || null,
      displayId: jobRecord?.displayId || null,
    };

    // Initialize with Paystack
    const paystackRes = await initializePaystackPayment({
      email: customerEmail,
      amount: finalAmount,
      reference,
      source: validatedSource,
      product,
      plan: plan || undefined,
      purpose,
      metadata: paymentMetadata,
      callbackUrl: finalCallbackUrl,
      channels: Array.isArray(channel) && channel.length > 0 ? channel : undefined,
      phoneNumber: phoneNumber || undefined,
    });

    const now = new Date().toISOString();

    // Create database pending record
    if (targetClientId) {
      await db.insert(payments).values({
        jobId: jobId ? Number(jobId) : null,
        clientId: targetClientId,
        amount: finalAmount,
        currency: 'KES',
        paymentMethod: channel?.includes('mobile_money') ? 'mpesa' : 'paystack',
        status: 'pending',
        source: validatedSource,
        product,
        plan: plan || null,
        purpose: jobId ? 'order' : purpose,
        email: customerEmail,
        authorizationUrl: paystackRes.data.authorization_url,
        callbackUrl: finalCallbackUrl,
        paystackReference: reference,
        paystackAccessCode: paystackRes.data.access_code,
        phoneNumber: phoneNumber || null,
        metadata: paymentMetadata,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          authorization_url: paystackRes.data.authorization_url,
          access_code: paystackRes.data.access_code,
          reference,
          amount: finalAmount,
          currency: 'KES',
          source: validatedSource,
          callback_url: finalCallbackUrl,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Payments Initialize API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYMENT_INITIALIZATION_FAILED',
          message: error.message || 'Unable to initialize payment. Please try again later.',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
