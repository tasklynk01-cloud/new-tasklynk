import { NextRequest } from 'next/server';
import { POST as handleProductionStkPush } from '@/app/api/payments/mpesa/stk/route';

export const runtime = 'nodejs';

/**
 * Backward-compatibility alias for /api/mpesa/stkpush -> /api/payments/mpesa/stk
 */
export async function POST(request: NextRequest) {
  return handleProductionStkPush(request);
}
