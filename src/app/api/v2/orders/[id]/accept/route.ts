import { NextRequest } from 'next/server';
import { acceptOrder } from '@/lib/order-lifecycle-api';
import { handleOptions } from '@/lib/api-helpers';

// POST /api/v2/orders/[id]/accept - Manager claims/accepts an order from their assigned clients
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return acceptOrder(request, { params: resolvedParams });
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}
