import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, orderHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { recordPaymentAuditLog } from '@/lib/mpesa-service';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdminRole(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status || 401 });
    }

    const admin = adminAuth.user!;
    const { id } = await params;
    const paymentId = parseInt(id, 10);

    if (isNaN(paymentId) || paymentId <= 0) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { orderId: rawOrderId, notes, forceStatus } = body;

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const targetOrderId = rawOrderId ? parseInt(rawOrderId, 10) : payment.jobId || payment.orderId;
    if (!targetOrderId) {
      return NextResponse.json({ error: 'Please specify an Order ID to link this payment to' }, { status: 400 });
    }

    const [order] = await db.select().from(jobs).where(eq(jobs.id, targetOrderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const newStatus = forceStatus || 'paid';

    // Update payment record
    await db
      .update(payments)
      .set({
        jobId: order.id,
        orderId: order.id,
        clientId: order.clientId,
        userId: order.clientId,
        status: newStatus,
        unmatched: false,
        reconciled: true,
        reconciledAt: nowIso,
        reconciledBy: admin.id,
        reconciliationNotes: notes || `Manually reconciled by admin ${admin.name || admin.email}`,
        confirmedByAdmin: true,
        confirmedAt: nowIso,
        paidAt: payment.paidAt || nowIso,
        updatedAt: nowIso,
      })
      .where(eq(payments.id, paymentId));

    await recordPaymentAuditLog(paymentId, 'payment_reconciled', 'admin', {
      adminId: admin.id,
      adminName: admin.name,
      orderId: order.id,
      notes,
    });

    // Fulfill order if not already paid
    if (order.status !== 'paid' && !(order as any).paymentConfirmed) {
      try {
        if (['approved', 'delivered'].includes(order.status)) {
          await confirmPaymentReceived({
            orderId: order.id,
            paymentId,
            adminId: admin.id,
            mpesaCode: payment.mpesaReceiptNumber || undefined,
            actualPaymentAmount: Number(payment.amount),
          });
        } else {
          await db
            .update(jobs)
            .set({ status: 'paid', paymentConfirmed: true, paidAt: nowIso, updatedAt: nowIso })
            .where(eq(jobs.id, order.id));

          await db.insert(orderHistory).values({
            jobId: order.id,
            action: `Status changed: ${order.status} → paid`,
            oldStatus: order.status,
            newStatus: 'paid',
            actorId: admin.id,
            notes: `Manually reconciled payment #${paymentId} by admin`,
            createdAt: nowIso,
          });
        }
      } catch (err) {
        console.error('[Admin Reconcile] Fulfillment error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment #${paymentId} successfully reconciled to Order #${order.id}`,
    });
  } catch (error: any) {
    console.error('[Admin Reconcile API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reconcile payment' }, { status: 500 });
  }
}
