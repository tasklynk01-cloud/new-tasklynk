import { NextRequest } from 'next/server';
import { deliverToClient } from '@/lib/order-lifecycle-api';

// POST /api/v2/orders/[id]/deliver - Manager delivers order to client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return deliverToClient(request, { params: resolvedParams });
}
