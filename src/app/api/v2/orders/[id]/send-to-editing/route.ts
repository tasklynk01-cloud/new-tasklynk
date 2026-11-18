import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { sendToEditingStage } from '@/lib/order-lifecycle-api';

/**
 * POST /api/v2/orders/[id]/send-to-editing
 * Admin/Manager sends order to editing stage
 * Body: { editorId? } - optional, can assign specific editor or leave unassigned
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { editorId, notes } = body || {};

    const result = await sendToEditingStage({
      orderId: jobId,
      actorId: authCheck.user!.id,
      actorRole: authCheck.user!.role,
      editorId: editorId ?? null,
      managerApprovalNotes: notes || null,
    });

    return NextResponse.json({
      success: true,
      message: editorId
        ? 'Order sent to editing and assigned to editor'
        : 'Order sent to editing queue',
      jobId,
      status: result.status,
      assignedEditorId: result.assignedEditorId,
    });
  } catch (error: any) {
    console.error('Error sending order to editing:', error);
    const statusCode = error.message?.includes('cannot be sent') ? 400 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to send order to editing' },
      { status: statusCode }
    );
  }
}

/**
 * PATCH /api/v2/orders/[id]/send-to-editing
 * Update editor assignment for order already in editing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);
    const body = await request.json();
    const { editorId, action } = body;

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get current job
    const job = await db
      .select({
        id: jobs.id,
        orderNumber: jobs.orderNumber,
        displayId: jobs.displayId,
        editorStatus: jobs.editorStatus,
        assignedEditorId: jobs.assignedEditorId,
        title: jobs.title,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'reassign' && editorId) {
      // Reassign to different editor
      const editor = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, editorId),
          eq(users.role, 'editor'),
          eq(users.approved, true)
        ))
        .limit(1);

      if (!editor[0]) {
        return NextResponse.json(
          { error: 'Editor not found or not active' },
          { status: 404 }
        );
      }

      await db
        .update(jobs)
        .set({
          assignedEditorId: editorId,
          editorStatus: 'pending_editing',
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId));

      // Notify new editor
      await db.insert(notifications).values({
        userId: editorId,
        jobId,
        type: 'editor_assignment',
        title: 'Order Reassigned to You',
        message: `Order #${job[0].displayId || job[0].orderNumber} has been reassigned to you`,
        read: false,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: 'Order reassigned to new editor',
      });
    } else if (action === 'unassign') {
      // Remove editor assignment
      await db
        .update(jobs)
        .set({
          assignedEditorId: null,
          editorStatus: 'pending_editing',
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId));

      return NextResponse.json({
        success: true,
        message: 'Editor assignment removed',
      });
    } else if (action === 'approve_editing') {
      // Admin/Manager approves editor's work and sends to client
      await db
        .update(jobs)
        .set({
          editorStatus: 'completed',
          editorApproved: true,
          editorApprovedAt: now,
          status: 'delivered', // Back to delivered status for client
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId));

      return NextResponse.json({
        success: true,
        message: 'Editing approved, order sent to client',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing editorId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating editor assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}
