import { NextRequest, NextResponse } from 'next/server';
import { sendDarajaStkPush } from '@/lib/mpesa-service';
import { db } from '@/db';
import { payments, users, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/admin-auth';
import { isValidWalletTopup } from '@/lib/payment-policy';

// Simple in-memory rate limiter (best-effort; resets on restart)
const rl = (globalThis as any).__MPESA_INIT_RL__ || new Map<string, { count: number; reset: number }>();
(globalThis as any).__MPESA_INIT_RL__ = rl;
function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = rl.get(key);
  if (!entry || now > entry.reset) {
    rl.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count < limit) {
    entry.count += 1;
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit per IP
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(`mpesa-init:${ip}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Require authentication
    const requester = await getAuthenticatedUser(request);
    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, amount, paymentId, jobTitle } = body;


    // Validate required fields
    if (!phoneNumber || !amount || !paymentId) {
      console.error('Missing required fields:', { phoneNumber: !!phoneNumber, amount: !!amount, paymentId: !!paymentId });
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, amount, or paymentId' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^(07|01)\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.error('Invalid phone number format:', phoneNumber);
      return NextResponse.json(
        { error: 'Invalid phone number format. Use 07XXXXXXXX or 01XXXXXXXX' },
        { status: 400 }
      );
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Verify payment record exists
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, parseInt(paymentId)))
      .limit(1);

    if (!existingPayment) {
      console.error('Payment record not found:', paymentId);
      return NextResponse.json(
        { error: 'Payment record not found. Please try again.' },
        { status: 404 }
      );
    }

    // Authorization: requester must be the client or admin
    if (requester.role !== 'admin' && requester.id !== existingPayment.clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent duplicate initiation for confirmed payments
    if (['confirmed', 'paid', 'completed', 'awaiting_confirmation'].includes(existingPayment.status)) {
      return NextResponse.json({ error: 'Payment already confirmed for this request' }, { status: 400 });
    }

    // Ensure related job is valid (not cancelled/completed)
    // Note: payments.jobId is nullable (wallet top-ups)
    if (existingPayment.jobId) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, existingPayment.jobId)).limit(1);
      if (!job) {
        return NextResponse.json({ error: 'Related order not found' }, { status: 404 });
      }
      if (job.status === 'cancelled' || job.status === 'completed') {
        return NextResponse.json({ error: `Cannot initiate payment for a ${job.status} order` }, { status: 400 });
      }
    }

    const paymentAmount = Number(existingPayment.amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || (!existingPayment.jobId && !isValidWalletTopup(paymentAmount))) {
      return NextResponse.json({ error: 'Invalid payment amount. Wallet top-ups require at least KSh 100 in whole shillings.' }, { status: 400 });
    }
    const stkResponse = await sendDarajaStkPush({
      phoneNumber,
      amount: paymentAmount,
      accountReference: `TLK-${paymentId}`,
      transactionDesc: `TaskLynk Order ${paymentId}`,
    });

    // Update payment record with checkout request IDs
    await db
      .update(payments)
      .set({
        checkoutRequestId: stkResponse.checkoutRequestId,
        merchantRequestId: stkResponse.merchantRequestId,
        mpesaCheckoutRequestId: stkResponse.checkoutRequestId,
        mpesaMerchantRequestId: stkResponse.merchantRequestId,
        status: 'awaiting_confirmation',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payments.id, parseInt(paymentId)));

    return NextResponse.json({
      success: true,
      message: stkResponse.customerMessage || 'STK Push sent to your phone. Please enter your PIN.',
      checkoutRequestId: stkResponse.checkoutRequestId,
      merchantRequestId: stkResponse.merchantRequestId,
    });
  } catch (error: any) {
    console.error('M-Pesa STK Push error:', error);
    console.error('Error stack:', error.stack);
    
    // Extract user-friendly error message
    let errorMessage = 'Failed to initiate payment. Please try again.';
    
    if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please check your internet connection and try again.';
    } else if (error.message?.includes('token')) {
      errorMessage = 'M-Pesa authentication failed. Please contact support.';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

