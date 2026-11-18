import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, notifications, jobAttachments, jobStatusLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, getWorkDeliveredEmailHTML } from '@/lib/email';
import { notifyStatusChange } from '../notify-status-change/route';
import { VALID_STATUS_TRANSITIONS, type OrderStatus } from '@/db/schema-order-flow-updates';
import { requireRole } from '@/lib/admin-auth';
import { handleOptions } from '@/lib/api-helpers';

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

// Status set + transition rules are derived from the single canonical source
// in src/db/schema-order-flow-updates.ts so this route can't drift out of sync
// with the v2 order-lifecycle rules (previously this was an independent,
// narrower copy that lacked 'submitted'/'internal_revision'/'client_revision').
const VALID_STATUSES = Object.keys(VALID_STATUS_TRANSITIONS) as OrderStatus[];

const ALLOWED_TRANSITIONS: Record<string, string[]> = VALID_STATUS_TRANSITIONS;

export async function PATCH(
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
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid job ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { status, revisionRequested, revisionNotes, clientApproved, changedBy, note } = body;

    // Validate status field
    if (!status) {
      return NextResponse.json(
        {
          error: 'Status field is required',
          code: 'MISSING_STATUS'
        },
        { status: 400 }
      );
    }

    // Validate status is one of valid statuses
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        },
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
        {
          error: 'Job not found',
          code: 'JOB_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const job = existingJob[0];
    const oldStatus = job.status as string;

    // Validate status transition
    if (oldStatus !== status) {
      const allowedTransitions = ALLOWED_TRANSITIONS[oldStatus] || [];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from '${oldStatus}' to '${status}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
            code: 'INVALID_TRANSITION'
          },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    // Add optional fields if provided
    if (typeof revisionRequested === 'boolean') {
      updateData.revisionRequested = revisionRequested;
    }

    if (revisionNotes !== undefined) {
      updateData.revisionNotes = revisionNotes || null;
    }

    if (typeof clientApproved === 'boolean') {
      updateData.clientApproved = clientApproved;
    }

    // Side effects for specific statuses
    // REVISED: 'accepted' = admin/manager accepted order (ready for assignment)
    //          'approved' = client approved delivered work
    if (status === 'accepted' && oldStatus !== 'accepted') {
      // Admin/Manager accepted order - ready for writer assignment
      updateData.adminApproved = true;
    }

    if (status === 'approved' && oldStatus !== 'approved') {
      // Client approved delivered work
      if (updateData.clientApproved === undefined) updateData.clientApproved = true;
      updateData.approvedByClientAt = new Date().toISOString();
    }

    // IMPORTANT: Do NOT credit balances here to avoid double-crediting.
    // Payment credits happen in payments/[id]/confirm route.
    if (status === 'paid' && oldStatus !== 'paid') {
      updateData.paymentConfirmed = true;
      updateData.paidOrderConfirmedAt = new Date().toISOString();
    }

    // Update job
    const updatedJob = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, jobId))
      .returning();

    if (updatedJob.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to update job',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    // AUDIT LOG: Record status change in job_status_logs
    if (oldStatus !== status) {
      try {
        await db.insert(jobStatusLogs).values({
          jobId: jobId,
          oldStatus: oldStatus,
          newStatus: status,
          changedBy: changedBy || null,
          note: note || null,
          createdAt: new Date().toISOString()
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError);
        // Don't fail the status update if audit logging fails
      }
    }

    // NOTE: Manager submission-fee crediting intentionally removed from this route.
    // It duplicated the credit already made through the v2 order-lifecycle flow
    // (freelancerSubmitWork / processOrderApproval in order-lifecycle-api.ts and
    // order-flow-helpers.ts), which is the authoritative place manager earnings
    // are credited. Crediting it here too caused managers to be paid twice for
    // the same delivery whenever both this legacy route and the v2 flow acted on
    // the same order.

    // SCHEDULE FILE DELETION: When order is completed, schedule all files for deletion after 1 week
    if (status === 'completed' && oldStatus !== 'completed') {
      try {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        
        await db
          .update(jobAttachments)
          .set({
            scheduledDeletionAt: oneWeekFromNow.toISOString()
          })
          .where(eq(jobAttachments.jobId, jobId));

      } catch (deletionError) {
        console.error('Failed to schedule file deletion:', deletionError);
        // Don't fail the status update if scheduling fails
      }
    }

    // NOTIFICATION SYSTEM: Notify all users about status change
    if (oldStatus !== status) {
      const usersToNotify: number[] = [];
      
      // Add client (always notified)
      usersToNotify.push(job.clientId as number);
      
      // Add assigned freelancer if exists
      if (job.assignedFreelancerId) {
        usersToNotify.push(job.assignedFreelancerId as number);
      }
      
      // Add all admins
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        ;
      
      admins.forEach(admin => {
        if (!usersToNotify.includes(admin.id)) {
          usersToNotify.push(admin.id);
        }
      });

      // Create status change message - REVISED for new flow
      let statusMessage = '';
      if (status === 'delivered') {
        statusMessage = 'Work has been delivered and is ready for review';
      } else if (status === 'accepted') {
        statusMessage = 'Admin/Manager accepted the order - now ready for writer assignment';
      } else if (status === 'approved') {
        statusMessage = 'Client approved the delivered work';
      } else if (status === 'paid') {
        statusMessage = 'Payment has been confirmed for this order';
      } else if (status === 'completed') {
        statusMessage = 'Order has been completed successfully';
      } else if (status === 'revision') {
        statusMessage = 'Revision has been requested';
      } else if (status === 'cancelled') {
        statusMessage = 'Order has been cancelled';
      } else if (status === 'in_progress') {
        statusMessage = 'Work is now in progress';
      } else if (status === 'on_hold') {
        statusMessage = 'Order has been put on hold';
      } else {
        statusMessage = `Status changed from ${oldStatus} to ${status}`;
      }

      // Create notifications for all users
      for (const userId of usersToNotify) {
        try {
          await db.insert(notifications).values({
            userId,
            jobId: job.id as number,
            type: 'order_updated',
            title: `Order ${job.displayId} Status Updated`,
            message: `Order "${job.title}": ${statusMessage}`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch (notifError) {
          console.error(`Failed to create notification for user ${userId}:`, notifError);
        }
      }

      // Send comprehensive multi-channel notifications (Email, WhatsApp, Telegram)
      try {
        await notifyStatusChange(jobId, oldStatus, status);
      } catch (multiChannelError) {
        console.error('Failed to send multi-channel notifications:', multiChannelError);
        // Don't fail the status update if multi-channel notifications fail
      }
    }

    // Send email notification when work is delivered
    if (status === 'delivered' && job.status !== 'delivered') {
      try {
        // Get client details
        const client = await db.select()
          .from(users)
          .where(eq(users.id, job.clientId as number))
          .limit(1);

        if (client.length > 0 && job.assignedFreelancerId) {
          // Get freelancer details
          const freelancer = await db.select()
            .from(users)
            .where(eq(users.id, job.assignedFreelancerId as number))
            .limit(1);

          if (freelancer.length > 0) {
            await sendEmail({
              to: client[0].email,
              subject: `[Order ${job.displayId || `#${job.id}`}] Work Delivered`,
              html: getWorkDeliveredEmailHTML(
                client[0].name,
                job.title as string,
                job.id as number,
                job.displayId || `#${job.id}`,
                freelancer[0].name
              ),
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    return NextResponse.json(updatedJob[0], { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}