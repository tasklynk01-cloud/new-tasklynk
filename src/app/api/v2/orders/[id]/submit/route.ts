import { NextRequest } from 'next/server';
import { freelancerSubmitWork } from '@/lib/order-lifecycle-api';

// Legacy endpoint retained for backward compatibility. All logic lives in freelancerSubmitWork.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return freelancerSubmitWork(request, { params: await params });
}