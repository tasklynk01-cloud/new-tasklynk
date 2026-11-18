import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPaystackPayment } from '@/lib/paystack';

/**
 * Paystack Callback (V2)
 * URL: https://tasklynk.co.ke/api/v2/payments/paystack/callback
 *
 * Paystack redirects the user here after checkout.
 * We verify the transaction server-side, record it as `pending_verification`,
 * then redirect the user to `/payment-success?reference=...`.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      return NextResponse.redirect(new URL('/payment-success?status=failed&reason=no_reference', request.url));
    }

    const verification = await verifyPaystackPayment(reference);

    if (!verification.status || verification.data.status !== 'success') {
      return NextResponse.redirect(new URL(`/payment-success?status=failed&reference=${encodeURIComponent(reference)}`, request.url));
    }

    const amountInKsh = verification.data.amount / 100;
    const metadata = verification.data.metadata;

    const jobId = metadata?.jobId ? Number.parseInt(String(metadata.jobId), 10) : null;
    const clientId = metadata?.clientId ? Number.parseInt(String(metadata.clientId), 10) : null;
    const now = new Date().toISOString();

    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);

    if (existingPayment) {
      if (existingPayment.status !== 'confirmed') {
        await db
          .update(payments)
          .set({
            status: 'pending_verification',
            amount: amountInKsh,
            confirmedByAdmin: false,
            updatedAt: now,
          })
          .where(eq(payments.id, existingPayment.id));
      }
    } else if (clientId) {
      await db.insert(payments).values({
        jobId: jobId ?? undefined,
        clientId,
        amount: amountInKsh,
        paystackReference: reference,
        paymentMethod: 'paystack',
        status: 'pending_verification',
        confirmedByAdmin: false,
        createdAt: now,
        updatedAt: now,
      });

      // Best-effort notify admin (consistent with webhook behavior)
      try {
        let display = null as string | null;
        if (jobId) {
          const [job] = await db.select({ displayId: jobs.displayId }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
          display = job?.displayId || null;
        }

        await db.insert(notifications).values({
          userId: 1,
          jobId: jobId ?? undefined,
          type: 'payment_pending_verification',
          title: '⚠️ Payment Awaiting Verification',
          message: `Paystack payment of KSh ${amountInKsh.toFixed(2)} received for ${display ? `order ${display}` : (jobId ? `order #${jobId}` : 'wallet top-up')}. Please verify and approve this payment.`,
          createdAt: now,
        });
      } catch (notifyErr) {
        console.warn('[Paystack V2 Callback] Failed to notify admin:', notifyErr);
      }
    }

    // Redirect user to the unified callback verification page
    return NextResponse.redirect(new URL(`/payment/callback?reference=${encodeURIComponent(reference)}`, request.url));
  } catch (error) {
    console.error('[Paystack V2 Callback] Error:', error);
    return NextResponse.redirect(new URL('/payment/callback?status=failed&reason=server_error', request.url));
  }
}

