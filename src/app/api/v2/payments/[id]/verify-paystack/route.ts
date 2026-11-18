import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPaystackPayment } from '@/lib/paystack';

/**
 * POST /api/v2/payments/[id]/verify-paystack
 * 
 * Verify a Paystack payment by checking with Paystack API
 * 
 * This endpoint directly queries Paystack to verify the payment status
 * Useful for double-checking payment authenticity before approval
 * 
 * Auth: Requires admin or manager role
 * 
 * Response:
 * {
 *   success: true,
 *   verified: boolean,
 *   data: {
 *     localPayment: { ... local payment record },
 *     paystackData: { ... data from Paystack API }
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { id } = await params;
    const paymentId = parseInt(id);

    if (Number.isNaN(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    // Fetch payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.paymentMethod !== 'paystack') {
      return NextResponse.json(
        { error: 'This endpoint is only for Paystack payments' },
        { status: 400 }
      );
    }

    if (!payment.paystackReference) {
      return NextResponse.json(
        { error: 'Payment has no Paystack reference' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack API
    const verificationResult = await verifyPaystackPayment(payment.paystackReference);

    const isVerified = 
      verificationResult.status && 
      verificationResult.data.status === 'success' &&
      verificationResult.data.reference === payment.paystackReference;

    // Convert amount from pesewas to KSh
    const paystackAmount = verificationResult.data.amount / 100;
    const amountMatches = Math.abs(paystackAmount - payment.amount) < 0.01; // Allow 1 cent difference

    return NextResponse.json({
      success: true,
      verified: isVerified && amountMatches,
      data: {
        localPayment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          reference: payment.paystackReference,
          createdAt: payment.createdAt,
        },
        paystackData: {
          reference: verificationResult.data.reference,
          amount: paystackAmount,
          status: verificationResult.data.status,
          paidAt: verificationResult.data.paidAt,
          channel: verificationResult.data.channel,
          currency: verificationResult.data.currency,
          customer: verificationResult.data.customer,
        },
        validation: {
          amountMatches,
          statusSuccess: verificationResult.data.status === 'success',
          referenceMatches: verificationResult.data.reference === payment.paystackReference,
        },
      },
    });
  } catch (error: any) {
    console.error('[POST /api/v2/payments/[id]/verify-paystack] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment with Paystack' },
      { status: 500 }
    );
  }
}
