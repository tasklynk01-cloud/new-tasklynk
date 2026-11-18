import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIdStr = searchParams.get('paymentId') || searchParams.get('id');
    const reference = searchParams.get('reference');
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    let queryCondition: any = null;

    if (paymentIdStr) {
      const pid = parseInt(paymentIdStr, 10);
      if (!isNaN(pid) && pid > 0) {
        queryCondition = eq(payments.id, pid);
      }
    } else if (reference) {
      queryCondition = eq(payments.reference, reference);
    } else if (checkoutRequestId) {
      queryCondition = or(
        eq(payments.checkoutRequestId, checkoutRequestId),
        eq(payments.mpesaCheckoutRequestId, checkoutRequestId)
      );
    }

    if (!queryCondition) {
      return NextResponse.json({ error: 'Please provide paymentId, reference, or checkoutRequestId' }, { status: 400 });
    }

    const [payment] = await db
      .select({
        id: payments.id,
        reference: payments.reference,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
        orderId: payments.jobId,
        mpesaReceiptNumber: payments.mpesaReceiptNumber,
        resultDescription: payments.resultDescription,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(queryCondition)
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: payment.id,
      reference: payment.reference || `TLK-${payment.id}`,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency || 'KES',
      orderId: payment.orderId,
      receiptNumber: payment.mpesaReceiptNumber || null,
      resultDescription: payment.resultDescription || null,
      paidAt: payment.paidAt || null,
      createdAt: payment.createdAt,
    });
  } catch (error: any) {
    console.error('[Payment Status API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}
