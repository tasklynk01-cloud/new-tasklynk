import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments, notifications, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/payments/[id]/reject
 * 
 * Admin rejects a Paystack payment after verification
 * 
 * This endpoint:
 * 1. Verifies payment is pending verification
 * 2. Marks payment as rejected
 * 3. Records rejection reason
 * 4. Notifies client about rejection
 * 5. Creates audit log entry
 * 
 * Auth: Requires admin role
 * 
 * Body:
 * {
 *   rejectionReason: string  // Required - reason for rejection
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   data: {
 *     payment: { ... updated payment record }
 *   }
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
    const paymentId = parseInt(id);
    const body = await request.json();
    const { rejectionReason } = body;

    if (Number.isNaN(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Fetch payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify payment is pending verification
    if (payment.status !== 'pending_verification' && payment.status !== 'pending') {
      return NextResponse.json(
        { error: `Payment already ${payment.status}. Cannot reject.` },
        { status: 400 }
      );
    }

    // Verify it's a Paystack payment
    if (payment.paymentMethod !== 'paystack') {
      return NextResponse.json(
        { error: 'This endpoint is only for Paystack payments' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update payment record to rejected
    await db
      .update(payments)
      .set({
        status: 'rejected',
        confirmedByAdmin: false,
        adminVerificationCode: `REJECTED: ${rejectionReason.trim()}`,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId));

    // Notify client about rejection
    await db.insert(notifications).values({
      userId: payment.clientId,
      jobId: payment.jobId || undefined,
      type: 'payment_rejected',
      title: '❌ Payment Rejected',
      message: `Your Paystack payment of KSh ${payment.amount.toFixed(2)} (Ref: ${payment.paystackReference}) was rejected. Reason: ${rejectionReason.trim()}. Please contact support.`,
      createdAt: now,
    });

    // Create audit log
    await db.insert(auditLogs).values({
      userId: admin.id,
      userEmail: admin.email,
      userRole: admin.role,
      eventType: 'PAYMENT_REJECTED',
      description: `Admin rejected Paystack payment #${paymentId} (${payment.paystackReference}): ${rejectionReason.trim()}`,
      severity: 'HIGH',
      resourceType: 'payment',
      resourceId: paymentId,
      oldValues: JSON.stringify({ status: payment.status }),
      newValues: JSON.stringify({ status: 'rejected', rejectionReason: rejectionReason.trim() }),
      metadata: JSON.stringify({
        paymentId,
        paystackReference: payment.paystackReference,
        amount: payment.amount,
        jobId: payment.jobId,
        clientId: payment.clientId,
        rejectionReason: rejectionReason.trim(),
        rejectedBy: admin.name,
      }),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      createdAt: now,
    });

    // Fetch updated payment
    const [updatedPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      data: {
        payment: updatedPayment,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/v2/payments/[id]/reject] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject payment' },
      { status: 500 }
    );
  }
}
