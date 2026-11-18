import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, bids, notifications, jobStatusLogs } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { sendOrderEmail, getJobAssignedEmailHTML } from '@/lib/email';
import { logAdminAction, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';
import { requireRole } from '@/lib/admin-auth';
import { notifyOrderAssigned } from '@/lib/notifications';

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

    // Validate ID parameter
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
    const { freelancerId, changedBy } = body;

    // Validate freelancerId is provided
    if (freelancerId === undefined || freelancerId === null) {
      return NextResponse.json(
        {
          error: 'Freelancer ID is required',
          code: 'MISSING_FREELANCER_ID'
        },
        { status: 400 }
      );
    }

    // Validate freelancerId is a valid integer
    if (typeof freelancerId !== 'number' || isNaN(freelancerId) || !Number.isInteger(freelancerId)) {
      return NextResponse.json(
        {
          error: 'Valid freelancer ID is required',
          code: 'INVALID_FREELANCER_ID'
        },
        { status: 400 }
      );
    }

    // Check if job exists
    const existingJob = await db.select()
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

    // Get freelancer details
    const freelancer = await db.select()
      .from(users)
      .where(eq(users.id, freelancerId))
      .limit(1);

    if (freelancer.length === 0) {
      return NextResponse.json(
        {
          error: 'Freelancer not found',
          code: 'FREELANCER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // CRITICAL: Accept the bid from the assigned freelancer
    await db.update(bids)
      .set({ status: 'accepted' })
      .where(and(
        eq(bids.jobId, jobId),
        eq(bids.freelancerId, freelancerId)
      ));

    // CRITICAL: Reject all other bids for this job
    await db.update(bids)
      .set({ status: 'rejected' })
      .where(and(
        eq(bids.jobId, jobId),
        ne(bids.freelancerId, freelancerId)
      ));

    // Update job with assigned freelancer, status to in_progress (auto-start work), and timestamp
    const updatedJob = await db.update(jobs)
      .set({
        assignedFreelancerId: freelancerId,
        status: 'in_progress',
        freelancerAccepted: true,
        freelancerResponsePending: false,
        assignedAt: new Date().toISOString(),
        freelancerAcceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
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

    // AUDIT LOG: assignment status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: (existingJob[0] as any).status as string,
        newStatus: 'in_progress',
        changedBy: changedBy || null,
        note: 'Manager assigned writer - work in progress',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to log assignment:', e);
    }

    // 📝 AUDIT: Log job assignment
    if (changedBy) {
      try {
        await logAdminAction(
          changedBy,
          AdminActions.ASSIGN_JOB,
          jobId,
          AuditTargetTypes.JOB,
          {
            jobId,
            orderNumber: (existingJob[0] as any).orderNumber,
            freelancerId,
            freelancerName: freelancer[0].name,
            freelancerEmail: freelancer[0].email,
            previousStatus: (existingJob[0] as any).status,
            newStatus: 'in_progress',
          }
        );
      } catch (auditError) {
        console.error('Failed to log assignment audit:', auditError);
      }
    }

    // CREDIT MANAGER: assignment fee KSh 10 (flat per order)
    try {
      let managerIdToCredit: number | null = null;
      // Prefer freelancer's manager
      managerIdToCredit = (freelancer[0] as any)?.assignedManagerId ?? null;
      if (!managerIdToCredit) {
        // Fallback to client's manager
        const clientId = (existingJob[0] as any).clientId as number | undefined;
        if (clientId) {
          const clientRow = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
          managerIdToCredit = clientRow[0]?.assignedManagerId ?? null;
        }
      }
      if (!managerIdToCredit && changedBy && Number.isInteger(changedBy)) {
        // If provided in payload, use the manager performing assignment
        managerIdToCredit = changedBy;
      }
      if (managerIdToCredit) {
        await db.update(users)
          .set({
            balance: sql`COALESCE(${users.balance}, 0) + ${10}`,
            totalEarned: sql`COALESCE(${users.totalEarned}, 0) + ${10}`,
          })
          .where(eq(users.id, managerIdToCredit));
        // Notify manager about assignment fee
        await db.insert(notifications).values({
          userId: managerIdToCredit,
          jobId: updatedJob[0].id as number,
          type: 'manager_assignment_fee',
          title: 'Assignment Fee Credited',
          message: `You earned KSh 10 assignment fee for order ${(updatedJob[0] as any).displayId || `#${updatedJob[0].id}`}.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (creditErr) {
      console.error('Failed to credit manager assignment fee:', creditErr);
    }

    // Send email notification to freelancer - Uses support@tasklynk.co.ke with order number as subject
    const job = updatedJob[0];
    const orderId = job.displayId || `#${job.id}`;
    try {
      const emailResult = await sendOrderEmail({
        to: freelancer[0].email,
        orderId: orderId,
        orderAction: `Assigned to ${freelancer[0].name}`,
        html: getJobAssignedEmailHTML(
          freelancer[0].name,
          orderId,
          job.title,
          new Date(job.deadline).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        ),
      });
      
      if (emailResult.success) {
        console.log('✅ [Assign] Assignment email sent successfully:', {
          email: freelancer[0].email,
          from: 'support@tasklynk.co.ke',
          jobId: job.id,
          freelancerName: freelancer[0].name,
          messageId: emailResult.messageId
        });
      } else {
        console.error('❌ [Assign] Assignment email sending failed:', {
          email: freelancer[0].email,
          jobId: job.id,
          error: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('❌ [Assign] Email exception:', {
        email: freelancer[0].email,
        jobId: job.id,
        error: emailError,
        message: emailError instanceof Error ? emailError.message : 'Unknown'
      });
    }

    // In-platform notifications: freelancer + client using enhanced notification
    try {
      const orderNumber = (job as any).orderNumber || job.displayId || `#${job.id}`;
      
      // Notify assigned freelancer with instructions to read order details
      await notifyOrderAssigned(freelancerId, job.id, orderNumber);

      // Notify client about assignment
      await db.insert(notifications).values({
        userId: job.clientId as number,
        jobId: job.id,
        type: 'order_assigned',
        title: 'Assigned to Writer',
        message: `Order ${orderNumber} has been assigned and work is now in progress.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.error('Failed to create assignment notifications:', notifErr);
    }

    return NextResponse.json(job, { 
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