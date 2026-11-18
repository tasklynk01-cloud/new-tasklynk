import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Verify Paystack Payment Page Transaction
 * 
 * This endpoint verifies payments made through Paystack Payment Pages
 * (like https://paystack.shop/pay/tasklynk)
 * 
 * Unlike the regular payment flow, this doesn't require authentication
 * because customers paying through payment pages may not have accounts yet.
 * 
 * POST /api/paystack/verify-payment-page
 * Body: { reference: string }
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 verifications per minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
      .split(',')[0]
      .trim();
    
    if (!checkRateLimit(`verify-payment-page:${ip}`)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check Paystack configuration
    if (!PAYSTACK_SECRET_KEY) {
      console.error('[Verify Payment Page] Missing PAYSTACK_SECRET_KEY');
      return NextResponse.json(
        { error: 'Payment service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    console.log(`[Verify Payment Page] Verifying payment: ${reference}`);

    // Check if payment already verified in database
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);

    if (existingPayment && existingPayment.status === 'confirmed') {
      console.log(`[Verify Payment Page] Payment already verified: ${reference}`);
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        payment: {
          reference: existingPayment.paystackReference,
          amount: existingPayment.amount,
          status: existingPayment.status,
          confirmedAt: existingPayment.confirmedAt,
        },
      });
    }

    // Verify payment with Paystack API
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
      console.error('[Verify Payment Page] Paystack API error:', verifyResponse.status);
      return NextResponse.json(
        { error: 'Failed to verify payment with Paystack' },
        { status: 500 }
      );
    }

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || !verifyData.data) {
      console.error('[Verify Payment Page] Invalid response from Paystack:', verifyData);
      return NextResponse.json(
        { error: 'Invalid response from payment provider' },
        { status: 500 }
      );
    }

    const { data } = verifyData;

    // Check payment status
    if (data.status !== 'success') {
      console.log(`[Verify Payment Page] Payment not successful: ${data.status}`);
      return NextResponse.json(
        {
          success: false,
          error: `Payment ${data.status}`,
          payment: {
            reference,
            status: data.status,
          },
        },
        { status: 400 }
      );
    }

    // Payment successful
    const amountInKsh = data.amount / 100;
    const now = new Date().toISOString();

    // Extract order metadata if available
    const orderId = data.metadata?.orderId || null;
    const orderDisplayId = data.metadata?.orderDisplayId || null;
    const invoiceId = data.metadata?.invoiceId || null;
    const isBulkPayment = data.metadata?.isBulkPayment === 'true';
    const orderCount = data.metadata?.orderCount ? parseInt(data.metadata.orderCount) : 1;

    console.log(`[Verify Payment Page] Payment verified successfully: ${reference}, Amount: KSh ${amountInKsh}`);
    if (isBulkPayment && invoiceId) {
      console.log(`[Verify Payment Page] Bulk payment - Invoice: ${invoiceId} (${orderCount} orders)`);
    } else if (orderId) {
      console.log(`[Verify Payment Page] Single order - Order: ${orderId} (${orderDisplayId})`);
    }

    // Store payment record if not already stored
    if (!existingPayment) {
      try {
        let clientIdForPayment: number | null = null;
        const numericOrderId = orderId ? Number(orderId) : null;

        if (numericOrderId && !Number.isNaN(numericOrderId)) {
          const [orderRow] = await db
            .select({ clientId: jobs.clientId })
            .from(jobs)
            .where(eq(jobs.id, numericOrderId))
            .limit(1);
          clientIdForPayment = orderRow?.clientId ?? null;
        }

        // Payments table requires a real clientId; if we can't resolve it, skip persisting.
        if (!clientIdForPayment) {
          console.warn(
            `[Verify Payment Page] Skipping payment DB insert: unable to resolve clientId (orderId=${orderId ?? 'null'})`
          );
        } else {
        await db.insert(payments).values({
          // Link to order if orderId is available from metadata
          jobId: numericOrderId,
          clientId: clientIdForPayment,
          amount: amountInKsh,
          paymentMethod: 'paystack',
          status: 'confirmed',
          paystackReference: reference,
          paystackAccessCode: data.access_code || null,
          confirmedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        }

        console.log(`[Verify Payment Page] Payment record created: ${reference}${orderId ? ` linked to order ${orderId}` : ''}`);
      } catch (dbError) {
        console.error('[Verify Payment Page] Failed to create payment record:', dbError);
        // Don't fail the request - payment is still successful
      }
    }

    // Send success email notification
    try {
      const customerEmail = data.customer?.email || 'tasklynkacademic@gmail.com';
      const customerName = data.metadata?.custom_fields?.[0]?.value || data.customer?.email || 'Customer';
      const customerPhone = data.metadata?.custom_fields?.[1]?.value || 'Not provided';

      // Build email content with order info if available
      let emailBody = `
        <h2>New Payment Received via Paystack Payment Page</h2>
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Amount:</strong> KSh ${amountInKsh.toLocaleString()}</p>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Customer Phone:</strong> ${customerPhone}</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
        <p><strong>Payment Method:</strong> ${data.channel || 'Unknown'}</p>
        <p><strong>Paid At:</strong> ${new Date(data.paid_at || now).toLocaleString()}</p>
      `;

      if (isBulkPayment && invoiceId) {
        emailBody += `
        <hr>
        <h3>Bulk Payment Information</h3>
        <p><strong>Transaction Type:</strong> Bulk Payment (Multiple Orders)</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Number of Orders:</strong> ${orderCount}</p>
        <p><em>This payment covers ${orderCount} orders. Please match to invoice and update individual orders accordingly.</em></p>
        `;
      } else if (orderId && orderDisplayId) {
        emailBody += `
        <hr>
        <h3>Single Order Information</h3>
        <p><strong>Transaction Type:</strong> Single Order Payment</p>
        <p><strong>Order Number:</strong> ${orderDisplayId}</p>
        <p><strong>System ID:</strong> ${orderId}</p>
        <p><em>Payment has been automatically linked to this order.</em></p>
        `;
      } else {
        emailBody += `
        <hr>
        <p><em>No order linked. Please follow up with the customer to complete order setup.</em></p>
        `;
      }

      // Send notification email to admin
      let emailSubject = 'New Payment Received - ' + reference;
      if (isBulkPayment && invoiceId) {
        emailSubject = `Bulk Payment Received - Invoice ${invoiceId} - ${reference}`;
      } else if (orderId && orderDisplayId) {
        emailSubject = `Payment Received for Order ${orderDisplayId} - ${reference}`;
      }

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'tasklynkacademic@gmail.com',
          subject: emailSubject,
          html: emailBody,
        }),
      });
    } catch (emailError) {
      console.error('[Verify Payment Page] Failed to send email:', emailError);
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        reference,
        amount: data.amount,
        amountKsh: amountInKsh,
        status: data.status,
        channel: data.channel,
        paidAt: data.paid_at,
        orderId: orderId,
        orderDisplayId: orderDisplayId,
        invoiceId: invoiceId,
        isBulkPayment: isBulkPayment,
        orderCount: orderCount,
        customer: {
          email: data.customer?.email,
          name: data.metadata?.custom_fields?.[0]?.value,
          phone: data.metadata?.custom_fields?.[1]?.value,
        },
      },
    });
  } catch (error: any) {
    console.error('[Verify Payment Page] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

