import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getPaymentCorsHeaders } from '@/lib/paystack';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getPaymentCorsHeaders(request),
  });
}

/**
 * GET /payments/status/:reference (or /api/payments/status/:reference)
 * Safe status inspection endpoint for frontend status polling
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
    const [payment] = await db
      .select({
        id: payments.id,
        reference: payments.paystackReference,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
        source: payments.source,
        purpose: payments.purpose,
        jobId: payments.jobId,
        paidAt: payments.paidAt,
        confirmedAt: payments.confirmedAt,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
      })
      .from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment record not found.',
          },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          reference: payment.reference,
          status: payment.status, // 'pending' | 'confirmed' | 'failed' | 'abandoned'
          is_confirmed: payment.status === 'confirmed',
          amount: Number(payment.amount),
          currency: payment.currency || 'KES',
          source: payment.source || 'website',
          purpose: payment.purpose || 'general',
          order_id: payment.jobId || null,
          paid_at: payment.paidAt || payment.confirmedAt || null,
          created_at: payment.createdAt,
          updated_at: payment.updatedAt,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error(`[Payments Status API] Error checking status for ${reference}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_CHECK_FAILED',
          message: 'Unable to check payment status.',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
