import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/v2/editor/orders/[id]/mark-ready
 * Editor marks order as ready for admin/manager review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);
    const editorId = authCheck.user.id;

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { notes } = body;

    // Verify job exists and editor has access
    const job = await db
      .select({
        id: jobs.id,
        orderNumber: jobs.orderNumber,
        displayId: jobs.displayId,
        editorStatus: jobs.editorStatus,
        assignedEditorId: jobs.assignedEditorId,
        title: jobs.title,
        status: jobs.status,
        managerId: jobs.managerId,
        editorApprovedAt: jobs.editorApprovedAt,
        editorCompletedAt: jobs.editorCompletedAt,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check editor access
    const editorStatuses = ['editing_in_progress', 'awaiting_revision'];
    if (!editorStatuses.includes(job[0].editorStatus || '')) {
      return NextResponse.json(
        { error: 'Order is not in a state where it can be marked ready' },
        { status: 400 }
      );
    }

    if (job[0].status !== 'editing') {
      return NextResponse.json(
        { error: 'Order must be in editing stage' },
        { status: 400 }
      );
    }

    if (job[0].assignedEditorId && job[0].assignedEditorId !== editorId) {
      return NextResponse.json(
        { error: 'You are not assigned to this order' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const approvalNotes = typeof notes === 'string' && notes.trim().length > 0
      ? notes.trim()
      : null;

    // Update job status
    await db
      .update(jobs)
      .set({
        editorStatus: 'awaiting_admin_review',
        editorApproved: true,
        editorApprovedAt: job[0].editorApprovedAt ?? now,
        editorCompletedAt: now,
        editorApprovalNotes: approvalNotes || 'Editor marked order as ready for admin review',
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Create notification for admin/manager
    const notificationRecipients = new Set<number>();
    if (job[0].managerId) {
      notificationRecipients.add(job[0].managerId);
    }

    const [adminRecipient] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (adminRecipient?.id) {
      notificationRecipients.add(adminRecipient.id);
    }

    const orderLabel = job[0].displayId || job[0].orderNumber || `#${job[0].id}`;

    if (notificationRecipients.size > 0) {
      const payload = Array.from(notificationRecipients).map((userId) => ({
        userId,
        jobId,
        type: 'editor_completed',
        title: 'Editor completed review',
        message: `Order ${orderLabel} is ready for admin review`,
        read: false,
        createdAt: now,
      }));

      await db.insert(notifications).values(payload);
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as ready for admin/manager review',
      editorStatus: 'awaiting_admin_review',
    });
  } catch (error) {
    console.error('Error marking order as ready:', error);
    return NextResponse.json(
      { error: 'Failed to mark order as ready' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/editor/orders/[id]
 * Get order details for editor (without exposing client/freelancer identity)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['editor', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get job details WITHOUT client/freelancer identities (per requirements)
    const job = await db
      .select({
        id: jobs.id,
        orderNumber: jobs.orderNumber,
        displayId: jobs.displayId,
        title: jobs.title,
        pages: jobs.pages,
        slides: jobs.slides,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        deadline: jobs.deadline,
        actualDeadline: jobs.actualDeadline,
        freelancerDeadline: jobs.freelancerDeadline,
        editorNotes: jobs.editorNotes,
        editorRequestedRevision: jobs.editorRequestedRevision,
        editorRevisionNotes: jobs.editorRevisionNotes,
        editorAssignedAt: jobs.editorAssignedAt,
        editorStartedAt: jobs.editorStartedAt,
        editorCompletedAt: jobs.editorCompletedAt,
        editorApprovalNotes: jobs.editorApprovalNotes,
        assignedEditorId: jobs.assignedEditorId,
        workType: jobs.workType,
        instructions: jobs.instructions,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        // DO NOT include: clientId, clientName, assignedFreelancerId, freelancerName, prices, etc.
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Editors can only access orders in editing status
    if (authCheck.user.role === 'editor') {
      const editorStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review'];
      if (!editorStatuses.includes(job[0].editorStatus || '')) {
        return NextResponse.json(
          { error: 'You do not have access to this order' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        ...job[0],
        // Derived fields for compatibility with older clients
        subject: job[0].title,
        description: job[0].instructions,
        academicLevel: job[0].workType,
      },
    });
  } catch (error) {
    console.error('Error fetching order for editor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
