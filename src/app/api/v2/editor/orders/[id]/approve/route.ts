import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/v2/editor/orders/[id]/approve
 * Approve an order after editor review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;
    const orderId = parseInt(id);
    const editorId = authCheck.user.id;
    const editorName = authCheck.user.full_name || authCheck.user.email;

    const { approvalNotes, checklist: _checklist } = await request.json();

    if (!approvalNotes || approvalNotes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Approval notes are required' },
        { status: 400 }
      );
    }

    // Fetch order
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify editor has access
    if (order.assignedEditorId !== editorId) {
      return NextResponse.json(
        { error: 'You do not have access to this order' },
        { status: 403 }
      );
    }

    // Verify order is in correct state
    if (order.editorStatus !== 'editing_in_progress' && order.editorStatus !== 'awaiting_revision') {
      return NextResponse.json(
        { error: 'Order is not in a reviewable state' },
        { status: 400 }
      );
    }

    const approvalTimestamp = new Date().toISOString();

    // Update order
    await db
      .update(jobs)
      .set({
        editorStatus: 'awaiting_admin_review',
        editorApproved: true,
        editorApprovedAt: approvalTimestamp,
        editorApprovalNotes: approvalNotes,
        editorCompletedAt: approvalTimestamp,
        updatedAt: approvalTimestamp,
      })
      .where(eq(jobs.id, orderId));

    // TODO: Add audit logging when proper editor audit table is created

    // Notify admin and manager
    const notificationMessage = `Order ${order.displayId} has been approved by editor and is awaiting admin review`;
    
    // Notify manager if assigned
    if (order.managerId) {
      await createNotification({
        userId: order.managerId,
        type: 'editor_approved_order',
        title: 'Editor Approved Order',
        message: notificationMessage,
        link: `/manager/orders/${order.id}`,
        metadata: { orderId: order.id, editorId, editorName },
      });
    }

    // Notify admin (get first admin user)
    const [admin] = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.role, 'admin'),
      limit: 1,
    });

    if (admin) {
      await createNotification({
        userId: admin.id,
        type: 'editor_approved_order',
        title: 'Editor Approved Order',
        message: notificationMessage,
        link: `/admin/orders/${order.id}`,
        metadata: { orderId: order.id, editorId, editorName },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order approved successfully',
    });
  } catch (error) {
    console.error('Error approving order:', error);
    return NextResponse.json(
      { error: 'Failed to approve order' },
      { status: 500 }
    );
  }
}
