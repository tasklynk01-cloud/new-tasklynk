import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, payments, balances } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';

/**
 * POST /api/v2/orders/[id]/admin/confirm-payment
 * 
 * Admin confirms payment received from client (moves balances: pending → reserved)
 * 
 * Flow:
 * - Validates order is 'approved'
 * - Validates payment record exists
 * - ATOMIC TRANSACTION:
 *   - Updates payments table: status = 'completed', confirmed_by_admin = true
 *   - Updates order status: approved → paid, sets paid_at = NOW()
 *   - Moves balances: pending_balance -= amount, reserved_balance += amount
 *   - Logs to audit_logs
 *   - Notifies freelancer and manager
 * 
 * Auth: Requires admin role
 * 
 * Body:
 * {
 *   paymentId: number,
 *   mpesaCode?: string,           // Optional: M-Pesa transaction code
 *   paystackReference?: string,   // Optional: Paystack transaction reference
 *   actualPaymentAmount?: number, // 🆕 PARTIAL PAYMENT: actual amount received
 *   partialPaymentReason?: string // Required if actualPaymentAmount differs from expected
 * }
 * 
 * Response:
 * {
 *   order: { ... updated order },
 *   payment: { ... updated payment },
 *   balances: {
 *     freelancer: { pending: number, reserved: number },
 *     manager: { pending: number, reserved: number }
 *   },
 *   message: "Payment confirmed. Funds reserved for payout."
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const admin = authCheck.user!;

  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { paymentId, mpesaCode, paystackReference, actualPaymentAmount, partialPaymentReason } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    if (payment.jobId !== orderId) {
      return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
    }

    await confirmPaymentReceived({
      orderId,
      paymentId,
      adminId: admin.id,
      mpesaCode,
      paystackReference,
      actualPaymentAmount,
      partialPaymentReason,
    });

    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    const [updatedPayment] = await db.select().from(payments).where(eq(payments.id, paymentId));

    const freelancerBalance = updatedOrder?.assignedFreelancerId
      ? await db
          .select()
          .from(balances)
          .where(eq(balances.userId, updatedOrder.assignedFreelancerId))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    const managerBalance = updatedOrder?.managerId
      ? await db
          .select()
          .from(balances)
          .where(eq(balances.userId, updatedOrder.managerId))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    return NextResponse.json({
      order: updatedOrder,
      payment: updatedPayment,
      balances: {
        freelancer: freelancerBalance
          ? {
              pending: freelancerBalance.pendingBalance,
              reserved: freelancerBalance.reservedBalance,
            }
          : null,
        manager: managerBalance
          ? {
              pending: managerBalance.pendingBalance,
              reserved: managerBalance.reservedBalance,
            }
          : null,
      },
      message: 'Payment confirmed successfully. Funds reserved for payout.',
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
