import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, editorAssignments, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/editor/[id]/reject
 * Editor requests revisions and routes order back through management.
 * Keeps communication limited to admin/manager review channels.
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
    const { editorId: payloadEditorId, rejectionReason, requiredRevisions } = body ?? {};
    const payloadEditorIdValue =
      typeof payloadEditorId === 'number'
        ? payloadEditorId
        : typeof payloadEditorId === 'string'
        ? Number.parseInt(payloadEditorId, 10)
        : null;
    const rejectionReasonText =
      typeof rejectionReason === 'string' && rejectionReason.trim().length > 0
        ? rejectionReason.trim()
        : null;
    const requiredRevisionNotes =
      typeof requiredRevisions === 'string' && requiredRevisions.trim().length > 0
        ? requiredRevisions.trim()
        : null;
    const editorId = authCheck.user.id;

    if (!rejectionReasonText) {
      return NextResponse.json(
        { error: 'A rejection reason is required' },
        { status: 400 },
      );
    }

    if (Number.isFinite(payloadEditorIdValue) && payloadEditorIdValue !== editorId) {
      return NextResponse.json(
        { error: 'Editors can only reject their own assignments' },
        { status: 403 },
      );
    }

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

    const jobRows = await db
      .select({
        id: jobs.id,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        assignedEditorId: jobs.assignedEditorId,
        managerId: jobs.managerId,
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

    if (job.status !== 'editing') {
      return NextResponse.json(
        { error: 'Order must be in editing stage' },
        { status: 400 },
      );
    }

    const editableStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision'];
    if (!editableStatuses.includes(job.editorStatus ?? '')) {
      return NextResponse.json(
        { error: 'Order is not currently in editor review' },
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
    const revisionNotes = requiredRevisionNotes
      ? `${rejectionReasonText}\n${requiredRevisionNotes}`
      : rejectionReasonText;

    const existingAssignment = await db
      .select({
        id: editorAssignments.id,
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
          approvalStatus: 'rejected',
          approvalReason: rejectionReasonText,
          revisionsRequested: true,
          revisionNotes,
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
        approvalStatus: 'rejected',
        approvalReason: rejectionReasonText,
        revisionsRequested: true,
        revisionNotes,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db
      .update(jobs)
      .set({
        status: 'in_progress',
        editorStatus: 'awaiting_revision',
        editorApproved: false,
        editorApprovedAt: null,
        editorApprovalNotes: null,
        editorRequestedRevision: true,
        editorRevisionNotes: revisionNotes,
        editorCompletedAt: null,
        revisionRequested: true,
        revisionNotes: `Editor revision request: ${revisionNotes}`,
        hasOpenInternalRevision: true,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

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
      type: 'editor_revision_required',
      title: 'Editor requested revisions',
      message: `Order ${orderLabel} requires revisions. Reason: ${rejectionReasonText}`,
      read: false,
      createdAt: now,
    }));

    if (notificationPayload.length) {
      try {
        await db.insert(notifications).values(notificationPayload);
      } catch (notifError) {
        console.error('Failed to record editor revision notifications:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Revision requested and sent to management for follow-up',
      jobId,
      status: 'in_progress',
      editorStatus: 'awaiting_revision',
      reason: rejectionReasonText,
      rejectedAt: now,
    });

  } catch (error) {
    console.error('Editor rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to reject work' },
      { status: 500 }
    );
  }
}
