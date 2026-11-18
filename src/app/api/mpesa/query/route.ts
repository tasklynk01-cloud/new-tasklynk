import { NextRequest } from 'next/server';
import { POST as handleProductionMpesaQuery } from '@/app/api/payments/mpesa/query/route';

export const runtime = 'nodejs';

/**
 * Backward-compatibility alias for /api/mpesa/query -> /api/payments/mpesa/query
 */
export async function POST(request: NextRequest) {
  return handleProductionMpesaQuery(request);
}
