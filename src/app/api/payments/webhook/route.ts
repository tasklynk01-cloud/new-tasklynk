import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, invoices, notifications, webhookEvents } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { verifyPaystackWebhookSignature, parsePaystackWebhook, getPaymentCorsHeaders } from '@/lib/paystack';
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getPaymentCorsHeaders(request),
  });
}

/**
 * POST /payments/webhook (or /api/payments/webhook)
 * Centralized Paystack Webhook Handler with Idempotency Protection
 *
 * Webhook URL configured in Paystack Dashboard:
 * https://api.tasklynk.co.ke/payments/webhook
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getPaymentCorsHeaders(request);

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    // 1. Verify HMAC SHA512 signature
    if (!signature || !verifyPaystackWebhookSignature(rawBody, signature)) {
      console.warn('[Paystack Webhook] Invalid or missing signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Parse payload safely
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400, headers: corsHeaders });
    }

    const { event, data } = parsePaystackWebhook(payload);
    const reference = data?.reference;
    const paystackEventId = String(data?.id || `${reference || 'event'}-${event}-${data?.paid_at || Date.now()}`);

    console.log(`[Paystack Webhook] Processing event: ${event}, Ref: ${reference}, ID: ${paystackEventId}`);

    // 3. Idempotency Check: prevent duplicate fulfillment
    const [existingEvent] = await db
      .select()
      .from(webhookEvents)
      .where(and(eq(webhookEvents.provider, 'paystack'), eq(webhookEvents.eventId, paystackEventId)))
      .limit(1);

    if (existingEvent && existingEvent.status === 'processed') {
      console.log(`[Paystack Webhook] Event ${paystackEventId} already processed (idempotent ignore)`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200, headers: corsHeaders });
    }

    // 4. Handle events
    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(data);
        break;

      case 'charge.failed':
        await handleChargeFailed(data);
        break;

      default:
        console.log(`[Paystack Webhook] Unhandled event type: ${event}`);
        break;
    }

    // 5. Record event in idempotency table
    const now = new Date().toISOString();
    if (!existingEvent) {
      await db.insert(webhookEvents).values({
        eventId: paystackEventId,
        provider: 'paystack',
        eventType: event,
        reference: reference || null,
        payload,
        status: 'processed',
        createdAt: now,
        processedAt: now,
      });
    }

    return NextResponse.json({ received: true }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('[Paystack Webhook] Error processing event:', error);
    // Return 200 so Paystack does not perform infinite retry storms on application crashes
    return NextResponse.json({ received: true, error: 'Processing error logged' }, { status: 200, headers: corsHeaders });
  }
}

/**
 * Authoritative fulfillment for charge.success
 */
async function handleChargeSuccess(data: any) {
  const reference = data?.reference;
  const rawAmount = Number(data?.amount ?? 0);
  const metadata = data?.metadata || {};
  const paystackTransactionId = data?.id ? String(data.id) : null;
  const paidAt = data?.paid_at || new Date().toISOString();

  if (!reference || !Number.isFinite(rawAmount)) {
    console.warn('[Paystack Webhook] Missing reference or amount in charge.success payload');
    return;
  }

  const amountInKsh = rawAmount / 100;
  const now = new Date().toISOString();

  // 1. Locate payment in DB
  const [existingPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.paystackReference, reference))
    .limit(1);

  // If already confirmed in DB, don't re-fulfill
  if (existingPayment && existingPayment.status === 'confirmed') {
    console.log(`[Paystack Webhook] Payment ${reference} already confirmed in DB`);
    return;
  }

  // 2. Resolve job ID and client ID
  let jobId = existingPayment?.jobId ?? (metadata?.jobId ? Number(metadata.jobId) : null);
  let clientId = existingPayment?.clientId ?? (metadata?.clientId ? Number(metadata.clientId) : null);

  let job: typeof jobs.$inferSelect | undefined;
  if (jobId) {
    const [foundJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (foundJob) {
      job = foundJob;
      if (!clientId) clientId = foundJob.clientId;
    }
  }

  // Resolve client by email if not found
  if (!clientId && data?.customer?.email) {
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.customer.email.toLowerCase().trim()))
      .limit(1);
    if (foundUser) {
      clientId = foundUser.id;
    }
  }

  // 3. Update or create payment record
  let paymentId: number;
  if (existingPayment) {
    await db
      .update(payments)
      .set({
        status: 'confirmed',
        amount: amountInKsh,
        paidAt,
        paystackTransactionId: paystackTransactionId || existingPayment.paystackTransactionId,
        confirmedAt: now,
        confirmedByAdmin: true,
        updatedAt: now,
      })
      .where(eq(payments.id, existingPayment.id));
    paymentId = existingPayment.id;
  } else if (clientId) {
    const [newPayment] = await db
      .insert(payments)
      .values({
        jobId: jobId || null,
        clientId,
        amount: amountInKsh,
        currency: 'KES',
        paymentMethod: data?.channel === 'mobile_money' ? 'mpesa' : 'paystack',
        status: 'confirmed',
        source: metadata?.source || 'website',
        product: metadata?.product || 'tasklynk',
        plan: metadata?.plan || null,
        purpose: jobId ? 'order' : (metadata?.purpose || 'general'),
        email: data?.customer?.email || null,
        paystackReference: reference,
        paystackTransactionId,
        paidAt,
        confirmedAt: now,
        confirmedByAdmin: true,
        metadata,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    paymentId = newPayment.id;
  } else {
    console.warn(`[Paystack Webhook] Unable to find or create client for payment ref: ${reference}`);
    return;
  }

  // 4. If this is an order payment (jobId present), update job status and create invoice
  if (jobId && job) {
    const expectedAmount = Number((job as any)?.statusTotalAmount ?? job?.amount ?? amountInKsh);

    // Update job status to 'paid'
    await db
      .update(jobs)
      .set({
        status: 'paid',
        paymentConfirmed: true,
        paidAt: now,
        amount: expectedAmount,
        statusTotalAmount: expectedAmount,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Create invoice if not yet created
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.jobId, jobId))
      .limit(1);

    if (!existingInvoice) {
      let freelancerCompletedJobs = 0;
      const freelancerId = job.assignedFreelancerId;
      if (freelancerId) {
        const [freelancer] = await db
          .select()
          .from(users)
          .where(eq(users.id, freelancerId))
          .limit(1);
        if (freelancer) {
          freelancerCompletedJobs = (freelancer.completedJobs || 0) + 1;
        }
      }

      const freelancerAmount = calculateWriterEarningsByCPPLevel(
        job.pages || 0,
        job.slides || 0,
        job.workType,
        freelancerCompletedJobs,
        Boolean(job.singleSpaced)
      );

      const managerEarnings = job.managerEarnings || 0;
      const adminCommission = Math.max(0, expectedAmount - (freelancerAmount + managerEarnings));

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayInvoices = await db
        .select()
        .from(invoices)
        .where(gte(invoices.createdAt, startOfDay));
      const sequenceNum = (todayInvoices.length + 1).toString().padStart(5, '0');
      const invoiceNumber = `INV-${dateStr}-${sequenceNum}`;

      await db.insert(invoices).values({
        jobId,
        clientId,
        freelancerId: freelancerId || null,
        invoiceNumber,
        amount: expectedAmount,
        freelancerAmount,
        managerAmount: managerEarnings,
        adminCommission,
        companyFee: 0,
        managerAdditionalIncluded: 0,
        clientBonusIncluded: 0,
        description: `Payment for order ${job.displayId || job.orderNumber || jobId}`,
        status: 'pending',
        isPaid: false,
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Notify client & admin of confirmed order payment
    try {
      await db.insert(notifications).values({
        userId: clientId,
        jobId,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        message: `Your payment of KSh ${amountInKsh.toFixed(2)} for order #${job.displayId || jobId} has been confirmed.`,
        createdAt: now,
        read: false,
      });

      await db.insert(notifications).values({
        userId: 1, // Admin
        jobId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `Paystack payment of KSh ${amountInKsh.toFixed(2)} confirmed for order #${job.displayId || jobId} (Ref: ${reference}).`,
        createdAt: now,
      });
    } catch (err) {
      console.warn('[Paystack Webhook] Notification creation failed:', err);
    }
  } else if (clientId) {
    // 5. Wallet Top-Up / Account Balance Fulfillment
    const [clientUser] = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
    if (clientUser) {
      const newBalance = (clientUser.balance || 0) + amountInKsh;
      const newTotalSpent = (clientUser.totalSpent || 0) + amountInKsh;

      await db
        .update(users)
        .set({
          balance: newBalance,
          totalSpent: newTotalSpent,
          updatedAt: now,
        })
        .where(eq(users.id, clientId));

      console.log(`[Paystack Webhook] Credited KSh ${amountInKsh} to user #${clientId}. New balance: ${newBalance}`);

      try {
        await db.insert(notifications).values({
          userId: clientId,
          type: 'payment_confirmed',
          title: 'Wallet Top-Up Confirmed',
          message: `Your wallet top-up of KSh ${amountInKsh.toFixed(2)} was successful. Your new balance is KSh ${newBalance.toFixed(2)}.`,
          createdAt: now,
          read: false,
        });

        await db.insert(notifications).values({
          userId: 1, // Admin
          type: 'payment_received',
          title: 'Wallet Top-Up Received',
          message: `User #${clientId} (${clientUser.name || clientUser.email}) added KSh ${amountInKsh.toFixed(2)} via Paystack (Ref: ${reference}).`,
          createdAt: now,
        });
      } catch (err) {
        console.warn('[Paystack Webhook] Notification creation failed:', err);
      }
    }
  }

  console.log(`[Paystack Webhook] Successfully fulfilled payment for ref: ${reference}`);
}

/**
 * Handle charge.failed event
 */
async function handleChargeFailed(data: any) {
  const reference = data?.reference;
  if (!reference) return;

  const now = new Date().toISOString();

  const [existingPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.paystackReference, reference))
    .limit(1);

  if (existingPayment) {
    await db
      .update(payments)
      .set({
        status: 'failed',
        updatedAt: now,
      })
      .where(eq(payments.id, existingPayment.id));
  }

  console.log(`[Paystack Webhook] Recorded failed charge for ref: ${reference}`);
}
