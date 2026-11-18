import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, editorInternalRevisions, notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/v2/editor/orders/[id]/request-revision
 * Editor requests internal revision from freelancer (via admin/manager)
 * This does NOT show as revision to client - internal only
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
    const { reason, issueType, detailedNotes } = body;

    // Validate required fields
    if (!reason || !issueType || !detailedNotes) {
      return NextResponse.json(
        { error: 'Missing required fields: reason, issueType, detailedNotes' },
        { status: 400 }
      );
    }

    // Validate issue type
    const validIssueTypes = [
      'quality',
      'ai_generated',
      'plagiarism',
      'incomplete',
      'formatting',
      'instructions_not_followed',
    ];
    if (!validIssueTypes.includes(issueType)) {
      return NextResponse.json(
        { error: `Invalid issue type. Must be one of: ${validIssueTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify job exists and is in editing status
    const job = await db
      .select({
        id: jobs.id,
        orderNumber: jobs.orderNumber,
        displayId: jobs.displayId,
        editorStatus: jobs.editorStatus,
        assignedFreelancerId: jobs.assignedFreelancerId,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const editorStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review'];
    if (!editorStatuses.includes(job[0].editorStatus || '')) {
      return NextResponse.json(
        { error: 'This order is not in editing status' },
        { status: 403 }
      );
    }

    if (!job[0].assignedFreelancerId) {
      return NextResponse.json(
        { error: 'No freelancer assigned to this order' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create internal revision request
    const revisionRequest = await db
      .insert(editorInternalRevisions)
      .values({
        jobId,
        editorId,
        requestedAt: now,
        reason,
        issueType,
        detailedNotes,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update job status
    await db
      .update(jobs)
      .set({
        editorStatus: 'awaiting_revision',
        editorRequestedRevision: true,
        editorRevisionNotes: detailedNotes,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Create notifications for admin/manager
    await db.insert(notifications).values([
      {
        userId: 1, // Admin notification
        jobId,
        type: 'editor_revision_request',
        title: 'Editor Requested Internal Revision',
        message: `Editor requested revision for order #${job[0].displayId || job[0].orderNumber}: ${issueType.replace(/_/g, ' ')}`,
        read: false,
        relatedId: revisionRequest[0]?.id,
        relatedType: 'editor_internal_revision',
        createdAt: now,
      },
    ]);

    return NextResponse.json({
      success: true,
      revisionRequest: revisionRequest[0],
      message: 'Internal revision request sent to admin/manager',
    });
  } catch (error) {
    console.error('Error requesting internal revision:', error);
    return NextResponse.json(
      { error: 'Failed to request revision' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/editor/orders/[id]/request-revision
 * Get all internal revision requests for an order
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

    const revisionRequests = await db
      .select()
      .from(editorInternalRevisions)
      .where(eq(editorInternalRevisions.jobId, jobId))
      .orderBy(desc(editorInternalRevisions.requestedAt));

    return NextResponse.json({
      success: true,
      revisionRequests,
      pendingRequests: revisionRequests.filter(r => r.status === 'pending'),
      completedRequests: revisionRequests.filter(r => r.status === 'completed'),
    });
  } catch (error) {
    console.error('Error fetching revision requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revision requests' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/editor/orders/[id]/request-revision
 * Update internal revision request status (Admin/Manager only)
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
    const { revisionId, status, freelancerResponse } = body;

    if (isNaN(jobId) || !revisionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: revisionId, status' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'sent_to_freelancer', 'resubmitted', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: any = {
      status,
      updatedAt: now,
    };

    if (status === 'sent_to_freelancer') {
      updateData.approvedBy = authCheck.user.id;
      updateData.approvedAt = now;
      updateData.sentToFreelancerAt = now;
    } else if (status === 'resubmitted') {
      updateData.resubmittedAt = now;
      if (freelancerResponse) {
        updateData.freelancerResponse = freelancerResponse;
      }
    } else if (status === 'completed') {
      updateData.completedAt = now;
    }

    const updated = await db
      .update(editorInternalRevisions)
      .set(updateData)
      .where(and(
        eq(editorInternalRevisions.id, revisionId),
        eq(editorInternalRevisions.jobId, jobId)
      ))
      .returning();

    if (!updated[0]) {
      return NextResponse.json(
        { error: 'Revision request not found' },
        { status: 404 }
      );
    }

    // Update job status if revision is completed
    if (status === 'completed') {
      await db
        .update(jobs)
        .set({
          editorStatus: 'editing_in_progress',
          editorRequestedRevision: false,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId));
    }

    return NextResponse.json({
      success: true,
      revisionRequest: updated[0],
      message: 'Revision request updated',
    });
  } catch (error) {
    console.error('Error updating revision request:', error);
    return NextResponse.json(
      { error: 'Failed to update revision request' },
      { status: 500 }
    );
  }
}
