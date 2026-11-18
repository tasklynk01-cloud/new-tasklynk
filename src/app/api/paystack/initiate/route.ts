import { NextRequest } from 'next/server';
import { POST as centralizedInitializePost, OPTIONS as centralizedInitializeOptions } from '@/app/api/payments/initialize/route';

/**
 * Backward compatibility alias for /api/paystack/initiate
 * Routes directly to centralized payment initialization handler
 */
export async function OPTIONS(request: NextRequest) {
  return centralizedInitializeOptions(request);
}

export async function POST(request: NextRequest) {
  return centralizedInitializePost(request);
}
