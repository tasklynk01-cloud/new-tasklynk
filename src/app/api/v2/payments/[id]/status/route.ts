import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/payments/[id]/status
 * Get payment status for polling. Uses paystackReference (not externalReference)
 * and confirmedAt (not completedAt) per the payments schema.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const resolvedParams = params instanceof Promise ? await params : params;
    const paymentId = parseInt(resolvedParams.id, 10);

    if (isNaN(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // 🔒 OWNERSHIP CHECK: a client could otherwise poll any payment's status/
    // amount by ID.
    if ((user.role === 'client' || user.role === 'account_owner') && payment.clientId !== user.id) {
      return NextResponse.json({ error: 'You do not have access to this payment' }, { status: 403 });
    }

    // For Paystack payments, verify status with Paystack API if still pending
    if (payment.paymentMethod === 'paystack' && payment.paystackReference && payment.status === 'pending') {
      try {
        const verifyResponse = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.paystackReference)}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        const verifyData = await verifyResponse.json();

        if (verifyData.status && verifyData.data?.status === 'success') {
          const now = new Date().toISOString();
          await db.update(payments)
            .set({
              status: 'pending_verification',
              updatedAt: now,
            })
            .where(eq(payments.id, paymentId));

          return NextResponse.json({
            success: true,
            status: 'pending_verification',
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
          });
        } else if (verifyData.data?.status === 'failed') {
          await db.update(payments)
            .set({
              status: 'failed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(payments.id, paymentId));

          return NextResponse.json({
            success: true,
            status: 'failed',
          });
        }
      } catch (error) {
        console.error('Error verifying Paystack payment:', error);
      }
    }

    return NextResponse.json({
      success: true,
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      confirmedByAdmin: payment.confirmedByAdmin,
      confirmedAt: payment.confirmedAt,
    });

  } catch (error) {
    console.error('Failed to get payment status:', error);
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}