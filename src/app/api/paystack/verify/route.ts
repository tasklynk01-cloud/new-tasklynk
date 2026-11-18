import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, invoices, users, notifications } from '@/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';
import { getAuthenticatedUserResult } from '@/lib/admin-auth';

// ✅ USE LIVE SECRET KEY from environment variable (no fallback for security)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Simple in-memory rate limiter (best-effort; resets on restart)
const rl = (globalThis as any).__PAYSTACK_VERIFY_RL__ || new Map<string, { count: number; reset: number }>();
(globalThis as any).__PAYSTACK_VERIFY_RL__ = rl;
function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = rl.get(key);
  if (!entry || now > entry.reset) {
    rl.set(key, { count: 1, reset: now + windowMs });
    return true;
    }
  if (entry.count < limit) {
    entry.count += 1;
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Rate limit per IP
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(`paystack-verify:${ip}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // ✅ Authorization: supports both Bearer tokens and httpOnly cookies
    const authResult = await getAuthenticatedUserResult(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: authResult.error || 'Unauthorized. Please log in to continue.',
        code: 'AUTHENTICATION_REQUIRED'
      }, { status: authResult.status || 401 });
    }

    const requester = authResult.user;
    const requesterId = requester.id;

    const body = await request.json();
    const { 
      reference, 
      jobId, 
      clientId, 
      freelancerId, 
      totalAmount,
      phoneNumber
    } = body;

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing required field: reference' },
        { status: 400 }
      );
    }

    let resolvedJobId = jobId ? parseInt(jobId) : null;
    let resolvedClientId = clientId ? parseInt(clientId) : null;

    if (!resolvedJobId || !resolvedClientId) {
      const [paymentByRef] = await db
        .select()
        .from(payments)
        .where(eq(payments.paystackReference, reference))
        .limit(1);
      if (paymentByRef) {
        resolvedJobId = resolvedJobId ?? paymentByRef.jobId ?? null;
        resolvedClientId = resolvedClientId ?? paymentByRef.clientId ?? null;
      }
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key not configured');
      return NextResponse.json(
        { error: 'Paystack configuration missing' },
        { status: 500 }
      );
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('Paystack API error:', errorText);
      return NextResponse.json(
        { status: 'failed', message: 'Paystack verification request failed', error: errorText },
        { status: 500 }
      );
    }

    const verifyData = await verifyResponse.json();

    if (!verifyData.status) {
      return NextResponse.json({ status: 'failed', message: 'Paystack verification failed' }, { status: 400 });
    }

    const paystackStatus = verifyData.data?.status;
    if (paystackStatus !== 'success') {
      if (paystackStatus === 'failed' || paystackStatus === 'abandoned') {
        return NextResponse.json({ status: 'failed', message: `Payment ${paystackStatus}` }, { status: 400 });
      }
      return NextResponse.json({ status: 'pending', message: 'Payment pending', data: { status: paystackStatus } });
    }

    const metaJobId = verifyData.data?.metadata?.jobId ? parseInt(String(verifyData.data.metadata.jobId)) : null;
    const metaClientId = verifyData.data?.metadata?.clientId ? parseInt(String(verifyData.data.metadata.clientId)) : null;
    resolvedJobId = resolvedJobId ?? metaJobId;
    resolvedClientId = resolvedClientId ?? metaClientId;

    if (!resolvedClientId) {
      return NextResponse.json({ error: 'Unable to resolve client for this payment' }, { status: 400 });
    }

    if (requester.role !== 'admin' && requester.id !== resolvedClientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let job: typeof jobs.$inferSelect | undefined;
    if (resolvedJobId) {
      const [foundJob] = await db.select().from(jobs).where(eq(jobs.id, resolvedJobId)).limit(1);
      if (!foundJob) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      if (foundJob.clientId !== resolvedClientId && requester.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: job does not belong to client' }, { status: 403 });
      }
      if (foundJob.status === 'cancelled' || foundJob.status === 'completed') {
        return NextResponse.json({ error: `Cannot pay for a ${foundJob.status} job` }, { status: 400 });
      }
      job = foundJob;
    }

    const expectedAmount = Number((job as any)?.statusTotalAmount ?? job?.amount ?? 0);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid job pricing. Please contact support.', code: 'INVALID_JOB_AMOUNT' },
        { status: 400 }
      );
    }

    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);

    if (existingPayment && existingPayment.status === 'confirmed') {
      if (resolvedJobId && job?.status !== 'paid') {
        const nowIdem = new Date().toISOString();
        await db.update(jobs).set({ status: 'paid', paymentConfirmed: true, updatedAt: nowIdem }).where(eq(jobs.id, resolvedJobId));
      }
      return NextResponse.json({
        status: 'success',
        message: 'Payment already confirmed (idempotent)'.trim(),
        data: { paymentId: existingPayment.id, reference }
      });
    }

    // Get amount from Paystack response (convert from kobo to KES)
    const paidAmount = verifyData.data.amount / 100;
    const now = new Date().toISOString();

    // Check if payment amount matches DB expected amount (allow small difference for rounding)
    if (Math.abs(paidAmount - expectedAmount) > 1) {
      console.error('Payment amount mismatch:', { paidAmount, expectedAmount, clientProvidedTotalAmount: totalAmount });
      return NextResponse.json({
        status: 'failed',
        message: `Payment amount mismatch. Expected: ${expectedAmount}, Received: ${paidAmount}`,
      });
    }

    // ✅ If payment exists but not confirmed, validate transition then confirm
    if (existingPayment) {
      if (existingPayment.status !== 'pending') {
        return NextResponse.json({ error: `Invalid payment state transition from ${existingPayment.status} to confirmed` }, { status: 400 });
      }
      await db
        .update(payments)
        .set({
          status: 'confirmed',
          confirmedByAdmin: requester.role === 'admin',
          confirmedAt: now,
          updatedAt: now,
        })
        .where(eq(payments.id, existingPayment.id));

      if (resolvedJobId) {
        await db
          .update(jobs)
          .set({
            status: 'paid',
            paymentConfirmed: true,
            updatedAt: now,
          })
          .where(eq(jobs.id, resolvedJobId));
      }

      // ✅ Notify client
      await db.insert(notifications).values({
        userId: resolvedClientId,
        jobId: resolvedJobId ?? undefined,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        message: `Your payment of KES ${expectedAmount} has been confirmed.`,
        createdAt: now,
        read: false,
      });

      return NextResponse.json({
        status: 'success',
        message: 'Payment confirmed successfully',
        data: { paymentId: existingPayment.id, reference }
      });
    }

    // ✅ AUTO-APPROVE PAYMENT - Create payment record with confirmed status (omit id for auto-increment)
    const paymentData = {
      jobId: resolvedJobId ?? undefined,
      clientId: resolvedClientId,
      freelancerId: freelancerId ? parseInt(freelancerId) : null,
      amount: expectedAmount,
      phoneNumber: phoneNumber || null,
      paystackReference: reference,
      mpesaCheckoutRequestId: reference, // Use same reference for consistency
      mpesaReceiptNumber: reference,
      paymentMethod: 'paystack' as const,
      status: 'confirmed' as const,
      confirmedByAdmin: requester.role === 'admin', // ✅ mark if admin confirmed
      confirmedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    
    // Insert without .returning() to avoid auto-increment issues
    await db.insert(payments).values(paymentData);
    
    // Fetch payment back using Paystack reference
    const [payment] = await db.select().from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);


    // ✅ Update job: mark as PAID and paymentConfirmed (do NOT complete)
    if (resolvedJobId) {
      await db
        .update(jobs)
        .set({
          status: 'paid',
          paymentConfirmed: true,
          amount: expectedAmount,
          statusTotalAmount: expectedAmount,
          updatedAt: now,
        })
        .where(eq(jobs.id, resolvedJobId));
    }


    // ✅ Create PENDING invoice using CPP-based calculations
    try {
      // Fetch job details for CPP calculation
      if (!resolvedJobId) {
        throw new Error('Job not found for invoice creation');
      }

      const [jobDetails] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, resolvedJobId))
        .limit(1);

      if (!jobDetails) {
        throw new Error('Job not found for invoice creation');
      }

      const parsedAmount = expectedAmount;
      
      // Fetch freelancer to get completedJobs count for CPP tier calculation
      let freelancerCompletedJobs = 0;
      if (freelancerId) {
        const [freelancer] = await db.select()
          .from(users)
          .where(eq(users.id, parseInt(freelancerId)))
          .limit(1);
        if (freelancer) {
          // ✅ Use completedJobs + 1 for post-completion tier calculation
          freelancerCompletedJobs = (freelancer.completedJobs || 0) + 1;
        }
      }
      
      // Calculate writer earnings using CPP LEVEL SYSTEM: pages * (150-200 based on tier) + slides * 100
      // Calculated with post-completion count to match the tier after this order
      const freelancerAmount = calculateWriterEarningsByCPPLevel(
        jobDetails.pages || 0,
        jobDetails.slides || 0,
        jobDetails.workType,
        freelancerCompletedJobs,
        Boolean(jobDetails.singleSpaced)  // 🔴 Include single-spaced flag
      );
      
      // Calculate admin commission: clientAmount - (writerPayout + managerEarnings)
      const managerEarnings = jobDetails.managerEarnings || 0;
      const adminCommission = Math.max(0, parsedAmount - (freelancerAmount + managerEarnings));

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
        jobId: resolvedJobId,
        clientId: resolvedClientId,
        freelancerId: freelancerId ? parseInt(freelancerId) : null,
        invoiceNumber,
        amount: parsedAmount,
        freelancerAmount,
        managerAmount: managerEarnings,
        adminCommission,
        companyFee: 0, // ✅ Explicitly set
        managerAdditionalIncluded: 0, // ✅ Explicitly set
        clientBonusIncluded: 0, // ✅ Explicitly set
        description: `Payment for order ${jobDetails.displayId || jobDetails.orderNumber || jobId}`,
        status: 'pending',
        isPaid: false,
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      });

      // ✅ AUTOMATION: Notify manager assigned to this client/order (best-effort)
      const managerToNotify = (jobDetails as any).managerId || null;
      if (managerToNotify) {
        await db.insert(notifications).values({
          userId: managerToNotify,
          jobId: resolvedJobId,
          type: 'payment_confirmed',
          title: '✅ Payment Confirmed',
          message: `Payment confirmed for order ${jobDetails.displayId || jobDetails.orderNumber || `#${resolvedJobId}`}. You can proceed with next steps.`,
          createdAt: now,
          read: false,
        });
      }

    } catch (invErr) {
      console.error('Failed to create pending invoice:', invErr);
    }

    // ✅ Notify client (auto-approved path)
    await db.insert(notifications).values({
      userId: resolvedClientId,
      jobId: resolvedJobId ?? undefined,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `Your payment of KES ${expectedAmount} has been confirmed.`,
      createdAt: now,
      read: false,
    });

    // ❌ Remove premature freelancer balance crediting; handled when invoice is marked paid

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified and auto-approved successfully. Order moved to PAID and invoice created (pending).',
      data: {
        paymentId: payment.id,
        reference: reference,
        amount: expectedAmount,
        paidAmount: paidAmount,
        phoneNumber: phoneNumber,
        autoApproved: true,
        channel: verifyData.data.channel,
        paidAt: verifyData.data.paid_at,
      },
    });

  } catch (error: any) {
    console.error('Paystack verification error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message || 'Failed to verify payment',
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

