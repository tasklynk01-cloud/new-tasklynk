import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerOrderResponses, jobs, users, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { sendEmailToAdmins } from '@/lib/email';
import { validateAndTransitionStatus, ORDER_STATUS } from '@/lib/order-flow-helpers';

function isMissingLogTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const message = (error as any)?.message;
  if (!message || typeof message !== 'string') return false;
  const normalized = message.toLowerCase();
  if (!normalized.includes('no such table')) return false;
  return normalized.includes('order_history') || normalized.includes('audit_logs');
}

function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== 'object') return false;
  const message = (error as any)?.message;
  if (!message || typeof message !== 'string') return false;
  const normalized = message.toLowerCase();
  return normalized.includes('no such table') && normalized.includes(tableName.toLowerCase());
}

function isMissingColumnError(error: unknown, columnName?: string) {
  if (!error || typeof error !== 'object') return false;
  const message = (error as any)?.message;
  if (!message || typeof message !== 'string') return false;
  const normalized = message.toLowerCase();
  // SQLite error for missing column: "no such column: column_name"
  // Also check for general column-related errors in the query
  const isMissingColumn = normalized.includes('no such column') || 
    (normalized.includes('failed query') && normalized.includes('freelancer_rejection_reason'));
  if (columnName) {
    return isMissingColumn && normalized.includes(columnName.toLowerCase());
  }
  return isMissingColumn;
}

async function tryValidateAndTransitionStatus(params: Parameters<typeof validateAndTransitionStatus>[0]) {
  try {
    await validateAndTransitionStatus(params);
  } catch (error) {
    if (isMissingLogTableError(error)) {
      console.warn('[Assignments Respond] Status transition audit tables missing; skipping history insert');
      return;
    }
    throw error;
  }
}

/**
 * POST /api/v2/assignments/[id]/respond
 * Freelancer accepts or rejects an assignment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate as freelancer
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const freelancer = authCheck.user;
    const resolvedParams = await params;
    const jobId = parseInt(resolvedParams.id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const body = await request.json();
    const { response, rejectionReason } = body;

    // Validate response
    if (!response || !['accepted', 'rejected'].includes(response)) {
      return NextResponse.json(
        { error: 'Response must be "accepted" or "rejected"' },
        { status: 400 }
      );
    }

    if (response === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Check if job exists and is assigned to this freelancer
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.assignedFreelancerId !== freelancer.id) {
      return NextResponse.json(
        { error: 'This job is not assigned to you' },
        { status: 403 }
      );
    }

    // ✅ Updated: Orders now go directly to in_progress when freelancer is assigned
    const allowedStatuses = ['in_progress'];
    if (!allowedStatuses.includes(job.status)) {
      return NextResponse.json(
        { 
          error: 'Job cannot be responded to in current status',
          details: `Job status is "${job.status}", expected "in_progress"`,
        },
        { status: 400 }
      );
    }

    // Check if already accepted or rejected
    if (job.freelancerAccepted) {
      return NextResponse.json(
        { error: 'This assignment has already been accepted' },
        { status: 400 }
      );
    }

    if (job.freelancerRejected) {
      return NextResponse.json(
        { error: 'This assignment has already been rejected' },
        { status: 400 }
      );
    }

    // Note: We allow response if status is 'in_progress', even if freelancerResponsePending flag is false
    // This handles legacy orders or cases where the flag wasn't set properly

    // Check if response already exists
    let responseTableAvailable = true;
    let existingResponse: Array<typeof freelancerOrderResponses.$inferSelect> = [];
    try {
      existingResponse = await db
        .select()
        .from(freelancerOrderResponses)
        .where(
          and(
            eq(freelancerOrderResponses.freelancerId, freelancer.id),
            eq(freelancerOrderResponses.jobId, jobId)
          )
        );
    } catch (tableError: unknown) {
      if (isMissingTableError(tableError, 'freelancer_order_responses')) {
        responseTableAvailable = false;
        console.warn('[Assignments Respond] freelancer_order_responses table missing; continuing without response history tracking');
      } else {
        throw tableError;
      }
    }

    if (responseTableAvailable && existingResponse.length > 0) {
      return NextResponse.json(
        { error: 'You have already responded to this assignment' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const assignedAt = job.assignedAt ? new Date(job.assignedAt) : new Date();
    const responseTimeMinutes = Math.max(0, Math.floor((Date.now() - assignedAt.getTime()) / 60000)); // Convert to minutes

    const adminUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.role, 'admin'));

    // Record the response
    if (responseTableAvailable) {
      try {
        await db.insert(freelancerOrderResponses).values({
          freelancerId: freelancer.id,
          jobId: jobId,
          responseStatus: response,
          responseAt: now,
          rejectionReason: response === 'rejected' ? rejectionReason : null,
          responseTimeMinutes: responseTimeMinutes,
          createdAt: now,
          updatedAt: now,
        });
      } catch (insertError: unknown) {
        if (isMissingTableError(insertError, 'freelancer_order_responses')) {
          responseTableAvailable = false;
          console.warn('[Assignments Respond] Unable to record response statistics (table missing). Skipping metrics insert.');
        } else {
          throw insertError;
        }
      }
    }

    if (response === 'accepted') {
      // Update order status to in_progress with acceptance flags
      try {
        // Note: freelancerRejectionReason column may not exist in older DB schemas
        // We only set fields that are guaranteed to exist
        const updateData: any = {
          status: ORDER_STATUS.IN_PROGRESS as string,
          freelancerAccepted: 1, // Use 1 for SQLite boolean true
          freelancerAcceptedAt: now,
          freelancerRejected: 0, // Use 0 for SQLite boolean false
          freelancerRejectedAt: null,
          freelancerResponsePending: 0, // Use 0 for SQLite boolean false
          updatedAt: now,
        };
        
        console.log('[Assignment Accept] Attempting to update job with data:', updateData);
        
        await db
          .update(jobs)
          .set(updateData)
          .where(eq(jobs.id, jobId));
        
        console.log('[Assignment Accept] Successfully updated job status to in_progress');
      } catch (updateError) {
        console.error('[Assignment Accept] Database update failed:', updateError);
        throw new Error(`Failed to update job status: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
      }

      // Try to log status transition (non-blocking)
      try {
        await tryValidateAndTransitionStatus({
          orderId: jobId,
          currentStatus: job.status,
          newStatus: ORDER_STATUS.IN_PROGRESS,
          actorId: freelancer.id,
          actorRole: freelancer.role,
          note: 'Freelancer accepted assignment',
        });
      } catch (logError) {
        console.warn('[Assignment Accept] Failed to log transition:', logError);
      }

      const notificationTargets = new Set<number>();
      if (job.managerId) notificationTargets.add(job.managerId);
      if (job.clientId) notificationTargets.add(job.clientId);
      adminUsers.forEach(admin => notificationTargets.add(admin.id));

      const notificationsPayload = Array.from(notificationTargets).map(userId => ({
        userId,
        jobId,
        type: 'assignment_accepted',
        title: 'Assignment Accepted',
        message: `${freelancer.name} has accepted order ${job.displayId}`,
        read: false,
        createdAt: now,
      }));

      if (notificationsPayload.length > 0) {
        try {
          await db.insert(notifications).values(notificationsPayload);
        } catch (notificationError: unknown) {
          if (isMissingTableError(notificationError, 'notifications')) {
            console.warn('[Assignments Respond] notifications table missing; skipping notification inserts');
          } else {
            throw notificationError;
          }
        }
      }

      try {
        await sendEmailToAdmins({
          subject: `Assignment Accepted - ${job.displayId}`,
          html: getAssignmentAcceptedEmail(job, freelancer),
        });
      } catch (error) {
        console.error('Failed to send acceptance email:', error);
      }

      // Return success response immediately - database update already completed
      return NextResponse.json({
        success: true,
        message: 'Assignment accepted successfully. Order status updated to In Progress.',
        job: {
          id: jobId,
          displayId: job.displayId,
          status: ORDER_STATUS.IN_PROGRESS,
          freelancerAccepted: true,
        },
      });
    } else {
      // Update order status back to accepted and clear freelancer assignment
      // First try with freelancerRejectionReason, fall back to without if column doesn't exist
      const baseUpdateData: any = {
        status: ORDER_STATUS.ACCEPTED as string,
        assignedFreelancerId: null,
        freelancerAccepted: 0, // Use 0 for SQLite boolean false
        freelancerAcceptedAt: null,
        freelancerRejected: 1, // Use 1 for SQLite boolean true
        freelancerRejectedAt: now,
        freelancerResponsePending: 0, // Use 0 for SQLite boolean false
        assignedAt: null,
        updatedAt: now,
      };
      
      try {
        // Try to update with rejection reason first
        const updateDataWithReason = {
          ...baseUpdateData,
          freelancerRejectionReason: rejectionReason,
        };
        
        console.log('[Assignment Reject] Attempting to update job with data (including reason):', updateDataWithReason);
        
        await db
          .update(jobs)
          .set(updateDataWithReason)
          .where(eq(jobs.id, jobId));
        
        console.log('[Assignment Reject] Successfully updated job status to accepted and cleared assignment');
      } catch (updateError) {
        // Check if it's a missing column error for freelancer_rejection_reason
        if (isMissingColumnError(updateError, 'freelancer_rejection_reason')) {
          console.warn('[Assignment Reject] freelancer_rejection_reason column missing, retrying without it');
          try {
            // Retry without the rejection reason column
            await db
              .update(jobs)
              .set(baseUpdateData)
              .where(eq(jobs.id, jobId));
            
            console.log('[Assignment Reject] Successfully updated job status (without rejection reason column)');
            // Note: The rejection reason is still stored in freelancer_order_responses table
          } catch (retryError) {
            console.error('[Assignment Reject] Retry without rejection reason also failed:', retryError);
            throw new Error(`Failed to update job status: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
          }
        } else {
          console.error('[Assignment Reject] Database update failed:', updateError);
          throw new Error(`Failed to update job status: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
        }
      }

      // Try to log status transition (non-blocking)
      try {
        await tryValidateAndTransitionStatus({
          orderId: jobId,
          currentStatus: job.status,
          newStatus: ORDER_STATUS.ACCEPTED,
          actorId: freelancer.id,
          actorRole: freelancer.role,
          note: `Freelancer rejected assignment: ${rejectionReason}`,
        });
      } catch (logError) {
        console.warn('[Assignment Reject] Failed to log transition:', logError);
      }

      const notificationTargets = new Set<number>();
      if (job.managerId) notificationTargets.add(job.managerId);
      if (job.clientId) notificationTargets.add(job.clientId);
      adminUsers.forEach(admin => notificationTargets.add(admin.id));

      const notificationsPayload = Array.from(notificationTargets).map(userId => ({
        userId,
        jobId,
        type: 'assignment_rejected',
        title: 'Assignment Rejected',
        message: `${freelancer.name} has rejected order ${job.displayId}. Reason: ${rejectionReason}`,
        read: false,
        createdAt: now,
      }));

      if (notificationsPayload.length > 0) {
        try {
          await db.insert(notifications).values(notificationsPayload);
        } catch (notificationError: unknown) {
          if (isMissingTableError(notificationError, 'notifications')) {
            console.warn('[Assignments Respond] notifications table missing; skipping notification inserts');
          } else {
            throw notificationError;
          }
        }
      }

      try {
        await sendEmailToAdmins({
          subject: `Assignment Rejected - ${job.displayId}`,
          html: getAssignmentRejectedEmail(job, freelancer, rejectionReason),
        });
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }

      // Return success response immediately - database update already completed
      return NextResponse.json({
        success: true,
        message: 'Assignment rejected successfully. Manager has been notified.',
        job: {
          id: jobId,
          displayId: job.displayId,
          status: ORDER_STATUS.ACCEPTED,
          freelancerRejected: true,
        },
      });
    }
  } catch (error) {
    console.error('Assignment response error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      body: error instanceof Error ? (error as any).body : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to process assignment response',
        details: error instanceof Error ? error.message : String(error),
        // Include more details in development
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

function getAssignmentAcceptedEmail(job: any, freelancer: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Assignment Accepted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">✅ Assignment Accepted</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1D3557;">Order ${job.displayId}</h2>
            <p><strong>${freelancer.name}</strong> has accepted the assignment.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Order ID:</strong> ${job.displayId}</p>
              <p><strong>Freelancer:</strong> ${freelancer.name} (${freelancer.email})</p>
              <p><strong>Status:</strong> In Progress</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/admin/jobs/${job.id}" 
               style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
              View Order
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getAssignmentRejectedEmail(job: any, freelancer: any, reason: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Assignment Rejected</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">❌ Assignment Rejected</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc2626;">Order ${job.displayId}</h2>
            <p><strong>${freelancer.name}</strong> has rejected the assignment.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Order ID:</strong> ${job.displayId}</p>
              <p><strong>Freelancer:</strong> ${freelancer.name} (${freelancer.email})</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Status:</strong> Available for reassignment</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/admin/jobs/${job.id}" 
               style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
              Reassign Order
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}
