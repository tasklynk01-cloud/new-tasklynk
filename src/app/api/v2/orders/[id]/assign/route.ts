import { NextRequest } from 'next/server';
import { assignFreelancer } from '@/lib/order-lifecycle-api';

// POST /api/v2/orders/[id]/assign - Assign order to freelancer (with optional bid acceptance)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return assignFreelancer(request, { params: resolvedParams });
}