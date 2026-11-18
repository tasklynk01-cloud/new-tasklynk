import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUserResult } from '@/lib/admin-auth';

/**
 * POST /api/paystack/charge-mobile
 * 
 * Initiate M-Pesa STK Push via Paystack Charge API
 * This endpoint triggers an actual STK push to the customer's phone
 * 
 * Request Body:
 * {
 *   jobId?: number,        // Order ID (optional)
 *   clientId?: number,     // Client ID
 *   amount: number,        // Amount in KSh
 *   email?: string,        // Customer email
 *   phone: string,         // Phone in 254XXXXXXXXX format
 * }
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check Paystack configuration
    if (!PAYSTACK_SECRET_KEY) {
      console.error('[Charge Mobile] Missing PAYSTACK_SECRET_KEY');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Authenticate user
    const authResult = await getAuthenticatedUserResult(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Please log in to continue' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const userId = user.id;

    // Parse request body
    const body = await request.json();
    const { jobId, clientId, amount, email, phone } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required for M-Pesa' },
        { status: 400 }
      );
    }

    // Validate phone format (must be 254XXXXXXXXX)
    if (!/^254[17]\d{8}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Use 254XXXXXXXXX' },
        { status: 400 }
      );
    }

    const customerEmail = email || user.email || `user${userId}@tasklynk.co.ke`;

    // Check if job exists and validate
    let job = null;
    if (jobId) {
      const [foundJob] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!foundJob) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      if (foundJob.clientId !== userId && user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      if (foundJob.status === 'paid' || foundJob.status === 'completed') {
        return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
      }
      
      job = foundJob;

      // Check for existing confirmed payment
      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.jobId, jobId), eq(payments.status, 'confirmed')))
        .limit(1);

      if (existingPayment) {
        return NextResponse.json({ error: 'Payment already confirmed' }, { status: 400 });
      }
    }

    // Generate reference
    const reference = `TL-${jobId || 'TOP'}-${userId}-${Date.now()}`;
    const amountInKobo = Math.round(amount * 100);

    console.log('[Charge Mobile] Initiating STK push:', {
      reference,
      phone,
      amount,
      jobId,
    });

    // Step 1: Initialize transaction first
    const initResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: amountInKobo,
        reference,
        currency: 'KES',
        channels: ['mobile_money'],
        mobile_money: {
          phone,
          provider: 'mpesa',
        },
        metadata: {
          userId,
          clientId: clientId || userId,
          jobId: jobId || null,
          phone,
        },
      }),
    });

    if (!initResponse.ok) {
      const errorData = await initResponse.json().catch(() => ({}));
      console.error('[Charge Mobile] Init failed:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to initialize payment' },
        { status: initResponse.status }
      );
    }

    const initData = await initResponse.json();
    
    if (!initData.status || !initData.data?.access_code) {
      console.error('[Charge Mobile] Invalid init response:', initData);
      return NextResponse.json(
        { error: 'Invalid payment response' },
        { status: 500 }
      );
    }

    const accessCode = initData.data.access_code;

    // Step 2: Charge with mobile money to trigger STK push
    const chargeResponse = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: amountInKobo,
        currency: 'KES',
        mobile_money: {
          phone,
          provider: 'mpesa',
        },
        metadata: {
          userId,
          clientId: clientId || userId,
          jobId: jobId || null,
          reference,
        },
      }),
    });

    const chargeData = await chargeResponse.json();
    
    console.log('[Charge Mobile] Charge response:', {
      status: chargeResponse.status,
      paystackStatus: chargeData.status,
      message: chargeData.message,
      chargeStatus: chargeData.data?.status,
    });

    // Handle different charge responses
    if (!chargeResponse.ok) {
      console.error('[Charge Mobile] Charge failed:', chargeData);
      
      // If charge fails, still return the authorization URL as fallback
      if (initData.data?.authorization_url) {
        // Save payment record
        const now = new Date().toISOString();
        await db.insert(payments).values({
          jobId: jobId || null,
          clientId: clientId || userId,
          amount,
          paystackReference: reference,
          paystackAccessCode: accessCode,
          paymentMethod: 'mpesa',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        });

        return NextResponse.json({
          success: true,
          reference,
          fallback: true,
          authorization_url: initData.data.authorization_url,
          message: 'M-Pesa direct charge not available. Please complete payment on the payment page.',
        });
      }
      
      return NextResponse.json(
        { error: chargeData.message || 'Failed to initiate M-Pesa' },
        { status: chargeResponse.status }
      );
    }

    // Get the actual reference from charge response
    const chargeReference = chargeData.data?.reference || reference;

    // Save payment record
    const now = new Date().toISOString();
    await db.insert(payments).values({
      jobId: jobId || null,
      clientId: clientId || userId,
      amount,
      paystackReference: chargeReference,
      paystackAccessCode: accessCode,
      paymentMethod: 'mpesa',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    console.log('[Charge Mobile] Payment initiated:', {
      reference: chargeReference,
      chargeStatus: chargeData.data?.status,
    });

    // Return success
    return NextResponse.json({
      success: true,
      reference: chargeReference,
      status: chargeData.data?.status || 'pending',
      message: chargeData.data?.display_text || 'Check your phone for M-Pesa prompt',
    });

  } catch (error: any) {
    console.error('[Charge Mobile] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}

