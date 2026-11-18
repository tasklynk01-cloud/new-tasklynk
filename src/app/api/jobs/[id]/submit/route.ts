import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, notifications, users, jobStatusLogs, jobAttachments, orderFiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from '@/lib/admin-auth';
import { notifyWorkSubmitted } from '@/lib/notifications';

// Writer submits final work once.
// Prevent multiple final submissions by blocking if job is already in editing/delivered/completed/paid.
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Require freelancer, admin, or manager role
    const authCheck = await requireRole(request, ['freelancer', 'admin', 'manager']);
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
        { error: "Valid job ID is required", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);

    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Job not found", code: "JOB_NOT_FOUND" },
        { status: 404 }
      );
    }

    const job = rows[0] as any;

    // Require job to be in_progress and have an assigned freelancer
    if (String(job.status) !== "in_progress" || !job.assignedFreelancerId) {
      return NextResponse.json(
        { error: "Order is not in a valid state for submission (must be in progress with assigned freelancer)", code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    // Enforce at least one FINAL file uploaded by the assigned freelancer
    // Check orderFiles table which is used by the v2 endpoints
    // Accept multiple final document classifications
    const finalDocTypes = [
      'final_document', 'completed_paper', 'completed_smart_paper', 
      'final_paper', 'final', 'final_work', 'final_submission'
    ];
    
    const finalFiles = await db
      .select({ id: orderFiles.id, fileType: orderFiles.fileType, fileClassification: orderFiles.fileClassification })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, jobId));

    const hasFinalDoc = finalFiles.some(f => 
      finalDocTypes.includes(f.fileType || '') || 
      finalDocTypes.includes(f.fileClassification || '')
    );

    console.log('[Submit API] File check:', {
      jobId,
      totalFiles: finalFiles.length,
      hasFinalDoc,
      fileTypes: finalFiles.map(f => ({ type: f.fileType, class: f.fileClassification }))
    });

    if (!hasFinalDoc && finalFiles.length === 0) {
      return NextResponse.json(
        {
          error: "You must upload at least one FINAL file before submitting",
          code: "NO_FINAL_FILES",
        },
        { status: 400 }
      );
    }
    
    // If files exist but none are marked as final, still allow submission
    // The QA/editor will review
    if (!hasFinalDoc && finalFiles.length > 0) {
      console.log('[Submit API] Files exist but no final doc classification - allowing submission for QA review');
    }

    // Block duplicate final submissions based on status
    const terminalOrSubmittedStatuses = ["editing", "delivered", "completed", "paid"];
    if (terminalOrSubmittedStatuses.includes(String(job.status))) {
      return NextResponse.json(
        {
          error: "Order has already been submitted/reviewed. Multiple final submissions are not allowed.",
          code: "ALREADY_SUBMITTED",
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const updated = await db
      .update(jobs)
      .set({
        status: "editing", // move to editing/QA stage after writer submission
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // AUDIT LOG: submission -> moved to editing
    try {
      await db.insert(jobStatusLogs).values({
        jobId: jobId,
        oldStatus: job.status as string,
        newStatus: "editing",
        changedBy: null,
        note: "Writer submitted work; moved to editing",
        createdAt: now,
      });
    } catch (logErr) {
      console.error("Failed to log writer submission:", logErr);
    }

    // Create in-platform notifications for Admins, Managers, Editors, and Client
    try {
      const updatedJob = updated[0] as any;
      const orderNumber = updatedJob.orderNumber || updatedJob.displayId || `#${updatedJob.id}`;
      
      // Get freelancer name
      const freelancerRows = await db.select({ name: users.name }).from(users).where(eq(users.id, job.assignedFreelancerId)).limit(1);
      const freelancerName = freelancerRows.length > 0 ? freelancerRows[0].name : 'Writer';

      // Notify all admins using enhanced notification
      const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
      for (const admin of adminUsers) {
        await notifyWorkSubmitted(admin.id, updatedJob.id, orderNumber, freelancerName);
      }
      
      // Notify all managers using enhanced notification
      const managerUsers = await db.select().from(users).where(eq(users.role, 'manager'));
      for (const manager of managerUsers) {
        await notifyWorkSubmitted(manager.id, updatedJob.id, orderNumber, freelancerName);
      }
      
      // Notify all editors using enhanced notification
      const editorUsers = await db.select().from(users).where(eq(users.role, 'editor'));
      for (const editor of editorUsers) {
        await notifyWorkSubmitted(editor.id, updatedJob.id, orderNumber, freelancerName);
      }

      // Notify client about submission
      if (updatedJob.clientId) {
        await db.insert(notifications).values({
          userId: updatedJob.clientId,
          jobId: updatedJob.id,
          type: 'order_submitted',
          title: 'Order Under Review',
          message: `Order ${orderNumber} has been submitted and is under quality review.`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to create submission notifications:', notifErr);
    }

    return NextResponse.json(
      {
        job: updated[0],
        message: "Submission received. Order moved to editing for QA/manager review.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}