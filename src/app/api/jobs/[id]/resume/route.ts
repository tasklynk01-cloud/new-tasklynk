import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/jobs/[id]/resume
 * 
 * Admin/Manager resumes an order from on_hold status
 * 
 * Flow:
 * - Validates order is currently on_hold
 * - Retrieves previous status from job_status_logs
 * - Updates order status to previous status
 * - Logs status change
 * - Notifies all involved parties
 * 
 * Auth: Requires admin or manager role
 * 
 * Body: {
 *   managerId?: number,
 *   adminId?: number,
 *   reason?: string
 * }
 * 
 * Response: {
 *   job: { ... updated order object },
 *   message: "Order resumed successfully"
 * }
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Require admin or manager role
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }

    const params = await props.params;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);
    const body = await request.json();
    const { managerId, adminId, reason } = body;

    const changedBy = managerId || adminId;
    if (!changedBy) {
      return NextResponse.json(
        { error: 'Manager ID or Admin ID required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Check if job exists
    const existingJob = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (existingJob.length === 0) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      );
    }

    const job = existingJob[0];

    // Validate order is on hold
    if (job.status !== 'on_hold') {
      return NextResponse.json(
        { error: `Order is not on hold. Current status: ${job.status}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Get previous status from job_status_logs
    // Find the most recent log entry where newStatus = 'on_hold' to get oldStatus
    const statusLog = await db
      .select()
      .from(jobStatusLogs)
      .where(
        and(
          eq(jobStatusLogs.jobId, jobId),
          eq(jobStatusLogs.newStatus, 'on_hold')
        )
      )
      .orderBy(desc(jobStatusLogs.createdAt))
      .limit(1);

    let previousStatus: string;

    if (statusLog.length > 0 && statusLog[0].oldStatus) {
      previousStatus = statusLog[0].oldStatus;
    } else {
      // Fallback: if no log found, default to 'accepted' as safe default
      // This shouldn't happen in normal flow, but provides safety
      previousStatus = 'accepted';
      console.warn(`No status log found for job ${jobId} when resuming from hold. Using default: accepted`);
    }

    // Validate previous status is valid
    const validStatuses = [
      'pending', 'accepted', 'in_progress', 'editing',
      'delivered', 'approved', 'revision', 'client_revision'
    ];

    if (!validStatuses.includes(previousStatus)) {
      return NextResponse.json(
        { error: `Cannot resume to invalid status: ${previousStatus}`, code: 'INVALID_PREVIOUS_STATUS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update job to previous status
    const updatedJob = await db
      .update(jobs)
      .set({
        status: previousStatus,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Log status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'on_hold',
        newStatus: previousStatus,
        changedBy: parseInt(changedBy),
        note: reason ? `Order resumed from hold: ${reason}` : `Order resumed from hold to ${previousStatus}`,
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log resume:', logErr);
    }

    // Notify all involved parties
    const userIdsToNotify: number[] = [job.clientId];
    if (job.assignedFreelancerId) {
      userIdsToNotify.push(job.assignedFreelancerId);
    }
    if (job.managerId) {
      userIdsToNotify.push(job.managerId);
    }

    try {
      for (const userId of userIdsToNotify) {
        await db.insert(notifications).values({
          userId,
          jobId,
          type: 'order_resumed',
          title: 'Order Resumed',
          message: `Order ${job.displayId || `#${jobId}`} has been resumed and is now ${previousStatus}. ${reason || ''}`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to create notifications:', notifErr);
    }

    return NextResponse.json(
      {
        job: updatedJob[0],
        message: `Order resumed successfully to ${previousStatus}`,
        previousStatus: 'on_hold',
        newStatus: previousStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resume error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

