import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy endpoint placeholder for /api/jobs/[id]/confirm-payment.
 * This route has been deprecated in favor of
 * POST /api/v2/orders/[id]/admin/confirm-payment.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.warn(
    `[DEPRECATED] /api/jobs/${id}/confirm-payment invoked. Use /api/v2/orders/${id}/admin/confirm-payment instead.`
  );

  return NextResponse.json(
    {
      error: 'This endpoint has been removed. Use /api/v2/orders/[id]/admin/confirm-payment.',
      code: 'ENDPOINT_DEPRECATED',
    },
    { status: 410 }
  );
}
