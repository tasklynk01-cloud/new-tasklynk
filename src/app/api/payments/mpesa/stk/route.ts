import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  normalizeKenyanPhoneNumber,
  generatePaymentReference,
  sendDarajaStkPush,
  recordPaymentAuditLog,
} from '@/lib/mpesa-service';
import { getUserFromRequest } from '@/lib/admin-auth';
import { isValidWalletTopup } from '@/lib/payment-policy';

// Rate limiting in-memory per IP / user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = (request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
    if (!checkRateLimit(`stk:${clientIp}`, 6, 60000)) {
      return NextResponse.json(
        { error: 'Too many payment requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    // Authenticate user if header present
    const authenticatedUser = await getUserFromRequest(request);
    if (!authenticatedUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const rawOrderId = body.orderId || body.jobId;
    const phoneInput = body.phone || body.phoneNumber;
    const isTopup = body.type === 'topup' || (!rawOrderId && Number(body.amount) > 0);

    if (!phoneInput) {
      return NextResponse.json({ error: 'M-PESA phone number is required' }, { status: 400 });
    }

    // Phone number normalization & validation
    const phoneInfo = normalizeKenyanPhoneNumber(String(phoneInput));
    if (!phoneInfo.valid) {
      return NextResponse.json({
        error: 'Invalid Kenyan M-PESA phone number. Please enter a valid number (e.g. 0712345678 or 0112345678).',
      }, { status: 400 });
    }

    let authoritativeAmount: number;
    let order: any = null;
    let accountReference: string;
    let transactionDesc: string;
    let walletDeductionAmount = 0;
    let clientId = authenticatedUser.id;

    if (isTopup) {
      const topupAmount = Number(body.amount);
      if (!isValidWalletTopup(topupAmount)) {
        return NextResponse.json({ error: 'Wallet top-ups must be whole shillings of at least KSh 100' }, { status: 400 });
      }
      authoritativeAmount = Math.round(topupAmount);
      accountReference = 'TLK-WALLET';
      transactionDesc = `TaskLynk Wallet Top-up KES ${authoritativeAmount}`;
    } else {
      if (!rawOrderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }

      const orderId = Number(rawOrderId);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
      }

      // 1. Authoritative Order Lookup: retrieve exact payable amount from DB
      const [orderRow] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
      if (!orderRow) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      order = orderRow;
      clientId = order.clientId;

      // 2. Authorization check
      if (authenticatedUser && authenticatedUser.role !== 'admin') {
        if (order.clientId !== authenticatedUser.id) {
          return NextResponse.json({ error: 'You are not authorized to pay for this order' }, { status: 403 });
        }
      }

      // 3. Status validation: Cannot pay already paid/cancelled orders
      if (order.status === 'paid' || (order as any).paymentConfirmed) {
        return NextResponse.json({ error: 'This order has already been paid and confirmed.' }, { status: 400 });
      }

      if (order.status === 'cancelled') {
        return NextResponse.json({ error: 'Cannot pay for a cancelled order.' }, { status: 400 });
      }

      // Check for partial wallet deduction
      const totalOrderAmount = Number(order.amount);
      if (!Number.isFinite(totalOrderAmount) || totalOrderAmount <= 0) return NextResponse.json({ error: 'Order has no valid payable amount' }, { status: 400 });
      if (body.walletDeduction && Number(body.walletDeduction) > 0) {
        return NextResponse.json({ error: 'Split wallet/M-PESA payments are temporarily unavailable. Pay the full order via M-PESA, or top up your wallet and pay entirely with wallet balance.' }, { status: 400 });
      }

      authoritativeAmount = Math.round(totalOrderAmount - walletDeductionAmount);
      if (authoritativeAmount <= 0) {
        return NextResponse.json({
          error: 'Wallet balance covers the entire order. Please choose Pay with Wallet.',
        }, { status: 400 });
      }

      accountReference = `TLK-${order.orderNumber || order.id}`;
      transactionDesc = `TaskLynk order ${order.orderNumber || order.id}`;

      // Check if an existing confirmed payment already exists
      const [existingConfirmed] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.jobId, order.id), eq(payments.status, 'paid')))
        .limit(1);

      if (existingConfirmed) {
        return NextResponse.json({ error: 'This order has already been paid.' }, { status: 400 });
      }
    }

    // Check for recent pending payment (within last 30 seconds) to prevent accidental double-clicks
    let recentPending: any = null;
    if (order) {
      const [pending] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.jobId, order.id),
            eq(payments.status, 'awaiting_confirmation')
          )
        )
        .orderBy(desc(payments.createdAt))
        .limit(1);
      recentPending = pending;
    } else {
      const [pending] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.clientId, clientId),
            eq(payments.purpose, 'wallet_topup'),
            eq(payments.status, 'awaiting_confirmation')
          )
        )
        .orderBy(desc(payments.createdAt))
        .limit(1);
      recentPending = pending;
    }

    if (recentPending && recentPending.createdAt) {
      const createdAtMs = new Date(recentPending.createdAt).getTime();
      const elapsedMs = Date.now() - createdAtMs;
      if (elapsedMs < 30000 && Number(recentPending.amount) === authoritativeAmount && recentPending.phoneNumber === phoneInfo.normalized) {
        // Less than 30 seconds ago, reuse current request to prevent double charges
        return NextResponse.json({
          success: true,
          paymentId: recentPending.id,
          reference: recentPending.reference || `TLK-${recentPending.id}`,
          checkoutRequestId: recentPending.checkoutRequestId || recentPending.mpesaCheckoutRequestId,
          amount: authoritativeAmount,
          currency: 'KES',
          message: 'An M-PESA prompt was recently sent. Please enter your PIN on your phone.',
          phoneMasked: phoneInfo.masked,
        });
      }
    }

    // 7. Create internal payment reference & record payment in database FIRST (status: 'initiated')
    const internalReference = generatePaymentReference('TLK');
    const nowIso = new Date().toISOString();

    const [newPayment] = await db
      .insert(payments)
      .values({
        reference: internalReference,
        jobId: order ? order.id : null,
        orderId: order ? order.id : null,
        clientId,
        userId: clientId,
        freelancerId: order ? (order.assignedFreelancerId || null) : null,
        amount: authoritativeAmount,
        currency: 'KES',
        paymentMethod: 'mpesa',
        provider: 'mpesa',
        status: 'initiated',
        purpose: isTopup ? 'wallet_topup' : 'order',
        metadata: walletDeductionAmount > 0 ? { walletDeduction: walletDeductionAmount, orderAmount: Number(order.amount) } : null,
        phoneNumber: phoneInfo.normalized,
        createdAt: nowIso,
        updatedAt: nowIso,
        confirmedByAdmin: false,
      })
      .returning();

    const paymentId = newPayment.id;

    // Record audit event
    await recordPaymentAuditLog(paymentId, 'payment_created', authenticatedUser?.role || 'client', {
      orderId: order ? order.id : null,
      isTopup,
      walletDeduction: walletDeductionAmount,
      amount: authoritativeAmount,
      currency: 'KES',
      phoneNumber: phoneInfo.masked,
      reference: internalReference,
    });

    // 8. Initiate Daraja STK Push via live Safaricom API
    try {
      const stkResult = await sendDarajaStkPush({
        phoneNumber: phoneInfo.normalized,
        amount: authoritativeAmount,
        accountReference,
        transactionDesc,
      });

      // 9. Update payment record to awaiting_confirmation
      await db
        .update(payments)
        .set({
          status: 'awaiting_confirmation',
          checkoutRequestId: stkResult.checkoutRequestId,
          merchantRequestId: stkResult.merchantRequestId,
          mpesaCheckoutRequestId: stkResult.checkoutRequestId,
          mpesaMerchantRequestId: stkResult.merchantRequestId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(payments.id, paymentId));

      await recordPaymentAuditLog(paymentId, 'stk_requested', 'system', {
        checkoutRequestId: stkResult.checkoutRequestId,
        merchantRequestId: stkResult.merchantRequestId,
        responseCode: stkResult.responseCode,
      });

      // 10. Return safe payload to client
      return NextResponse.json({
        success: true,
        paymentId,
        reference: internalReference,
        checkoutRequestId: stkResult.checkoutRequestId,
        merchantRequestId: stkResult.merchantRequestId,
        amount: authoritativeAmount,
        currency: 'KES',
        message: 'M-PESA prompt sent. Please check your phone and enter your PIN.',
        phoneMasked: phoneInfo.masked,
      });
    } catch (stkErr: any) {
      console.error('[M-Pesa STK] Safaricom request failed:', stkErr.message);

      // Update payment record to failed
      await db
        .update(payments)
        .set({
          status: 'failed',
          resultDescription: stkErr.message || 'STK Push request failed',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(payments.id, paymentId));

      await recordPaymentAuditLog(paymentId, 'stk_failed', 'system', {
        error: stkErr.message,
      });

      return NextResponse.json({
        error: stkErr.message || 'Failed to initiate M-PESA STK Push. Please try again.',
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('[M-Pesa STK Route] Unexpected error:', err);
    return NextResponse.json({
      error: err?.message || 'An unexpected error occurred while initiating your M-PESA payment.',
    }, { status: 500 });
  }
}
