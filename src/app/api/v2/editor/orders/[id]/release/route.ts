import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/v2/editor/orders/[id]/release
 * Release an order back to pending_editing status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const orderId = parseInt(params.id);
    const editorId = authCheck.user.id;

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Released by editor';

    // Fetch order
    const [order] = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.id, orderId),
          eq(jobs.assignedEditorId, editorId),
          eq(jobs.editorStatus, 'editing_in_progress')
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not in progress' },
        { status: 404 }
      );
    }

    // Update order status
    await db
      .update(jobs)
      .set({
        editorStatus: 'pending_editing',
        editorClaimedAt: null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, orderId));

    // TODO: Add audit logging when proper editor audit table is created

    // Notify admin/manager
    if (order.managerId) {
      await createNotification({
        userId: order.managerId,
        type: 'editor_released_order',
        title: 'Editor Released Order',
        message: `Editor has released order ${order.displayId}. Reason: ${reason}`,
        link: `/manager/orders/${order.id}`,
        metadata: { orderId: order.id, editorId, reason }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order released successfully'
    });
  } catch (error) {
    console.error('Error releasing order:', error);
    return NextResponse.json(
      { error: 'Failed to release order' },
      { status: 500 }
    );
  }
}
