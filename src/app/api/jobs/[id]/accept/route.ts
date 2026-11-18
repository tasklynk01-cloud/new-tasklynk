import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// POST /api/jobs/[id]/accept - Manager/Admin accepts pending order
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
    const { managerId, adminId } = body;

    // Require either managerId or adminId
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

    // Verify job is in pending status
    if (job.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Cannot accept order in status: ${job.status}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 🔴 FIX: Distinguish between admin and manager acceptance
    // - Admin accepts: managerId = null (visible to all freelancers)
    // - Manager accepts: managerId = managerId (only visible to freelancers assigned to that manager)
    const isAdmin = !!adminId && !managerId;
    const updateData: any = {
      status: 'accepted',
      updatedAt: now,
    };
    
    if (isAdmin) {
      // Admin acceptance: set managerId to null so it's visible to all freelancers
      updateData.managerId = null;
    } else if (managerId) {
      // Manager acceptance: set managerId to the accepting manager
      updateData.managerId = parseInt(managerId);
    }

    // Update job to accepted
    const updatedJob = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, jobId))
      .returning();

    // Log status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'pending',
        newStatus: 'accepted',
        changedBy: parseInt(changedBy),
        note: isAdmin ? 'Order accepted by admin (visible to all freelancers)' : 'Order accepted by manager',
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log acceptance:', logErr);
    }

    // Notify client
    try {
      await db.insert(notifications).values({
        userId: job.clientId,
        jobId,
        type: 'order_accepted',
        title: 'Order Accepted',
        message: `Your order ${job.displayId || `#${jobId}`} has been accepted and is being processed.`,
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    return NextResponse.json(
      {
        job: updatedJob[0],
        message: 'Order accepted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Accept error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
