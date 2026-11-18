import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, jobAttachments, jobMessages, orderFiles, payments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';
import { requireRole } from '@/lib/admin-auth';

// GET /api/v2/orders/[id] - Get order details with financials
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Auth: allow all core roles (admin, manager, client, account_owner, freelancer, editor)
    const authCheck = await requireRole(request, ['admin','manager','client','account_owner','freelancer','editor']);
    if (authCheck.error) {
      return createErrorResponse(authCheck.error, 'UNAUTHORIZED', authCheck.status || 401);
    }
    if (authCheck.user?.role === 'editor') {
      return createErrorResponse('Editors must use the dedicated editor order endpoint', 'FORBIDDEN', 403);
    }
    const resolvedParams = params instanceof Promise ? await params : params;
    const rawId = typeof resolvedParams.id === 'string' ? resolvedParams.id.trim() : String(resolvedParams.id ?? '').trim();

    if (!rawId) {
      return createErrorResponse('Invalid order id', 'INVALID_ORDER_ID', 400);
    }

    let job: typeof jobs.$inferSelect | null = null;

    const numericCandidate = Number(rawId);
    if (!Number.isNaN(numericCandidate) && Number.isFinite(numericCandidate)) {
      const [jobById] = await withRetry(
        async () => {
          return await db.select().from(jobs).where(eq(jobs.id, numericCandidate)).limit(1);
        },
        { maxRetries: 3, initialDelay: 500 }
      );
      if (jobById) {
        job = jobById;
      }
    }

    const identifierVariants = Array.from(new Set([rawId, rawId.toUpperCase(), rawId.toLowerCase()]))
      .filter((value) => value.length > 0);

    if (!job) {
      for (const candidate of identifierVariants) {
        const [jobByDisplay] = await withRetry(
          async () => {
            return await db.select().from(jobs).where(eq(jobs.displayId, candidate)).limit(1);
          },
          { maxRetries: 3, initialDelay: 500 }
        );
        if (jobByDisplay) {
          job = jobByDisplay;
          break;
        }
      }
    }

    if (!job) {
      for (const candidate of identifierVariants) {
        const [jobByOrderNumber] = await withRetry(
          async () => {
            return await db.select().from(jobs).where(eq(jobs.orderNumber, candidate)).limit(1);
          },
          { maxRetries: 3, initialDelay: 500 }
        );
        if (jobByOrderNumber) {
          job = jobByOrderNumber;
          break;
        }
      }
    }

    if (!job) {
      return createErrorResponse('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    // 🔒 OWNERSHIP CHECK: clients and freelancers may only view their own orders.
    // This endpoint returns financial data (freelancer/manager earnings, admin
    // profit), client PII, order files, and private order chat messages - without
    // this check any authenticated client/freelancer could view any other user's
    // order by ID. Admin and manager keep broader access (oversight role).
    const requester = authCheck.user!;
    if (requester.role === 'client' || requester.role === 'account_owner') {
      if (job.clientId !== requester.id) {
        return createErrorResponse('You do not have access to this order', 'FORBIDDEN', 403);
      }
    } else if (requester.role === 'freelancer') {
      const isAssignedToMe = job.assignedFreelancerId === requester.id;
      // Mirrors the "available for bidding" criteria in
      // /api/v2/freelancers/available-orders: unassigned orders that are
      // accepted, or pending with admin/manager approval, are open for any
      // freelancer to view and bid on. Without this, "View & Bid" from the
      // available-orders list always 403'd, since bidding necessarily
      // happens before assignedFreelancerId is ever set.
      const isOpenForBidding = !job.assignedFreelancerId && (
        job.status === 'accepted' ||
        (job.status === 'pending' && (job.adminApproved || job.managerApproved))
      );
      if (!isAssignedToMe && !isOpenForBidding) {
        return createErrorResponse('You do not have access to this order', 'FORBIDDEN', 403);
      }
    }

    const jobId = job.id;

    // 🔴 CRITICAL FIX: Get ACTUAL payment amount from payments table (what client actually paid)
    let latestPayment: {
      id: number;
      amount: number;
      status: string;
      confirmedByAdmin: boolean;
      confirmedAt: string | null;
      createdAt: string;
    } | null = null;
    try {
      const [paymentRow] = await withRetry(
        async () => {
          return await db
            .select({
              id: payments.id,
              amount: payments.amount,
              status: payments.status,
              confirmedByAdmin: payments.confirmedByAdmin,
              confirmedAt: payments.confirmedAt,
              createdAt: payments.createdAt,
            })
            .from(payments)
            .where(eq(payments.jobId, jobId))
            .orderBy(desc(payments.createdAt))
            .limit(1);
        },
        { maxRetries: 2, initialDelay: 300 }
      );
      latestPayment = paymentRow || null;
    } catch (paymentError: any) {
      console.warn('[Orders API] payments table query failed:', paymentError?.message);
      // Continue without payment data rather than failing
    }

    // Use actual payment amount only if a payment was completed/confirmed, otherwise fall back to job.amount
    const isPaymentConfirmed = latestPayment?.status === 'paid' || latestPayment?.status === 'completed';
    const actualPaymentAmount = isPaymentConfirmed ? (latestPayment?.amount ?? null) : null;
    const clientAmount = actualPaymentAmount ?? (job.amount ?? null);

    // 🔴 FIX: Financials should use actual payment amount, not calculated job.amount
    const financials = {
      client_amount: clientAmount, // Use actual payment amount if available
      actual_payment_amount: actualPaymentAmount,
      estimated_amount: job.amount ?? null, // Original estimated amount
      writer_amount: job.freelancerEarnings ?? null,
      manager_amount: job.managerEarnings ?? null,
      platform_fee: job.adminProfit ?? null,
    };

    const payment = latestPayment
      ? {
          amount: actualPaymentAmount,
          payment_status: latestPayment.status || null,
          confirmedByAdmin: (latestPayment.confirmedByAdmin as unknown as number) ?? null,
          confirmedAt: latestPayment.confirmedAt || null,
        }
      : null;

    // Client info
    const [client] = await withRetry(
      async () => {
        return await db
          .select({ 
            id: users.id, 
            name: users.name, 
            email: users.email,
            paymentTerms: users.paymentTerms 
          })
          .from(users)
          .where(eq(users.id, job.clientId));
      },
      { maxRetries: 2, initialDelay: 300 }
    );

    // Writer info
    let writer: { id: number; name: string; email: string; rating: number | null } | null = null;
    if (job.assignedFreelancerId != null) {
      const writerId = job.assignedFreelancerId;
      const [w] = await withRetry(
        async () => {
          return await db
            .select({ id: users.id, name: users.name, email: users.email, rating: users.rating })
            .from(users)
            .where(eq(users.id, writerId));
        },
        { maxRetries: 2, initialDelay: 300 }
      );
      writer = w || null;
    }

    // 🔴 FIX: Manager info from jobs.manager_id, not client.assignedManagerId
    let manager: { id: number; name: string; email: string } | null = null;
    if (job.managerId != null) {
      const managerId = job.managerId;
      const [m] = await withRetry(
        async () => {
          return await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, managerId));
        },
        { maxRetries: 2, initialDelay: 300 }
      );
      manager = m || null;
    }

    // Files / attachments with uploader info (prefer consolidated order_files table, fallback to legacy job_attachments)
    const files = await withRetry(
      async () => {
        // Try order_files table first (may not exist in all environments)
        try {
          const orderFileRows = await db
            .select({
              id: orderFiles.id,
              orderId: orderFiles.orderId,
              uploadedBy: orderFiles.uploadedBy,
              fileName: orderFiles.fileName,
              fileUrl: orderFiles.fileUrl,
              fileSize: orderFiles.fileSize,
              fileType: orderFiles.fileType,
              fileClassification: orderFiles.fileClassification,
              notes: orderFiles.notes,
              versionNumber: orderFiles.versionNumber,
              createdAt: orderFiles.createdAt,
              uploaderName: users.name,
              uploaderRole: users.role,
            })
            .from(orderFiles)
            .leftJoin(users, eq(orderFiles.uploadedBy, users.id))
            .where(eq(orderFiles.orderId, jobId))
            .orderBy(desc(orderFiles.createdAt));

          if (orderFileRows.length > 0) {
            return orderFileRows.map((file) => ({
              id: file.id,
              jobId: file.orderId,
              uploadedBy: file.uploadedBy,
              fileName: file.fileName,
              fileUrl: file.fileUrl,
              fileSize: file.fileSize,
              fileType: file.fileType,
              uploadType: file.fileClassification ?? file.fileType,
              createdAt: file.createdAt,
              notes: file.notes,
              versionNumber: file.versionNumber,
              uploaderName: file.uploaderName,
              uploaderRole: file.uploaderRole,
            }));
          }
        } catch (orderFilesError: any) {
          // order_files table might not exist yet, fall through to legacy table
          console.warn('[Orders API] order_files table query failed, falling back to job_attachments:', orderFilesError?.message);
        }

        // Fall back to legacy job_attachments table
        try {
          const legacyRows = await db
            .select({
              id: jobAttachments.id,
              jobId: jobAttachments.jobId,
              uploadedBy: jobAttachments.uploadedBy,
              fileName: jobAttachments.fileName,
              fileUrl: jobAttachments.fileUrl,
              fileSize: jobAttachments.fileSize,
              fileType: jobAttachments.fileType,
              uploadType: jobAttachments.uploadType,
              createdAt: jobAttachments.createdAt,
              uploaderName: users.name,
              uploaderRole: users.role,
            })
            .from(jobAttachments)
            .leftJoin(users, eq(jobAttachments.uploadedBy, users.id))
            .where(eq(jobAttachments.jobId, jobId))
            .orderBy(desc(jobAttachments.createdAt));

          return legacyRows;
        } catch (attachmentsError: any) {
          console.warn('[Orders API] job_attachments table query failed:', attachmentsError?.message);
          return []; // Return empty array if both tables fail
        }
      },
      { maxRetries: 2, initialDelay: 300 }
    );

    // Messages (job chat) - with error handling for missing table
    let jobMessagesData: any[] = [];
    try {
      jobMessagesData = await withRetry(
        async () => {
          return await db.select().from(jobMessages).where(eq(jobMessages.jobId, jobId));
        },
        { maxRetries: 2, initialDelay: 300 }
      );
    } catch (messagesError: any) {
      console.warn('[Orders API] job_messages table query failed:', messagesError?.message);
      // Continue without messages rather than failing the whole request
    }

    return createSuccessResponse({
      order: {
        id: job.id,
        displayId: job.displayId,
        orderNumber: job.orderNumber,
        orderId: job.orderId,
        accountOrderNumber: job.accountOrderNumber,
        title: job.title,
        instructions: job.instructions || '',
        workType: job.workType,
        pages: job.pages,
        slides: job.slides,
        amount: clientAmount ?? job.amount, // Use actual payment amount if available
        estimatedAmount: job.amount, // Original estimated amount
        actualPaymentAmount: actualPaymentAmount, // What client actually paid
        freelancerEarnings: job.freelancerEarnings,
        managerEarnings: job.managerEarnings,
        adminProfit: job.adminProfit,
        status: job.status,
        adminApproved: job.adminApproved,
        clientApproved: job.clientApproved,
        paymentConfirmed: job.paymentConfirmed,
        deadline: job.deadline,
        actualDeadline: job.actualDeadline || job.deadline,
        freelancerDeadline: job.freelancerDeadline || job.actualDeadline || job.deadline,
        managerId: job.managerId,
        assignedFreelancerId: job.assignedFreelancerId,
        assignedEditorId: job.assignedEditorId,
        // Revision and approval fields
        revisionRequested: job.revisionRequested,
        revisionNotes: job.revisionNotes,
        requiresReports: job.requiresReports,
        // Freelancer response fields
        freelancerAccepted: job.freelancerAccepted,
        freelancerRejected: job.freelancerRejected,
        freelancerResponsePending: job.freelancerResponsePending,
        // Editor status
        editorStatus: job.editorStatus,
        editorApproved: job.editorApproved,
        // Internal revision tracking
        hasOpenInternalRevision: job.hasOpenInternalRevision,
        internalRevisionCount: job.internalRevisionCount,
        clientRequestedRevision: job.clientRequestedRevision,
        // Timestamps
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        acceptedAt: job.acceptedAt,
        assignedAt: job.assignedAt,
        submittedAt: job.submittedAt,
        deliveredAt: job.deliveredAt,
        approvedAt: job.approvedAt,
        paidAt: job.paidAt,
        completedAt: job.completedAt,
      },
      financials,
      client: client ? { id: client.id, name: client.name, email: client.email, paymentTerms: client.paymentTerms } : null,
      writer,
      manager,
      files,
      messages: jobMessagesData,
      payment: latestPayment
        ? {
            amount: actualPaymentAmount,
            payment_status: latestPayment.status || null,
            confirmedByAdmin: (latestPayment.confirmedByAdmin as unknown as number) ?? null,
            confirmedAt: latestPayment.confirmedAt || null,
          }
        : null,
    });
  } catch (error: any) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}