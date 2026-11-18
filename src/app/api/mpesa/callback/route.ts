import { NextRequest, NextResponse } from 'next/server';
import { POST as handleProductionCallback } from '@/app/api/payments/mpesa/callback/route';

/**
 * Backward compatibility alias for /api/mpesa/callback -> /api/payments/mpesa/callback
 * Accepts Safaricom callback without breaking on missing headers
 */
export async function POST(request: NextRequest) {
  return handleProductionCallback(request);
}
