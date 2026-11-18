import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, payments, balances, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/v2/orders/[id]/payment
 * 
 * Simplified payment confirmation endpoint that wraps confirmPaymentReceived().
 * 
 * Flow:
 * - Looks up payment record by jobId (creates one if missing)
 * - Delegates to confirmPaymentReceived() helper
 * - Returns structured response with balance breakdown
 * 
 * Auth: Requires admin/manager role OR internal call header
 * 
 * Body:
 * {
 *   adminId?: number,              // Optional: defaults to authenticated user
 *   transactionId?: string,        // M-Pesa/Paystack code
 *   paymentMethod?: 'mpesa'|'paystack',
 *   phoneNumber?: string,
 *   actualPaymentAmount?: number,  // 🆕 PARTIAL PAYMENT: actual amount received
 *   partialPaymentReason?: string  // Required if actualPaymentAmount differs from order.amount
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { adminId, transactionId, paymentMethod, phoneNumber, actualPaymentAmount, partialPaymentReason } = body;

    // Allow internal calls from M-Pesa callback (bypass admin auth check)
    const isInternalCall = request.headers.get('x-internal-call') === 'true';
    
    let finalAdminId = adminId;
    
    if (!isInternalCall) {
      // For external calls, require admin/manager authentication
      const authCheck = await requireRole(request, ['admin', 'manager']);
      if (authCheck.error) {
        return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
      }
      
      // Use authenticated user's ID if adminId not provided
      if (!finalAdminId) {
        finalAdminId = authCheck.user!.id;
      }
    }

    // For internal calls without adminId, use system admin
    if (!finalAdminId) {
      const [systemAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.roleId, 1))
        .limit(1);
      if (systemAdmin) {
        finalAdminId = systemAdmin.id;
      }
    }

    if (!finalAdminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Look up or create payment record for this order
    let [payment] = await db.select().from(payments).where(eq(payments.jobId, orderId)).limit(1);
    
    if (!payment) {
      // Get order to create payment record
      const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
      
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Create payment record
      const now = new Date().toISOString();
      const [newPayment] = await db
        .insert(payments)
        .values({
          jobId: orderId,
          clientId: order.clientId,
          freelancerId: order.assignedFreelancerId || null,
          amount: order.amount || 0,
          paymentMethod: paymentMethod || 'mpesa',
          status: 'pending',
          mpesaCode: transactionId || null,
          phoneNumber: phoneNumber || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      
      payment = newPayment;
    }

    // Update payment with transaction details if provided
    if (transactionId || paymentMethod) {
      await db
        .update(payments)
        .set({
          mpesaCode: transactionId || payment.mpesaCode,
          paymentMethod: paymentMethod || payment.paymentMethod,
          phoneNumber: phoneNumber || payment.phoneNumber,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(payments.id, payment.id));
    }

    // Delegate to confirmPaymentReceived helper (handles state machine + partial payments)
    await confirmPaymentReceived({
      orderId,
      paymentId: payment.id,
      adminId: finalAdminId,
      mpesaCode: transactionId,
      paystackReference: body.paystackReference,
      actualPaymentAmount,
      partialPaymentReason,
    });

    // Fetch updated records
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    const [updatedPayment] = await db.select().from(payments).where(eq(payments.id, payment.id));

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
      message: 'Payment confirmed successfully. Funds reserved for payout.',
      distribution: {
        writer: updatedOrder?.freelancerEarnings || 0,
        manager: updatedOrder?.managerEarnings || 0,
        platform: (updatedOrder?.amount || 0) - (updatedOrder?.freelancerEarnings || 0) - (updatedOrder?.managerEarnings || 0),
        total: updatedOrder?.amount || 0,
      },
      balances: {
        freelancer: freelancerBalance
          ? {
              pending: freelancerBalance.pendingBalance,
              reserved: freelancerBalance.reservedBalance,
              available: freelancerBalance.availableBalance,
            }
          : null,
        manager: managerBalance
          ? {
              pending: managerBalance.pendingBalance,
              reserved: managerBalance.reservedBalance,
              available: managerBalance.availableBalance,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to process payment' }, { status: 500 });
  }
}