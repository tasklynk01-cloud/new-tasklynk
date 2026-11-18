import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications, users, managerEarnings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendEmail, getWorkDeliveredEmailHTML } from '@/lib/email';
import { validateStatusTransition, getTransitionError } from '@/lib/job-status-transitions';
import { requireRole } from '@/lib/admin-auth';
import { notifyWorkDelivered } from '@/lib/notifications';

// POST /api/jobs/[id]/deliver - Manager delivers completed work to client
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
    const { managerId } = body;

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required', code: 'MISSING_MANAGER_ID' },
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

    // Verify job is in editing status
    if (job.status !== 'editing') {
      return NextResponse.json(
        {
          error: `Cannot deliver order in status: ${job.status}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // 🔄 FIX #22: Validate status transition
    if (!validateStatusTransition(job.status, 'delivered')) {
      return NextResponse.json(
        { 
          error: getTransitionError(job.status, 'delivered'),
          code: 'INVALID_STATUS_TRANSITION'
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const delivererRole = authCheck.user!.role;
    const delivererId = parseInt(managerId);

    // Calculate manager submission fee: 10 + (5 * (pages-1))
    const pages = job.pages || 0;
    const managerSubmitPay = 10 + (5 * Math.max(pages - 1, 0));

    // Update job to delivered (track who delivered)
    const updatedJob = await db
      .update(jobs)
      .set({
        status: 'delivered',
        deliveredById: delivererId, // Track who delivered
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // ✅ NEW RULE: Only managers who deliver get delivery fee (admins get nothing)
    const shouldCreditDeliveryFee = delivererRole === 'manager';
    
    // Credit manager with submission fee (only if deliverer is a manager)
    if (shouldCreditDeliveryFee) {
      try {
        // Insert earnings record
        await db.insert(managerEarnings).values({
          managerId: delivererId,
          jobId,
          earningType: 'submit',
          amount: managerSubmitPay,
          createdAt: now,
        });

      // Update manager balance
      await db
        .update(users)
        .set({
          balance: sql`COALESCE(${users.balance}, 0) + ${managerSubmitPay}`,
          totalEarned: sql`COALESCE(${users.totalEarned}, 0) + ${managerSubmitPay}`,
        })
        .where(eq(users.id, parseInt(managerId)));

        // Notify manager of earnings
        await db.insert(notifications).values({
          userId: delivererId,
          jobId,
          type: 'manager_submission_fee',
          title: 'Submission Fee Credited',
          message: `You earned KSh ${managerSubmitPay.toFixed(2)} for delivering order ${job.displayId || `#${jobId}`} to the client.`,
          read: false,
          createdAt: now,
        });
      } catch (earningsErr) {
        console.error('Failed to credit manager submission fee:', earningsErr);
      }
    } else {
      console.log(`[Delivery] Admin delivered order ${jobId} - no manager fee credited (admin cannot earn manager fees)`);
    }

    // 🔒 FIX #26: Use jobStatusLogs instead of orderHistory
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'editing',
        newStatus: 'delivered',
        changedBy: parseInt(managerId),
        note: `Delivered to client. Manager earned KSh ${managerSubmitPay.toFixed(2)}`,
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log delivery:', logErr);
    }

    // Notify client using enhanced notification
    try {
      const client = await db.select().from(users).where(eq(users.id, job.clientId)).limit(1);
      const orderNumber = (job as any).orderNumber || job.displayId || `#${jobId}`;
      
      if (client.length > 0) {
        // Use enhanced notification that guides client to review
        await notifyWorkDelivered(job.clientId, jobId, orderNumber);

        // Send email notification
        if (job.assignedFreelancerId) {
          const freelancer = await db.select().from(users).where(eq(users.id, job.assignedFreelancerId)).limit(1);
          
          if (freelancer.length > 0) {
            await sendEmail({
              to: client[0].email,
              subject: `[Order ${orderNumber}] Work Delivered`,
              html: getWorkDeliveredEmailHTML(
                client[0].name,
                job.title,
                jobId,
                orderNumber,
                freelancer[0].name
              ),
            });
          }
        }
      }
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // Notify freelancer
    try {
      const orderNumber = (job as any).orderNumber || job.displayId || `#${jobId}`;
      if (job.assignedFreelancerId) {
        await db.insert(notifications).values({
          userId: job.assignedFreelancerId,
          jobId,
          type: 'order_delivered',
          title: 'Order Delivered to Client',
          message: `Work for order ${orderNumber} delivered to client. Awaiting approval.`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify freelancer:', notifErr);
    }

    return NextResponse.json(
      {
        job: updatedJob[0],
        managerEarnings: managerSubmitPay,
        message: `Order delivered successfully. Manager earned KSh ${managerSubmitPay.toFixed(2)}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Deliver error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}