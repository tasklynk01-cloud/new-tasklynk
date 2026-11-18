import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, orderHistory } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import {
  parseDarajaStkCallback,
  recordPaymentAuditLog,
  queryDarajaStkStatus,
} from '@/lib/mpesa-service';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';
import { settleWalletTopup } from '@/lib/settle-wallet-topup';
import { fulfillTrainingBookingPayment } from '@/lib/training-service';

export async function POST(request: NextRequest) {
  // Always prepare 200 OK response for Safaricom immediately
  const safaricomSuccessResponse = NextResponse.json({
    ResultCode: 0,
    ResultDesc: 'Success',
  });

  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      console.warn('[M-Pesa Callback] Empty body received');
      return safaricomSuccessResponse;
    }

    console.log('[M-Pesa Callback] Received webhook payload:', JSON.stringify(rawBody).slice(0, 300));

    const parsed = parseDarajaStkCallback(rawBody);
    if (!parsed || !parsed.checkoutRequestId) {
      console.warn('[M-Pesa Callback] Malformed callback payload');
      return safaricomSuccessResponse;
    }

    const {
      checkoutRequestId,
      merchantRequestId,
      resultCode,
      resultDesc,
      success,
      receiptNumber,
      transactionDate,
      amount: receivedAmount,
      phoneNumber,
    } = parsed;

    // 1. Locate payment by checkoutRequestId or merchantRequestId
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        or(
          eq(payments.checkoutRequestId, checkoutRequestId),
          eq(payments.mpesaCheckoutRequestId, checkoutRequestId)
        )
      )
      .limit(1);

    if (!payment) {
      console.error(`[M-Pesa Callback] No payment found for CheckoutRequestID: ${checkoutRequestId}`);
      return safaricomSuccessResponse;
    }

    const paymentId = payment.id;
    const nowIso = new Date().toISOString();

    // 2. IDEMPOTENCY CHECK
    // If payment is already marked paid or completed, do not process fulfillment again!
    if (payment.status === 'paid' || payment.status === 'completed') {
      console.log(`[M-Pesa Callback] Payment ${paymentId} is already paid. Ignoring duplicate callback.`);
      await recordPaymentAuditLog(paymentId, 'duplicate_callback_ignored', 'safaricom', {
        checkoutRequestId,
        receiptNumber,
      });
      return safaricomSuccessResponse;
    }

    // 3. Record callback received in audit logs
    await recordPaymentAuditLog(paymentId, 'callback_received', 'safaricom', {
      resultCode,
      resultDesc,
      receiptNumber,
      receivedAmount,
      phoneNumber,
    });

    // 4. Handle FAILURE or CANCELLED transactions
    if (!success || resultCode !== 0) {
      console.log(`[M-Pesa Callback] Transaction failed for payment ${paymentId}: [${resultCode}] ${resultDesc}`);
      await db
        .update(payments)
        .set({
          status: 'failed',
          resultCode,
          resultDescription: resultDesc,
          mpesaResultDesc: resultDesc,
          rawCallback: rawBody,
          updatedAt: nowIso,
        })
        .where(eq(payments.id, paymentId));

      await recordPaymentAuditLog(paymentId, 'payment_failed', 'safaricom', {
        resultCode,
        resultDesc,
      });

      return safaricomSuccessResponse;
    }

    // 5. Handle SUCCESSFUL transactions (ResultCode === 0)
    const expectedAmount = Number(payment.amount);
    const actualReceived = Number(receivedAmount);

    // Check for amount mismatch
    const isAmountMismatch = !Number.isFinite(actualReceived) || actualReceived <= 0 || !receiptNumber || Math.abs(actualReceived - expectedAmount) > 0.01;

    if (isAmountMismatch) {
      console.warn(
        `[M-Pesa Callback] ⚠️ AMOUNT MISMATCH for payment ${paymentId}: Expected ${expectedAmount}, received ${actualReceived}`
      );

      await db
        .update(payments)
        .set({
          status: 'payment_review_required',
          resultCode: 0,
          resultDescription: `Amount mismatch: expected KES ${expectedAmount}, received KES ${actualReceived}`,
          mpesaReceiptNumber: receiptNumber,
          mpesaTransactionDate: transactionDate,
          rawCallback: rawBody,
          updatedAt: nowIso,
        })
        .where(eq(payments.id, paymentId));

      await recordPaymentAuditLog(paymentId, 'payment_review_required', 'system', {
        expectedAmount,
        receivedAmount: actualReceived,
        receiptNumber,
        reason: 'Received amount differs from expected payable amount',
      });

      return safaricomSuccessResponse;
    }

    if (!checkoutRequestId.startsWith('SANDBOX-CHK-') && !checkoutRequestId.startsWith('MOCK-CHK-')) {
      try {
        const verified = await queryDarajaStkStatus(checkoutRequestId);
        if (verified.resultCode !== 0) {
          console.warn(`[M-Pesa Callback] STK query returned non-zero code: ${verified.resultCode}`);
          return safaricomSuccessResponse;
        }
      } catch (qErr: any) {
        console.warn(`[M-Pesa Callback] STK status query error (${qErr.message}), relying on callback payload`);
      }
    }

    if (payment.purpose === 'wallet_topup' && !payment.jobId && !payment.orderId) {
      await settleWalletTopup(paymentId, { receiptNumber, transactionDate, description: resultDesc, rawCallback: rawBody });
      return safaricomSuccessResponse;
    }

    // Handle Training Academy booking payment fulfillment
    if (payment.purpose === 'training_booking' || payment.product === 'training_academy') {
      await db
        .update(payments)
        .set({
          status: 'paid',
          resultCode: 0,
          resultDescription: resultDesc || 'Training booking paid successfully.',
          mpesaReceiptNumber: receiptNumber,
          mpesaTransactionDate: transactionDate,
          paidAt: nowIso,
          confirmedByAdmin: true,
          confirmedAt: nowIso,
          rawCallback: rawBody,
          updatedAt: nowIso,
        })
        .where(eq(payments.id, paymentId));

      await recordPaymentAuditLog(paymentId, 'payment_paid', 'safaricom', {
        receiptNumber,
        amount: actualReceived,
        transactionDate,
        purpose: 'training_booking',
      });

      await fulfillTrainingBookingPayment({
        paymentId,
        checkoutRequestId,
        mpesaReceipt: receiptNumber,
        amountPaid: actualReceived,
        rawCallback: rawBody,
      });

      return safaricomSuccessResponse;
    }

    // 6. Valid Successful Payment: mark payment as PAID
    await db
      .update(payments)
      .set({
        status: 'paid',
        resultCode: 0,
        resultDescription: resultDesc || 'The service request is processed successfully.',
        mpesaReceiptNumber: receiptNumber,
        mpesaTransactionDate: transactionDate,
        paidAt: nowIso,
        confirmedByAdmin: true,
        confirmedAt: nowIso,
        rawCallback: rawBody,
        updatedAt: nowIso,
      })
      .where(eq(payments.id, paymentId));

    await recordPaymentAuditLog(paymentId, 'payment_paid', 'safaricom', {
      receiptNumber,
      amount: actualReceived,
      transactionDate,
    });

    // 7. Order fulfillment: update order status to PAID
    const orderId = payment.jobId || payment.orderId;
    if (orderId) {
      const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

      if (order && order.status !== 'paid' && !(order as any).paymentConfirmed) {
        try {
          // Get admin ID for confirmation record
          const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
          const adminId = adminUser?.id || payment.clientId;

          if (['approved', 'delivered'].includes(order.status)) {
            // Standard order flow fulfillment with balance allocation
            await confirmPaymentReceived({
              orderId,
              paymentId,
              adminId,
              mpesaCode: receiptNumber,
              actualPaymentAmount: actualReceived,
            });
          } else {
            // General status direct atomic update
            await db
              .update(jobs)
              .set({
                status: 'paid',
                paymentConfirmed: true,
                paidAt: nowIso,
                updatedAt: nowIso,
              })
              .where(eq(jobs.id, orderId));

            await db.insert(orderHistory).values({
              jobId: orderId,
              action: `Status changed: ${order.status} → paid`,
              oldStatus: order.status,
              newStatus: 'paid',
              actorId: adminId,
              notes: `M-PESA payment confirmed automatically (Receipt: ${receiptNumber})`,
              createdAt: nowIso,
            });
          }

          console.log(`[M-Pesa Callback] ✓ Order ${orderId} successfully marked as PAID`);
        } catch (fulfillErr: any) {
          console.error(`[M-Pesa Callback] Error fulfilling order ${orderId}:`, fulfillErr);
        }
      }
    }

    return safaricomSuccessResponse;
  } catch (err: any) {
    console.error('[M-Pesa Callback] Error processing callback:', err);
    // Safaricom requires a 200 OK response even if an internal error occurs
    return safaricomSuccessResponse;
  }
}
