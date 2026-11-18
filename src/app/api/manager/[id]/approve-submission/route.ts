import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { ORDER_STATUS } from '@/db/schema-order-flow-updates';
import { sendToEditingStage } from '@/lib/order-lifecycle-api';
import { validateAndTransitionStatus } from '@/lib/order-flow-helpers';

/**
 * POST /api/manager/[id]/approve-submission
 * Manager reviews freelancer submission before sending to editor
 * TIER 2 FIX #5: Manager Approval Gate
 * 
 * Workflow:
 * in_progress (freelancer working) → manager_review (manager reviews) 
 * → approved_for_editing (ready for editor) → editing → delivered
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['manager', 'admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const user = authCheck.user!;

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { approvalNotes, editorId } = body || {};

    const [job] = await db
      .select({ id: jobs.id, managerId: jobs.managerId, status: jobs.status })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (user.role === 'manager' && job.managerId !== user.id) {
      return NextResponse.json({ error: 'You do not manage this job' }, { status: 403 });
    }

    if (job.status !== ORDER_STATUS.SUBMITTED) {
      return NextResponse.json(
        { error: `Job must be in 'submitted' status for manager review. Current: ${job.status}` },
        { status: 400 }
      );
    }

    const result = await sendToEditingStage({
      orderId: jobId,
      actorId: user.id,
      actorRole: user.role,
      editorId: editorId ?? null,
      managerApprovalNotes: approvalNotes || 'Approved by manager for editing',
      markManagerApproved: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Submission approved and sent to editing',
      jobId,
      status: result.status,
      assignedEditorId: result.assignedEditorId,
    });
  } catch (error: any) {
    console.error('Manager approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve submission' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/[id]/reject-submission
 * Manager rejects freelancer submission and sends it back for revision
 * TIER 2 FIX #5: Manager Approval Gate - Rejection path
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['manager', 'admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const user = authCheck.user!;

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rejectionReason, requiredChanges } = body;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const [job] = await db
      .select({
        id: jobs.id,
        managerId: jobs.managerId,
        status: jobs.status,
        assignedFreelancerId: jobs.assignedFreelancerId,
        title: jobs.title,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (user.role === 'manager' && job.managerId !== user.id) {
      return NextResponse.json({ error: 'You do not manage this job' }, { status: 403 });
    }

    if (job.status !== ORDER_STATUS.SUBMITTED && job.status !== ORDER_STATUS.EDITING) {
      return NextResponse.json(
        { error: `Job must be in submitted or editing status to request revisions. Current: ${job.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const revisionNotes = `Manager review: ${rejectionReason}${requiredChanges ? '\n' + requiredChanges : ''}`;

    await db.execute(sql`BEGIN TRANSACTION`);
    try {
      await validateAndTransitionStatus({
        orderId: jobId,
        currentStatus: job.status,
        newStatus: ORDER_STATUS.IN_PROGRESS,
        actorId: user.id,
        actorRole: user.role,
        note: `Manager requested revisions: ${rejectionReason}`,
      });

      await db
        .update(jobs)
        .set({
          revisionRequested: true,
          revisionNotes,
          managerApproved: false,
          managerApprovalNotes: rejectionReason,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId));

      await db.execute(sql`COMMIT`);
    } catch (error) {
      await db.execute(sql`ROLLBACK`);
      throw error;
    }

    if (job.assignedFreelancerId) {
      await db.insert(notifications).values({
        userId: job.assignedFreelancerId,
        jobId,
        type: 'manager_rejected',
        title: 'Manager Requested Revisions',
        message: `Manager reviewed your work on "${job.title}" and requested changes. Please review the feedback and resubmit.`,
        read: false,
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Work rejected by manager - returned to freelancer for revision',
      jobId,
      status: ORDER_STATUS.IN_PROGRESS,
      reason: rejectionReason,
      rejectedAt: now,
    });
  } catch (error: any) {
    console.error('Manager rejection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject submission' },
      { status: 500 }
    );
  }
}
