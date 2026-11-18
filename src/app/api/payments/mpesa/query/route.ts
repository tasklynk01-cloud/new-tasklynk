import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, orderHistory } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { queryDarajaStkStatus, recordPaymentAuditLog } from '@/lib/mpesa-service';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';
import { getUserFromRequest } from '@/lib/admin-auth';
import { settleWalletTopup } from '@/lib/settle-wallet-topup';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const { paymentId, checkoutRequestId } = body;

    let targetPayment: any = null;

    if (paymentId) {
      const [p] = await db.select().from(payments).where(eq(payments.id, Number(paymentId))).limit(1);
      targetPayment = p;
    } else if (checkoutRequestId) {
      const [p] = await db
        .select()
        .from(payments)
        .where(
          or(
            eq(payments.checkoutRequestId, checkoutRequestId),
            eq(payments.mpesaCheckoutRequestId, checkoutRequestId)
          )
        )
        .limit(1);
      targetPayment = p;
    }

    if (!targetPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Permission check
    if (user && user.role !== 'admin' && targetPayment.clientId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cReqId = targetPayment.checkoutRequestId || targetPayment.mpesaCheckoutRequestId;
    if (!cReqId) {
      return NextResponse.json({ error: 'Payment has no CheckoutRequestID to query' }, { status: 400 });
    }

    console.log(`[M-Pesa STK Query] Querying status for CheckoutRequestID: ${cReqId}`);
    const queryResult = await queryDarajaStkStatus(cReqId);
    if (targetPayment.purpose === 'wallet_topup') {
      if (queryResult.resultCode === 0) await settleWalletTopup(targetPayment.id, { description: queryResult.resultDesc });
      return NextResponse.json({ success: true, resultCode: queryResult.resultCode, resultDescription: queryResult.resultDesc, paymentStatus: queryResult.resultCode === 0 ? 'paid' : targetPayment.status });
    }

    const nowIso = new Date().toISOString();

    // Check if Safaricom says success (ResultCode === 0)
    if (queryResult.resultCode === 0 && targetPayment.status !== 'paid' && targetPayment.status !== 'completed') {
      console.log(`[M-Pesa STK Query] Payment ${targetPayment.id} confirmed via STK Query!`);

      await db
        .update(payments)
        .set({
          status: 'paid',
          resultCode: 0,
          resultDescription: queryResult.resultDesc || 'Payment confirmed via STK Query',
          paidAt: nowIso,
          confirmedByAdmin: true,
          confirmedAt: nowIso,
          updatedAt: nowIso,
        })
        .where(eq(payments.id, targetPayment.id));

      await recordPaymentAuditLog(targetPayment.id, 'payment_reconciled', user?.role || 'system', {
        source: 'stk_query',
        resultCode: queryResult.resultCode,
        resultDesc: queryResult.resultDesc,
      });

      // Mark order paid if needed
      const orderId = targetPayment.jobId || targetPayment.orderId;
      if (orderId) {
        const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
        if (order && order.status !== 'paid' && !(order as any).paymentConfirmed) {
          try {
            const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
            const adminId = adminUser?.id || targetPayment.clientId;

            if (['approved', 'delivered'].includes(order.status)) {
              await confirmPaymentReceived({
                orderId,
                paymentId: targetPayment.id,
                adminId,
                actualPaymentAmount: Number(targetPayment.amount),
              });
            } else {
              await db
                .update(jobs)
                .set({ status: 'paid', paymentConfirmed: true, paidAt: nowIso, updatedAt: nowIso })
                .where(eq(jobs.id, orderId));
            }
          } catch (e) {
            console.error('[M-Pesa STK Query] Fulfillment error:', e);
          }
        }
      }
    } else if (queryResult.resultCode !== 0 && targetPayment.status === 'awaiting_confirmation') {
      await db
        .update(payments)
        .set({
          status: 'failed',
          resultCode: queryResult.resultCode,
          resultDescription: queryResult.resultDesc,
          updatedAt: nowIso,
        })
        .where(eq(payments.id, targetPayment.id));

      await recordPaymentAuditLog(targetPayment.id, 'payment_failed', 'system', {
        source: 'stk_query',
        resultCode: queryResult.resultCode,
        resultDesc: queryResult.resultDesc,
      });
    }

    return NextResponse.json({
      success: true,
      resultCode: queryResult.resultCode,
      resultDescription: queryResult.resultDesc,
      paymentStatus: queryResult.resultCode === 0 ? 'paid' : targetPayment.status,
    });
  } catch (error: any) {
    console.error('[M-Pesa STK Query API] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to query M-PESA status',
    }, { status: 500 });
  }
}
