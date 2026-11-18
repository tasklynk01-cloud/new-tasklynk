import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * POST /api/v2/editor/orders/bulk-claim
 * Claim multiple orders at once
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const editorId = authCheck.user.id;
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order IDs provided' },
        { status: 400 }
      );
    }

    // Fetch valid orders
    const validOrders = await db
      .select()
      .from(jobs)
      .where(
        and(
          inArray(jobs.id, orderIds),
          eq(jobs.assignedEditorId, editorId),
          eq(jobs.editorStatus, 'pending_editing')
        )
      );

    if (validOrders.length === 0) {
      return NextResponse.json(
        { error: 'No valid orders found to claim' },
        { status: 404 }
      );
    }

    const claimTimestamp = new Date().toISOString();
    const successfulOrderIds: number[] = [];

    // Claim each order
    for (const order of validOrders) {
      try {
        await db
          .update(jobs)
          .set({
            editorStatus: 'editing_in_progress',
            editorClaimedAt: claimTimestamp,
            updatedAt: claimTimestamp
          })
          .where(eq(jobs.id, order.id));

        successfulOrderIds.push(order.id);

        // TODO: Add audit logging when proper editor audit table is created
      } catch (err) {
        console.error(`Failed to claim order ${order.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      successCount: successfulOrderIds.length,
      failedCount: orderIds.length - successfulOrderIds.length,
      claimedOrderIds: successfulOrderIds
    });
  } catch (error) {
    console.error('Error bulk claiming orders:', error);
    return NextResponse.json(
      { error: 'Failed to bulk claim orders' },
      { status: 500 }
    );
  }
}

