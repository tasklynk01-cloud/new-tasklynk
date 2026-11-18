import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/v2/editor/orders/[id]/claim
 * Claim an order for editing
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

    // Fetch order
    const [order] = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.id, orderId),
          eq(jobs.assignedEditorId, editorId),
          eq(jobs.editorStatus, 'pending_editing')
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not available to claim' },
        { status: 404 }
      );
    }

    // Update order status
    await db
      .update(jobs)
      .set({
        editorStatus: 'editing_in_progress',
        editorClaimedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, orderId));

    // TODO: Add audit logging when proper editor audit table is created

    // Notify admin/manager
    if (order.managerId) {
      await createNotification({
        userId: order.managerId,
        type: 'editor_claimed_order',
        title: 'Editor Claimed Order',
        message: `Editor has claimed order ${order.displayId} for editing`,
        link: `/manager/orders/${order.id}`,
        metadata: { orderId: order.id, editorId }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order claimed successfully'
    });
  } catch (error) {
    console.error('Error claiming order:', error);
    return NextResponse.json(
      { error: 'Failed to claim order' },
      { status: 500 }
    );
  }
}
