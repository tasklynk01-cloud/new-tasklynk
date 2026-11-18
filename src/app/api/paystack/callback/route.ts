import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';

/**
 * Paystack Callback Handler
 * 
 * This endpoint handles redirects from Paystack after payment.
 * Users are redirected here after completing payment on Paystack's checkout page.
 * 
 * Callback URL to configure in Paystack Dashboard:
 * Live: https://tasklynk.co.ke/payment/callback
 * (Note: Frontend route handles initial redirect, this API verifies the payment)
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      console.error('[Paystack Callback] No reference provided');
      return NextResponse.redirect(new URL('/payment/failed?error=no_reference', request.url));
    }

    console.log(`[Paystack Callback] Processing payment reference: ${reference}`);

    // Verify payment with Paystack
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
      console.error('[Paystack Callback] Verification request failed:', verifyResponse.status);
      return NextResponse.redirect(new URL(`/payment/failed?error=verification_failed&reference=${reference}`, request.url));
    }

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      console.error('[Paystack Callback] Payment not successful:', verifyData.data?.status);
      return NextResponse.redirect(
        new URL(`/payment/failed?error=payment_${verifyData.data?.status || 'unknown'}&reference=${reference}`, request.url)
      );
    }

    // Payment verified successfully
    const { amount, customer, metadata } = verifyData.data;
    const amountInKsh = amount / 100;

    console.log(`[Paystack Callback] Payment verified: ${reference}, Amount: ${amountInKsh} KSh`);

    const jobId = metadata?.jobId ? parseInt(metadata.jobId) : null;
    const clientIdFromMeta = metadata?.clientId ? parseInt(metadata.clientId) : null;
    const now = new Date().toISOString();

    // Try to get clientId from job if not in metadata
    let clientId = clientIdFromMeta;
    if (!clientId && jobId) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (job) {
        clientId = job.clientId;
      }
    }

    // Check if payment already recorded
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);

    if (!existingPayment || existingPayment.status !== 'confirmed') {
      if (existingPayment) {
        // Update existing payment
        await db
          .update(payments)
          .set({
            status: 'confirmed',
            confirmedAt: now,
            updatedAt: now,
          })
          .where(eq(payments.id, existingPayment.id));
      } else if (clientId) {
        // Create payment record only if we have a valid clientId
        await db.insert(payments).values({
          jobId,
          clientId,
          amount: amountInKsh,
          paystackReference: reference,
          paymentMethod: 'paystack',
          status: 'confirmed',
          confirmedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        console.warn('[Paystack Callback] No clientId available, skipping payment record creation');
      }

      // 🆕 Update client balance for wallet top-ups (no job)
      if (!jobId && clientId) {
        const [client] = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
        if (client) {
          const newBalance = (client.balance || 0) + amountInKsh;
          await db
            .update(users)
            .set({ 
              balance: newBalance,
              totalSpent: (client.totalSpent || 0) + amountInKsh,
              updatedAt: now 
            })
            .where(eq(users.id, clientId));
          
          console.log(`[Paystack Callback] Updated client ${clientId} balance: ${newBalance} KSh (+${amountInKsh} KSh)`);
        }
      }

      // Update job if applicable
      if (jobId) {
        const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

        if (job && job.status !== 'paid' && job.status !== 'completed' && job.status !== 'cancelled') {
          // Calculate freelancer earnings
          let freelancerEarnings = 0;
          const freelancerId = job.assignedFreelancerId;

          if (freelancerId) {
            const [freelancer] = await db
              .select()
              .from(users)
              .where(eq(users.id, freelancerId))
              .limit(1);

            if (freelancer) {
              freelancerEarnings = calculateWriterEarningsByCPPLevel(
                job.pages,
                job.slides,
                job.workType,
                freelancer.completedJobs || 0,
                job.singleSpaced || false
              );
            }
          }

          await db
            .update(jobs)
            .set({
              status: 'paid',
              paymentConfirmed: true,
              freelancerEarnings,
              updatedAt: now,
            })
            .where(eq(jobs.id, jobId));

          // Create notification
          await db.insert(notifications).values({
            userId: 1, // Admin
            type: 'payment_received',
            title: 'Payment Received',
            message: `Payment of KSh ${amountInKsh.toFixed(2)} received for order #${job.displayId || jobId}`,
            jobId,
            createdAt: now,
          });
        }
      }
    }

    // Redirect to unified callback verification page
    const redirectUrl = `/payment/callback?reference=${encodeURIComponent(reference)}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('[Paystack Callback] Error processing callback:', error);
    return NextResponse.redirect(new URL('/payment/callback?status=failed&reason=server_error', request.url));
  }
}

