import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, editorAssignments, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/editor/[id]/approve
 * Editor marks work as ready for admin review.
 * Updates editor gate status without notifying client or freelancer directly.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const jobId = parseInt(params.id, 10);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { editorId: payloadEditorId, approvalNotes } = body ?? {};
    const payloadEditorIdValue =
      typeof payloadEditorId === 'number'
        ? payloadEditorId
        : typeof payloadEditorId === 'string'
        ? Number.parseInt(payloadEditorId, 10)
        : null;
    const approvalNotesText =
      typeof approvalNotes === 'string' && approvalNotes.trim().length > 0
        ? approvalNotes.trim()
        : null;
    const editorId = authCheck.user.id;

    if (Number.isFinite(payloadEditorIdValue) && payloadEditorIdValue !== editorId) {
      return NextResponse.json(
        { error: 'Editors can only approve their own assignments' },
        { status: 403 },
      );
    }

    // Verify authenticated user is editor
    const [editor] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, editorId), eq(users.role, 'editor')))
      .limit(1);

    if (!editor) {
      return NextResponse.json(
        { error: 'Unauthorized: editor account required' },
        { status: 403 },
      );
    }

    // Fetch job metadata
    const jobRows = await db
      .select({
        id: jobs.id,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        assignedEditorId: jobs.assignedEditorId,
        managerId: jobs.managerId,
        title: jobs.title,
        displayId: jobs.displayId,
        orderNumber: jobs.orderNumber,
        editorAssignedAt: jobs.editorAssignedAt,
        editorStartedAt: jobs.editorStartedAt,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    const job = jobRows[0];
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const allowedStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision'];
    if (!allowedStatuses.includes(job.editorStatus ?? '')) {
      return NextResponse.json(
        { error: 'Order is not ready to be marked for admin review' },
        { status: 400 },
      );
    }

    if (job.status !== 'editing') {
      return NextResponse.json(
        { error: 'Order must be in editing stage' },
        { status: 400 },
      );
    }

    if (job.assignedEditorId && job.assignedEditorId !== editorId) {
      return NextResponse.json(
        { error: 'You are not assigned to this order' },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();

    // Update or create editor assignment record
    const existingAssignment = await db
      .select({
        id: editorAssignments.id,
        assignedAt: editorAssignments.assignedAt,
        reviewStartedAt: editorAssignments.reviewStartedAt,
      })
      .from(editorAssignments)
      .where(and(eq(editorAssignments.jobId, jobId), eq(editorAssignments.editorId, editorId)))
      .limit(1);

    const reviewStartedAt = existingAssignment[0]?.reviewStartedAt || job.editorStartedAt || now;

    if (existingAssignment.length) {
      await db
        .update(editorAssignments)
        .set({
          approvalStatus: 'approved',
          approvalReason: approvalNotesText || 'Ready for admin review',
          reviewStartedAt,
          updatedAt: now,
        })
        .where(eq(editorAssignments.id, existingAssignment[0].id));
    } else {
      await db.insert(editorAssignments).values({
        editorId,
        jobId,
        assignedAt: job.editorAssignedAt || job.editorStartedAt || now,
        reviewStartedAt,
        approvalStatus: 'approved',
        approvalReason: approvalNotesText || 'Ready for admin review',
        revisionsRequested: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db
      .update(jobs)
      .set({
        editorStatus: 'awaiting_admin_review',
        editorApproved: true,
        editorApprovedAt: now,
        editorApprovalNotes: approvalNotesText || 'Editor marked order as ready for admin review',
        editorCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Notify manager/admin for review
    const notificationRecipients = new Set<number>();
    if (job.managerId) {
      notificationRecipients.add(job.managerId);
    }

    const [adminRecipient] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (adminRecipient?.id) {
      notificationRecipients.add(adminRecipient.id);
    }

    const orderLabel = job.displayId || job.orderNumber || `#${job.id}`;

    const notificationPayload = Array.from(notificationRecipients).map((userId) => ({
      userId,
      jobId,
      type: 'editor_completed',
      title: 'Editor completed review',
      message: `Order ${orderLabel} is ready for admin review`,
      read: false,
      createdAt: now,
    }));

    if (notificationPayload.length) {
      try {
        await db.insert(notifications).values(notificationPayload);
      } catch (notifError) {
        console.error('Failed to record editor completion notifications:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as ready for admin review',
      jobId,
      editorStatus: 'awaiting_admin_review',
      approvedAt: now,
    });

  } catch (error) {
    console.error('Editor approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve work' },
      { status: 500 }
    );
  }
}
