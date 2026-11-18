import { NextRequest, NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATED ENDPOINT - DO NOT USE ⚠️
 * 
 * POST /api/jobs/[id]/payment/confirm
 * 
 * This legacy endpoint has been REPLACED by:
 * → POST /api/v2/orders/[id]/admin/confirm-payment
 * 
 * Why deprecated:
 * - Old endpoint directly manipulated balances (no pending→reserved→available flow)
 * - Mixed writerBalances and users.balance updates (dual state)
 * - No transaction safety or audit logging
 * - Bypassed confirmPaymentReceived() helper with proper state machine
 * 
 * Migration guide:
 * 1. Update all frontend calls to /api/v2/orders/[id]/admin/confirm-payment
 * 2. New endpoint requires { paymentId, mpesaCode?, paystackReference? } body
 * 3. Returns structured response with balances breakdown
 * 
 * This endpoint returns 410 Gone to force migration.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  console.warn(
    `[DEPRECATED] /api/jobs/${id}/payment/confirm invoked. Use /api/v2/orders/${id}/admin/confirm-payment instead.`
  );

  return NextResponse.json(
    {
      error: 'This endpoint has been deprecated and removed.',
      code: 'ENDPOINT_DEPRECATED',
      migration: {
        newEndpoint: `/api/v2/orders/${id}/admin/confirm-payment`,
        method: 'POST',
        requiredFields: ['paymentId'],
        optionalFields: ['mpesaCode', 'paystackReference', 'confirmationNotes'],
        documentation: 'See PAYMENT_QUICK_REFERENCE.md for updated flow'
      }
    },
    { status: 410 } // 410 Gone - resource permanently removed
  );
}


