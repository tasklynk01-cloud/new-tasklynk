/**
 * GET /api/v2/manager/commission-preview
 * 
 * Returns commission preview for an order or batch of orders.
 * Managers can use this to see potential earnings before assignment.
 * 
 * Query params:
 * - orderId: single order ID
 * - orderIds: comma-separated list of order IDs (for batch)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import {
  getManagerCommissionPreview,
  getManagerCommissionBatch,
  getManagerPendingCommission,
} from '@/lib/manager-commission';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const orderIdParam = searchParams.get('orderId');
  const orderIdsParam = searchParams.get('orderIds');
  const includePending = searchParams.get('includePending') === 'true';

  try {
    let response: Record<string, unknown> = {};

    // Single order preview
    if (orderIdParam) {
      const orderId = parseInt(orderIdParam, 10);
      if (isNaN(orderId)) {
        return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 });
      }

      const preview = await getManagerCommissionPreview(orderId);
      if (!preview) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      response.preview = preview;
    }

    // Batch preview
    if (orderIdsParam) {
      const orderIds = orderIdsParam
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      if (orderIds.length === 0) {
        return NextResponse.json({ error: 'No valid orderIds provided' }, { status: 400 });
      }

      const batchPreviews = await getManagerCommissionBatch(orderIds);
      response.batch = Object.fromEntries(batchPreviews);
    }

    // Include manager's pending commission summary
    if (includePending && authCheck.user.role === 'manager') {
      const pendingCommission = await getManagerPendingCommission(authCheck.user.id);
      response.pendingCommission = pendingCommission;
    }

    // If no specific request, show usage
    if (!orderIdParam && !orderIdsParam && !includePending) {
      return NextResponse.json({
        error: 'Missing parameters',
        usage: {
          orderId: 'Single order ID for commission preview',
          orderIds: 'Comma-separated order IDs for batch preview',
          includePending: 'Set to "true" to include manager pending commission summary',
        },
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...response });
  } catch (error) {
    console.error('[Manager Commission Preview] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission preview' },
      { status: 500 }
    );
  }
}

