import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, orderHistory } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import {
  parseDarajaC2BCallback,
  normalizeKenyanPhoneNumber,
  generatePaymentReference,
  recordPaymentAuditLog,
} from '@/lib/mpesa-service';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';

/**
 * POST /api/payments/mpesa/c2b/confirmation
 * Public endpoint called by Safaricom when customer pays directly to the Till
 */
export async function POST(request: NextRequest) {
  const safaricomSuccessResponse = NextResponse.json({
    ResultCode: 0,
    ResultDesc: 'Success',
  });

  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return safaricomSuccessResponse;
    }

    console.log('[M-Pesa C2B Confirmation] Received payload:', JSON.stringify(rawBody).slice(0, 300));
    const parsed = parseDarajaC2BCallback(rawBody);

    if (!parsed || !parsed.transId) {
      console.warn('[M-Pesa C2B Confirmation] Missing TransID');
      return safaricomSuccessResponse;
    }

    const {
      transId,
      transAmount,
      transTime,
      msisdn,
      billRefNumber,
      businessShortCode,
    } = parsed;

    // Check if this M-PESA receipt has already been processed (Idempotency)
    const [existingReceipt] = await db
      .select()
      .from(payments)
      .where(eq(payments.mpesaReceiptNumber, transId))
      .limit(1);

    if (existingReceipt) {
      console.log(`[M-Pesa C2B Confirmation] Receipt ${transId} already recorded. Skipping.`);
      return safaricomSuccessResponse;
    }

    const phoneInfo = normalizeKenyanPhoneNumber(msisdn);
    const nowIso = new Date().toISOString();
    const cleanBillRef = (billRefNumber || '').trim();

    // 1. Attempt Automatic Matching
    let matchedOrder: any = null;
    let matchedPayment: any = null;

    if (cleanBillRef) {
      // Check 1: Match against payment reference (TLK-...)
      const [byRef] = await db
        .select()
        .from(payments)
        .where(eq(payments.reference, cleanBillRef))
        .limit(1);
      if (byRef) matchedPayment = byRef;

      // Check 2: Match against order orderNumber
      if (!matchedPayment) {
        const [byOrderNumber] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.orderNumber, cleanBillRef))
          .limit(1);
        if (byOrderNumber) matchedOrder = byOrderNumber;
      }

      // Check 3: Match against order displayId
      if (!matchedPayment && !matchedOrder) {
        const [byDisplayId] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.displayId, cleanBillRef))
          .limit(1);
        if (byDisplayId) matchedOrder = byDisplayId;
      }

      // Check 4: If billRef is pure digits, try order ID
      if (!matchedPayment && !matchedOrder && /^\d+$/.test(cleanBillRef)) {
        const numId = parseInt(cleanBillRef, 10);
        const [byId] = await db.select().from(jobs).where(eq(jobs.id, numId)).limit(1);
        if (byId) matchedOrder = byId;
      }
    }

    // If order was matched but no payment record exists, look for pending payment on that order
    if (matchedOrder && !matchedPayment) {
      const [orderPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.jobId, matchedOrder.id))
        .limit(1);
      matchedPayment = orderPayment;
    }

    // CASE A: Successfully Matched Payment/Order
    if (matchedPayment || matchedOrder) {
      const order = matchedOrder || (await db.select().from(jobs).where(eq(jobs.id, matchedPayment.jobId)).limit(1))[0];
      const expectedAmount = Number(order?.amount || matchedPayment?.amount || transAmount);

      const isMismatch = Math.abs(transAmount - expectedAmount) > 0.01;
      const statusToSet = isMismatch ? 'payment_review_required' : 'paid';

      let paymentId = matchedPayment?.id;

      if (matchedPayment) {
        await db
          .update(payments)
          .set({
            status: statusToSet,
            amount: transAmount,
            mpesaReceiptNumber: transId,
            mpesaTransactionDate: transTime,
            phoneNumber: phoneInfo.normalized || msisdn,
            resultCode: 0,
            resultDescription: 'C2B direct payment confirmed',
            reconciled: !isMismatch,
            reconciledAt: nowIso,
            reconciliationNotes: `Matched via bill reference: ${cleanBillRef}`,
            rawCallback: rawBody,
            paidAt: nowIso,
            confirmedByAdmin: true,
            confirmedAt: nowIso,
            updatedAt: nowIso,
          })
          .where(eq(payments.id, matchedPayment.id));
      } else {
        // Create new matched payment record
        const [created] = await db
          .insert(payments)
          .values({
            reference: generatePaymentReference('TLK'),
            jobId: order.id,
            orderId: order.id,
            clientId: order.clientId,
            userId: order.clientId,
            amount: transAmount,
            currency: 'KES',
            paymentMethod: 'mpesa',
            provider: 'mpesa',
            status: statusToSet,
            mpesaReceiptNumber: transId,
            mpesaTransactionDate: transTime,
            phoneNumber: phoneInfo.normalized || msisdn,
            resultCode: 0,
            resultDescription: 'C2B direct payment confirmed',
            reconciled: !isMismatch,
            reconciledAt: nowIso,
            reconciliationNotes: `Matched via bill reference: ${cleanBillRef}`,
            rawCallback: rawBody,
            paidAt: nowIso,
            confirmedByAdmin: true,
            confirmedAt: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
          })
          .returning();
        paymentId = created.id;
      }

      await recordPaymentAuditLog(paymentId, isMismatch ? 'payment_review_required' : 'payment_paid', 'safaricom', {
        source: 'c2b_confirmation',
        transId,
        transAmount,
        billRefNumber: cleanBillRef,
        isMismatch,
      });

      // Fulfill order if fully paid and not mismatch
      if (!isMismatch && order && order.status !== 'paid' && !(order as any).paymentConfirmed) {
        try {
          const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
          const adminId = adminUser?.id || order.clientId;

          if (['approved', 'delivered'].includes(order.status)) {
            await confirmPaymentReceived({
              orderId: order.id,
              paymentId,
              adminId,
              mpesaCode: transId,
              actualPaymentAmount: transAmount,
            });
          } else {
            await db
              .update(jobs)
              .set({ status: 'paid', paymentConfirmed: true, paidAt: nowIso, updatedAt: nowIso })
              .where(eq(jobs.id, order.id));
          }
          console.log(`[M-Pesa C2B] ✓ Successfully reconciled and fulfilled order ${order.id}`);
        } catch (fulfillErr) {
          console.error('[M-Pesa C2B] Fulfillment error:', fulfillErr);
        }
      }

      return safaricomSuccessResponse;
    }

    // CASE B: Unmatched Direct Payment (Never lose customer's money!)
    console.warn(`[M-Pesa C2B] UNMATCHED payment received: Receipt ${transId}, Amount ${transAmount}, Ref: "${cleanBillRef}"`);

    // Find default admin user as placeholder client for unmatched payment
    const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    const fallbackClientId = adminUser?.id || 1;

    const [unmatchedRecord] = await db
      .insert(payments)
      .values({
        reference: generatePaymentReference('TLK-UNMATCHED'),
        clientId: fallbackClientId,
        amount: transAmount,
        currency: 'KES',
        paymentMethod: 'mpesa',
        provider: 'mpesa',
        status: 'paid',
        unmatched: true,
        reconciled: false,
        reconciliationNotes: `Direct C2B payment with bill reference: "${cleanBillRef}". Pending manual admin reconciliation.`,
        mpesaReceiptNumber: transId,
        mpesaTransactionDate: transTime,
        phoneNumber: phoneInfo.normalized || msisdn,
        resultCode: 0,
        resultDescription: 'Unmatched C2B payment received',
        rawCallback: rawBody,
        paidAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .returning();

    await recordPaymentAuditLog(unmatchedRecord.id, 'c2b_payment_unmatched', 'safaricom', {
      transId,
      transAmount,
      billRefNumber: cleanBillRef,
      msisdn: phoneInfo.masked,
    });

    console.log(`[M-Pesa C2B] Recorded unmatched payment ID: ${unmatchedRecord.id}`);

    return safaricomSuccessResponse;
  } catch (error: any) {
    console.error('[M-Pesa C2B Confirmation] Error:', error);
    return safaricomSuccessResponse;
  }
}
