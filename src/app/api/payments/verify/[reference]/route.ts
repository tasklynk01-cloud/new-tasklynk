import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUserResult } from '@/lib/admin-auth';
import { verifyPaystackPayment, getPaymentCorsHeaders } from '@/lib/paystack';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getPaymentCorsHeaders(request),
  });
}

/**
 * GET /payments/verify/:reference (or /api/payments/verify/:reference)
 * Server-side transaction verification against Paystack
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> | { reference: string } }
) {
  const corsHeaders = getPaymentCorsHeaders(request);
  const resolvedParams = await params;
  const reference = resolvedParams.reference;

  if (!reference) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_REFERENCE',
          message: 'Payment reference is required.',
        },
      },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // 1. Verify with Paystack API
    const paystackRes = await verifyPaystackPayment(reference);

    if (!paystackRes.status || !paystackRes.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: paystackRes.message || 'Payment verification failed at gateway.',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const paystackData = paystackRes.data;
    const paidAmount = paystackData.amount / 100; // In KES
    const isSuccess = paystackData.status === 'success';

    // 2. Fetch corresponding database payment
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);

    // Check authorization if user session is present
    const authResult = await getAuthenticatedUserResult(request);
    const user = authResult.success ? authResult.user : null;

    if (existingPayment && user && user.role !== 'admin' && existingPayment.clientId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to access this transaction.',
          },
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Return sanitized response (never leaking secret gateway keys)
    return NextResponse.json(
      {
        success: true,
        data: {
          reference: paystackData.reference,
          status: paystackData.status,
          amount: paidAmount,
          currency: paystackData.currency || 'KES',
          paid_at: paystackData.paid_at || paystackData.paidAt || null,
          channel: paystackData.channel,
          verified: isSuccess,
          source: existingPayment?.source || 'website',
          order_id: existingPayment?.jobId || null,
          customer: {
            email: paystackData.customer?.email,
          },
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error(`[Payments Verify API] Error verifying ${reference}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYMENT_VERIFICATION_FAILED',
          message: error.message || 'Failed to verify transaction with payment provider.',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
