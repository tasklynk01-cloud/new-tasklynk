import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { recommendFreelancersForOrder } from '@/lib/freelancer-recommendations';

// GET /api/v2/orders/[id]/recommended-freelancers
// Admin/Manager helper for writer matching v1.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (Number.isNaN(orderId)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
  const activeLoadCap = searchParams.get('activeLoadCap')
    ? parseInt(searchParams.get('activeLoadCap')!, 10)
    : undefined;

  const recommended = await recommendFreelancersForOrder({ orderId, limit, activeLoadCap });
  return NextResponse.json({ success: true, data: { recommended } });
}
