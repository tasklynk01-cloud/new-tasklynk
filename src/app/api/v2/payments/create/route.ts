import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/v2/payments/create
 * Create a new payment record aligned with the payments schema.
 * For Paystack checkout, prefer /api/paystack/initiate instead.
 * This route handles M-Pesa manual payment recording.
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { orderId, amount, paymentMethod, phoneNumber, mpesaCode } = await request.json();

    if (!orderId || !amount || !paymentMethod) {
      return NextResponse.json({
        error: 'Order ID, amount, and payment method are required'
      }, { status: 400 });
    }

    if (!['mpesa', 'paystack'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    if (paymentMethod === 'mpesa' && !phoneNumber) {
      return NextResponse.json({
        error: 'Phone number is required for M-Pesa payments'
      }, { status: 400 });
    }

    // Verify order ownership
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You can only pay for your own orders' }, { status: 403 });
    }

    // Check for existing confirmed payment
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.jobId, orderId), eq(payments.status, 'confirmed')))
      .limit(1);

    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already confirmed for this order' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (paymentMethod === 'paystack') {
      // For Paystack, redirect callers to /api/paystack/initiate
      return NextResponse.json({
        error: 'Use /api/paystack/initiate for Paystack payments',
        redirect: '/api/paystack/initiate'
      }, { status: 400 });
    }

    // M-Pesa manual payment: record with phone + optional M-Pesa code
    const [inserted] = await db.insert(payments).values({
      jobId: orderId,
      clientId: user.id,
      amount: amount,
      paymentMethod: 'mpesa',
      status: 'pending',
      phoneNumber: phoneNumber || null,
      mpesaCode: mpesaCode || null,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: payments.id });

    return NextResponse.json({
      success: true,
      paymentId: inserted.id,
      message: 'M-Pesa payment recorded. Admin will verify your payment.',
    });

  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

