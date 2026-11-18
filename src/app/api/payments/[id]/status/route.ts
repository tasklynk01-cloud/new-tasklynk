import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, users, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { queryDarajaStkStatus, formatDarajaErrorMessage } from '@/lib/mpesa-service';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';
import { getAuthenticatedUser } from '@/lib/admin-auth';
import { settleWalletTopup } from '@/lib/settle-wallet-topup';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id } = await params;
    const paymentId = parseInt(id, 10);

    if (isNaN(paymentId) || paymentId <= 0) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const [payment] = await db
      .select({
        id: payments.id,
        reference: payments.reference,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
        orderId: payments.jobId,
        mpesaReceiptNumber: payments.mpesaReceiptNumber,
        resultDescription: payments.resultDescription,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        checkoutRequestId: payments.checkoutRequestId,
        mpesaCheckoutRequestId: payments.mpesaCheckoutRequestId,
        clientId: payments.clientId,
        purpose: payments.purpose,
        metadata: payments.metadata,
      })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    if (user.role !== 'admin' && user.id !== payment.clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // If payment is pending/awaiting_confirmation and has a checkoutRequestId,
    // actively query Daraja to see if Safaricom has processed, declined, or failed the transaction
    const activeCheckoutId = payment.checkoutRequestId || payment.mpesaCheckoutRequestId;
    let currentStatus = payment.status;
    let receiptNumber = payment.mpesaReceiptNumber || null;
    let resultDescription = payment.resultDescription || null;
    let paidAt = payment.paidAt || null;

    // Query Daraja for any non-paid transaction with an active checkout request
    if (activeCheckoutId && currentStatus !== 'paid' && currentStatus !== 'completed') {
      try {
        const queryRes = await queryDarajaStkStatus(activeCheckoutId);
        if (queryRes.resultCode === 0) {
          if (payment.purpose === 'wallet_topup') {
            await settleWalletTopup(payment.id, { description: queryRes.resultDesc });
            return NextResponse.json({ id: payment.id, reference: payment.reference, status: 'paid', amount: Number(payment.amount), currency: 'KES', receiptNumber: payment.mpesaReceiptNumber });
          }
          // Success! Confirmed by Safaricom
          currentStatus = 'paid';
          resultDescription = 'The service request is processed successfully.';
          paidAt = new Date().toISOString();
          await db
            .update(payments)
            .set({
              status: 'paid',
              paidAt,
              resultCode: 0,
              resultDescription: 'The service request is processed successfully.',
              updatedAt: paidAt,
            })
            .where(eq(payments.id, paymentId));

          if (payment.orderId) {
            try {
              // If partial wallet deduction was used, deduct it now
              const meta = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
              if (meta?.walletDeduction > 0 && payment.clientId) {
                const [userRow] = await db.select().from(users).where(eq(users.id, payment.clientId)).limit(1);
                if (userRow) {
                  const newBal = Math.max(0, Number(userRow.balance || 0) - Number(meta.walletDeduction));
                  await db.update(users).set({ balance: newBal, updatedAt: paidAt }).where(eq(users.id, payment.clientId));
                }
              }

              // Safe order update matching callback handler
              const [orderRow] = await db.select().from(jobs).where(eq(jobs.id, payment.orderId)).limit(1);
              const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
              const adminId = adminUser?.id || payment.clientId || 1;

              if (orderRow && ['approved', 'delivered'].includes(orderRow.status)) {
                await confirmPaymentReceived({
                  orderId: payment.orderId,
                  paymentId: payment.id,
                  adminId,
                  actualPaymentAmount: Number(payment.amount),
                });
              } else {
                await db
                  .update(jobs)
                  .set({
                    status: 'paid',
                    paymentConfirmed: true,
                    paidAt,
                    updatedAt: paidAt,
                  })
                  .where(eq(jobs.id, payment.orderId));
              }
            } catch (confirmErr) {
              console.error('[Status Route] Order confirmation error:', confirmErr);
            }
          }
        } else if (
          queryRes.resultCode === 4999 ||
          queryRes.resultCode === -1 ||
          queryRes.resultDesc.toLowerCase().includes('processing') ||
          queryRes.resultDesc.toLowerCase().includes('process')
        ) {
          // Transaction is still being authorized on user's phone. Keep polling!
          currentStatus = 'awaiting_confirmation';
        } else if (queryRes.resultCode > 0) {
          // Terminal failure: Cancelled by user (1032), Expired timeout (1037), Insufficient funds (1)
          currentStatus = 'failed';
          resultDescription = formatDarajaErrorMessage(queryRes.resultCode, queryRes.resultDesc);
          await db
            .update(payments)
            .set({
              status: 'failed',
              resultCode: queryRes.resultCode,
              resultDescription,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(payments.id, paymentId));
        }
      } catch (queryErr: any) {
        // Query may fail if prompt was just initiated. Silently continue and return current DB status
      }
    }

    return NextResponse.json({
      id: payment.id,
      reference: payment.reference || `TLK-${payment.id}`,
      status: currentStatus,
      amount: Number(payment.amount),
      currency: payment.currency || 'KES',
      orderId: payment.orderId,
      receiptNumber,
      resultDescription,
      paidAt,
      createdAt: payment.createdAt,
    });
  } catch (error: any) {
    console.error('[Payment Status API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}
