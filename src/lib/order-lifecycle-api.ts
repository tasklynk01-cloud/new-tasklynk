/**
 * ORDER LIFECYCLE API ENDPOINTS
 * 
 * Comprehensive API for managing order flow from pending to completed
 * All endpoints use transactional logic and proper role-based access control
 * 
 * Endpoints:
 * - POST /api/v2/orders/:id/accept - Admin/Manager accepts order
 * - POST /api/v2/orders/:id/assign - Admin/Manager assigns freelancer
 * - POST /api/v2/orders/:id/freelancer/accept - Freelancer accepts assignment
 * - POST /api/v2/orders/:id/freelancer/reject - Freelancer rejects assignment
 * - POST /api/v2/orders/:id/freelancer/submit - Freelancer submits work
 * - POST /api/v2/orders/:id/admin/deliver - Admin/Manager delivers to client
 * - POST /api/v2/orders/:id/client/approve - Client approves work
 * - POST /api/v2/orders/:id/client/request-revision - Client requests revision
 * - POST /api/v2/orders/:id/admin/confirm-payment - Admin confirms payment
 * - POST /api/v2/orders/:id/add-fine - Admin adds fine/adjustment
 * - GET /api/v2/orders/:id/timeline - Get order audit timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, users, notifications, orderHistory, jobStatusLogs, jobAttachments, orderFiles } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  validateAndTransitionStatus,
  processOrderApproval,
  confirmPaymentReceived,
  ORDER_STATUS,
} from '@/lib/order-flow-helpers';
import { validateStatusTransition } from '@/lib/status-transitions';
import { managerAssignFee, managerSubmitFee, calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';
import { recommendFreelancersForOrder } from '@/lib/freelancer-recommendations';

// ========================================
// POST /api/v2/orders/:id/accept
// Admin/Manager accepts pending order
// ========================================
export async function acceptOrder(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;

  try {
    const body = await request.json();
    const { message } = body;

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      return NextResponse.json(
        { error: `Order cannot be accepted from status: ${order.status}` },
        { status: 400 }
      );
    }

    // Transition status
    await validateAndTransitionStatus({
      orderId,
      currentStatus: order.status,
      newStatus: ORDER_STATUS.ACCEPTED,
      actorId: user.id,
      actorRole: user.role,
      note: message || `Order accepted by ${user.role}`,
    });

    // Update accepted timestamp
    await db
      .update(jobs)
      .set({
        acceptedAt: new Date().toISOString(),
        adminApproved: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, orderId));

    // Notify client
    await db.insert(notifications).values({
      userId: order.clientId,
      jobId: orderId,
      type: 'order_accepted',
      title: 'Order Accepted! ✅',
      message: `Your order ${order.displayId} has been accepted and will be assigned shortly.${message ? ` Message: ${message}` : ''}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      status: ORDER_STATUS.ACCEPTED,
    });

  } catch (error: any) {
    console.error('[Order Accept] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept order', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/v2/orders/:id/assign
// Admin/Manager assigns freelancer to order
// ========================================
export async function assignFreelancer(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;
  const activeLoadCap = 5;

  try {
    const body = await request.json();
    const { freelancerId: rawFreelancerId, notes, urgent } = body;

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== ORDER_STATUS.ACCEPTED) {
      return NextResponse.json(
        { error: `Order cannot be assigned from status: ${order.status}` },
        { status: 400 }
      );
    }

    // Parse freelancerId, auto-pick if not provided
    let freelancerId = typeof rawFreelancerId === 'number' ? rawFreelancerId : parseInt(String(rawFreelancerId || ''), 10);
    if (!freelancerId || Number.isNaN(freelancerId)) {
      // Auto-pick the top recommended freelancer
      const recommended = await recommendFreelancersForOrder({
        orderId,
        limit: 1,
        activeLoadCap,
      });
      if (!recommended.length) {
        return NextResponse.json(
          { error: 'No eligible freelancers available for this order. Please provide a freelancerId.' },
          { status: 400 }
        );
      }
      freelancerId = recommended[0].id;
    }

    // Verify freelancer exists and is approved
    const [freelancer] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, freelancerId), eq(users.role, 'freelancer')))
      .limit(1);

    if (!freelancer) {
      return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    if (!freelancer.approved) {
      return NextResponse.json({ error: 'Freelancer is not approved' }, { status: 400 });
    }

    // Enforce active-load cap
    const activeLoadResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.assignedFreelancerId, freelancerId),
          inArray(jobs.status, ['in_progress', 'editing', 'revision', 'on_hold', 'delivered'] as any)
        )
      );
    const activeLoad = Number(activeLoadResult[0]?.count || 0);
    if (activeLoad >= activeLoadCap) {
      return NextResponse.json(
        { error: `Freelancer has reached active load cap (${activeLoadCap})` },
        { status: 400 }
      );
    }

    // Start transaction - use Drizzle transaction wrapper for connection pooling
    let freelancerEarnings = 0;

    try {
      await db.transaction(async (tx) => {
        const managerAssignedFee = managerAssignFee();

        // Calculate freelancer earnings based on their CPP level
        // First, get freelancer's completed orders count
        const completedOrdersResult = await tx
          .select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(
            and(
              eq(jobs.assignedFreelancerId, freelancerId),
              eq(jobs.status, 'completed')
            )
          );
      
        const completedOrders = Number(completedOrdersResult[0]?.count || 0);
        
        // Calculate earnings using CPP level system with single-spaced support
        freelancerEarnings = calculateWriterEarningsByCPPLevel(
          order.pages,
          order.slides,
          order.workType,
          completedOrders,
          Boolean(order.singleSpaced)
        );

        // Calculate admin profit: clientAmount - freelancerEarnings - expectedManagerEarnings
        const clientAmount = Number(order.amount) || 0;
        const adminProfit = Math.max(0, clientAmount - freelancerEarnings - managerAssignedFee);

        // ✅ Track who assigned (for manager payment rules)
        const assignedById = user.id;
        const assignerRole = user.role;
        
        // Assign freelancer with calculated earnings
        // NOTE: Balance updates happen at APPROVAL time (processOrderApproval), not assignment
        // Assignment records expected earnings on the job for display purposes.
        // Freelancer must still explicitly accept/reject the assignment.
        const now = new Date().toISOString();
        await tx
          .update(jobs)
          .set({
            assignedFreelancerId: freelancerId,
            assignedAt: now,
            assignedById: assignedById, // Track who assigned
            freelancerResponsePending: true,
            freelancerAccepted: false,
            freelancerAcceptedAt: null,
            freelancerRejected: false,
            freelancerRejectedAt: null,
            freelancerRejectionReason: null,
            managerAssignedFee: managerAssignedFee,
            freelancerEarnings: freelancerEarnings, // ✅ Set expected earnings (for display)
            adminProfit: adminProfit, // ✅ Set expected admin profit (for display)
            updatedAt: now,
          })
          .where(eq(jobs.id, orderId));

        // ✅ NEW RULE: Only managers who assign get assignment fee (admins get nothing)
        // NOTE: This only records who WOULD be credited and updates the job's
        // display-only expected-earnings field. The actual balance credit (and the
        // authoritative managerEarnings audit row) happens exactly once, at client
        // approval time, in processOrderApproval - crediting it here too would
        // double-pay the manager (the balance/managerEarnings side effects used to
        // live here and were the root cause of that bug).
        const creditedManagerId = (assignerRole === 'manager')
          ? (order.managerId ?? user.id)
          : null; // Admin assigns → no manager payment

        if (creditedManagerId) {
          try {
            // 🔴 FIX: Use SQL to increment from current database value (not stale object)
            await tx.execute(sql`
              UPDATE jobs
              SET manager_earnings = COALESCE(manager_earnings, 0) + ${managerAssignedFee},
                  updated_at = ${now}
              WHERE id = ${orderId}
            `);
          } catch (managerEarningError) {
            // Non-fatal: manager earnings table/columns might be missing in some environments
            console.warn('[Order Assign] Skipped manager assignment fee display update:', managerEarningError);
          }
        }

        // Transition status - directly to in_progress (no intermediate assigned state)
        await validateAndTransitionStatus({
          orderId,
          currentStatus: order.status,
          newStatus: ORDER_STATUS.IN_PROGRESS,
          actorId: user.id,
          actorRole: user.role,
          note: notes || `Freelancer assigned by ${user.role} - work in progress`,
        }, tx);

        // Notify freelancer - acceptance/rejection required
        await tx.insert(notifications).values({
          userId: freelancerId,
          jobId: orderId,
          type: 'order_assigned',
          title: 'New Order Assignment',
          message: `You have been assigned to order ${order.displayId}${urgent ? ' (URGENT)' : ''}. Please accept or reject this assignment. Expected earnings: KSh ${freelancerEarnings.toFixed(2)} (credited upon client approval)`,
          read: false,
          createdAt: now,
        });

        // Notify client
        await tx.insert(notifications).values({
          userId: order.clientId,
          jobId: orderId,
          type: 'freelancer_assigned',
          title: 'Freelancer Assigned',
          message: `A freelancer has been assigned to your order ${order.displayId}.`,
          read: false,
          createdAt: now,
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Freelancer assigned successfully',
        freelancerName: freelancer.name,
        freelancerEarnings,
        status: ORDER_STATUS.IN_PROGRESS,
      });

    } catch (error) {
      throw error;
    }

  } catch (error: any) {
    console.error('[Order Assign] Error:', error);
    return NextResponse.json(
      { error: 'Failed to assign freelancer', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/v2/orders/:id/freelancer/accept
// Freelancer accepts assignment (explicit confirmation)
// ========================================
export async function freelancerAcceptOrder(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authCheck = await requireRole(request, ['freelancer']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;

  try {
    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.assignedFreelancerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this order' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validation = validateStatusTransition(
      order.status as any,
      'in_progress',
      order.hasOpenInternalRevision || false
    );
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, reason: validation.reason },
        { status: 400 }
      );
    }

    if (order.freelancerAccepted) {
      return NextResponse.json(
        { error: 'You have already accepted this order' },
        { status: 400 }
      );
    }

    // Accept order
    await db
      .update(jobs)
      .set({
        freelancerAccepted: true,
        freelancerAcceptedAt: new Date().toISOString(),
        freelancerResponsePending: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, orderId));

    // Transition to in_progress
    await validateAndTransitionStatus({
      orderId,
      currentStatus: order.status,
      newStatus: ORDER_STATUS.IN_PROGRESS,
      actorId: user.id,
      actorRole: user.role,
      note: 'Freelancer accepted assignment',
    });

    // Notify admin/manager
    const notificationTargets = [order.clientId];
    if (order.managerId) notificationTargets.push(order.managerId);

    // Get all admins
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    notificationTargets.push(...admins.map(a => a.id));

    for (const targetId of notificationTargets) {
      await db.insert(notifications).values({
        userId: targetId,
        jobId: orderId,
        type: 'freelancer_accepted',
        title: 'Freelancer Accepted Order',
        message: `${user.name} has accepted order ${order.displayId} and work is now in progress.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully.',
      status: ORDER_STATUS.IN_PROGRESS,
    });

  } catch (error: any) {
    console.error('[Freelancer Accept] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept order', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/v2/orders/:id/freelancer/reject
// Freelancer rejects assignment
// ========================================
export async function freelancerRejectOrder(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authCheck = await requireRole(request, ['freelancer']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;

  try {
    const body = await request.json();
    const { reason } = body;

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.assignedFreelancerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this order' },
        { status: 403 }
      );
    }

    if (order.status !== ORDER_STATUS.IN_PROGRESS) {
      return NextResponse.json(
        { error: `Order cannot be rejected from status: ${order.status}` },
        { status: 400 }
      );
    }

    // Reject order - move back to accepted
    await db
      .update(jobs)
      .set({
        assignedFreelancerId: null,
        assignedAt: null,
        freelancerRejected: true,
        freelancerRejectedAt: new Date().toISOString(),
        freelancerRejectionReason: reason || 'No reason provided',
        freelancerResponsePending: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, orderId));

    // Move back to accepted status
    await validateAndTransitionStatus({
      orderId,
      currentStatus: order.status,
      newStatus: ORDER_STATUS.ACCEPTED,
      actorId: user.id,
      actorRole: user.role,
      note: `Freelancer rejected assignment: ${reason || 'No reason provided'}`,
    });

    // Notify admin/manager
    const notificationTargets: number[] = [];
    if (order.managerId) notificationTargets.push(order.managerId);

    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    notificationTargets.push(...admins.map(a => a.id));

    for (const targetId of notificationTargets) {
      await db.insert(notifications).values({
        userId: targetId,
        jobId: orderId,
        type: 'freelancer_rejected',
        title: 'Freelancer Rejected Order',
        message: `${user.name} has rejected order ${order.displayId}. Reason: ${reason || 'Not specified'}. Please reassign.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order rejected. It will be reassigned to another freelancer.',
    });

  } catch (error: any) {
    console.error('[Freelancer Reject] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reject order', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/v2/orders/:id/freelancer/submit
// Freelancer submits work (moves to editing status)
// ========================================
export async function freelancerSubmitWork(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authCheck = await requireRole(request, ['freelancer']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;

  console.log('[Freelancer Submit] Starting submission for order:', orderId, 'by user:', user.id);

  try {
    const body = await request.json();
    const { notes } = body;

    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.assignedFreelancerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this order' },
        { status: 403 }
      );
    }

      // Allow submission from in_progress, revision, internal_revision, client_revision, or editing
    // Note: editing status means files were already uploaded, this is just final confirmation
      const allowedStatuses = ['in_progress', 'revision', 'internal_revision', 'client_revision', 'editing'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot submit from status: ${order.status}. Order must be in progress or revision.` },
        { status: 400 }
      );
    }

    // If already in editing status, this is a confirmation call after file upload
    const alreadyInEditing = order.status === 'editing';

    // Check orderFiles table for uploaded files
    const uploadedFiles = await db
      .select({ 
        id: orderFiles.id, 
        fileType: orderFiles.fileType,
        fileClassification: orderFiles.fileClassification 
      })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId));

    // Also check legacy jobAttachments table for backward compatibility
    const legacyFiles = await db
      .select({ 
        id: jobAttachments.id, 
        uploadType: jobAttachments.uploadType 
      })
      .from(jobAttachments)
      .where(eq(jobAttachments.jobId, orderId));

    console.log('[Freelancer Submit] Files found:', {
      orderFilesCount: uploadedFiles?.length || 0,
      legacyFilesCount: legacyFiles?.length || 0,
      orderFiles: uploadedFiles?.map(f => ({ id: f.id, type: f.fileType, class: f.fileClassification })),
      legacyFiles: legacyFiles?.map(f => ({ id: f.id, uploadType: f.uploadType })),
    });

    const totalFiles = (uploadedFiles?.length || 0) + (legacyFiles?.length || 0);
    
    // If already in editing and files exist, skip file validation (already done during upload)
    if (!alreadyInEditing) {
      if (totalFiles === 0) {
        console.log('[Freelancer Submit] No files found for order:', orderId);
        return NextResponse.json(
          { error: 'You must upload at least one file before submitting' },
          { status: 400 }
        );
      }

      // Verify final document exists - check both tables and multiple classification types
      // Expanded to include all valid final paper classifications
      const finalDocTypes = [
        'final_document', 'completed_paper', 'completed_smart_paper', 
        'final_paper', 'final', 'final_work', 'final_submission'
      ];
      
      const hasFinalDoc = uploadedFiles.some(f => 
        finalDocTypes.includes(f.fileType) || 
        finalDocTypes.includes(f.fileClassification || '')
      ) || legacyFiles.some(f => 
        finalDocTypes.includes(f.uploadType || '')
      );
      
      console.log('[Freelancer Submit] Final doc check:', {
        hasFinalDoc,
        finalDocTypes,
        orderFileTypes: uploadedFiles?.map(f => f.fileType),
        orderFileClasses: uploadedFiles?.map(f => f.fileClassification),
      });
      
      if (!hasFinalDoc) {
        // Log what files we found for debugging
        console.log('[Freelancer Submit] Files found but no final doc:', {
          orderFiles: uploadedFiles.map(f => ({ type: f.fileType, class: f.fileClassification })),
          legacyFiles: legacyFiles.map(f => ({ uploadType: f.uploadType }))
        });
        return NextResponse.json(
          { error: 'You must upload a final document (Completed Paper) before submitting' },
          { status: 400 }
        );
      }
    }

    // Target status is 'editing' for admin/manager review
    const targetStatus = 'editing';

    const now = new Date().toISOString();

    // Use Drizzle transaction wrapper for proper connection pooling
    try {
      await db.transaction(async (tx) => {
        // Only update status if not already in editing (to avoid duplicate status logs)
        if (!alreadyInEditing) {
          // Update order status to 'editing' and mark submission complete
          await tx
            .update(jobs)
            .set({
              status: targetStatus,
              submittedAt: now,
              finalSubmissionComplete: true,
              updatedAt: now,
            })
            .where(eq(jobs.id, orderId));

          // Status log - non-fatal
          try {
            await tx.insert(jobStatusLogs).values({
              jobId: orderId,
              oldStatus: order.status,
              newStatus: targetStatus,
              changedBy: user.id,
              note: notes || 'Freelancer submitted work for manager review',
              createdAt: now,
            });
          } catch (logError) {
            console.warn('[Freelancer Submit] Status log failed (non-fatal):', logError);
          }
        } else {
          // Already in editing status - just update timestamps
          console.log('[Freelancer Submit] Order already in editing status, confirming submission');
          await tx
            .update(jobs)
            .set({
              submittedAt: now,
              finalSubmissionComplete: true,
              updatedAt: now,
            })
            .where(eq(jobs.id, orderId));
        }

        // Manager expected-earnings display update - non-fatal, should not block submission.
        // NOTE: this only updates jobs.managerDeliveryFee/managerEarnings for display.
        // The actual balance credit + authoritative managerEarnings audit row happens
        // once, at client approval time, in processOrderApproval (see note in assignFreelancer
        // above - crediting it here too was the source of the manager double-payment bug).
        if (order.managerId) {
          try {
            // 🔴 FIX: Calculate pages correctly - use pages if available, slides if slides-only order, default to 1
            // 🔴 CRITICAL: Include singleSpaced for proper page calculation
            const pageCount = order.pages && order.pages > 0 ? order.pages : (order.slides && order.slides > 0 ? 1 : 1);
            const isSingleSpaced = Boolean((order as any).singleSpaced);
            const submissionEarning = managerSubmitFee(pageCount, isSingleSpaced);

            // 🔴 FIX: Use SQL to increment from current database value (not stale object)
            await tx.execute(sql`
              UPDATE jobs
              SET manager_delivery_fee = ${submissionEarning},
                  manager_earnings = COALESCE(manager_earnings, 0) + ${submissionEarning},
                  updated_at = ${now}
              WHERE id = ${orderId}
            `);
          } catch (managerEarningsError) {
            // Non-fatal: manager earnings should not block submission
            console.warn('[Freelancer Submit] Manager earnings tracking failed (non-fatal):', managerEarningsError);
          }
        }
      });

      console.log('[Freelancer Submit] Transaction committed successfully for order:', orderId);
    } catch (error) {
      console.error('[Freelancer Submit] Transaction failed:', error);
      throw error;
    }

    // Notifications are non-blocking: the work may be submitted even if notifications fail.
    try {
      const notificationTargets: number[] = [];
      if (order.managerId) notificationTargets.push(order.managerId);

      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
      notificationTargets.push(...admins.map((admin) => admin.id));

      const uniqueTargets = Array.from(new Set(notificationTargets)).filter(
        (targetId) => typeof targetId === 'number' && Number.isFinite(targetId)
      );

      for (const targetId of uniqueTargets) {
        try {
          await db.insert(notifications).values({
            userId: targetId,
            jobId: orderId,
            type: 'work_submitted',
            title: 'Work Submitted - Manager Review Required',
            message: `${user.name || 'A freelancer'} has submitted work for order ${order.displayId}. Please review before sending to editor.`,
            read: false,
            createdAt: now,
          });
        } catch (notifyError) {
          console.warn('[Freelancer Submit] Failed to send notification:', notifyError);
        }
      }
    } catch (notifyOuterError) {
      console.warn('[Freelancer Submit] Notification preparation failed:', notifyOuterError);
    }

    return NextResponse.json({
      success: true,
      message: 'Work submitted successfully. Awaiting manager review.',
      status: targetStatus,
    });
  } catch (error: any) {
    console.error('[Freelancer Submit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit work', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// SHARED HELPER: Move order into editing lane
// ========================================
export async function sendToEditingStage(options: {
  orderId: number;
  actorId: number;
  actorRole: string;
  editorId?: number | null;
  managerApprovalNotes?: string | null;
  markManagerApproved?: boolean;
}): Promise<{ status: string; assignedEditorId: number | null }> {
  const { orderId, actorId, actorRole, editorId, managerApprovalNotes, markManagerApproved } = options;

  const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
  if (!order) {
    throw new Error('Order not found');
  }

  const allowedStatuses = [
    ORDER_STATUS.SUBMITTED,
    ORDER_STATUS.REVISION,
    ORDER_STATUS.CLIENT_REVISION,
    ORDER_STATUS.IN_PROGRESS,
    ORDER_STATUS.INTERNAL_REVISION,
    ORDER_STATUS.EDITING,
  ];

  if (!allowedStatuses.includes(order.status as any)) {
    throw new Error(`Order cannot be sent to editing from status: ${order.status}`);
  }

  let editorRecord: { id: number; name: string | null; email: string | null } | null = null;
  if (editorId) {
    const [editor] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, approved: users.approved, status: users.status })
      .from(users)
      .where(eq(users.id, editorId))
      .limit(1);

    if (!editor || editor.role !== 'editor' || editor.approved !== true || editor.status !== 'active') {
      throw new Error('Editor not found or not active');
    }

    editorRecord = { id: editor.id, name: editor.name, email: editor.email };
  }

  const now = new Date().toISOString();
  const previousStatus = order.status;
  const alreadyEditing = previousStatus === ORDER_STATUS.EDITING;

  // Use Drizzle transaction wrapper for proper connection pooling
  try {
    await db.transaction(async (tx) => {
      if (!alreadyEditing) {
        await validateAndTransitionStatus({
          orderId,
          currentStatus: previousStatus,
          newStatus: ORDER_STATUS.EDITING,
          actorId,
          actorRole,
          note: managerApprovalNotes || 'Order moved to editing stage',
        }, tx);
        order.status = ORDER_STATUS.EDITING;
      }

      const updatePayload: Record<string, any> = {
        editorStatus: 'pending_editing',
        updatedAt: now,
      };

      if (editorRecord) {
        updatePayload.assignedEditorId = editorRecord.id;
        updatePayload.editorAssignedAt = now;
      }

      if (managerApprovalNotes) {
        updatePayload.managerApprovalNotes = managerApprovalNotes;
      }

      if (markManagerApproved) {
        updatePayload.managerApproved = true;
        updatePayload.managerApprovedAt = now;
      }

      await tx.update(jobs).set(updatePayload).where(eq(jobs.id, orderId));

      if (!alreadyEditing) {
        await tx.insert(jobStatusLogs).values({
          jobId: orderId,
          oldStatus: previousStatus,
          newStatus: ORDER_STATUS.EDITING,
          changedBy: actorId,
          note: managerApprovalNotes || 'Order moved to editing stage',
          createdAt: now,
        });
      }
    });
  } catch (error) {
    throw error;
  }

  if (editorRecord) {
    await db.insert(notifications).values({
      userId: editorRecord.id,
      jobId: orderId,
      type: 'editor_assignment',
      title: 'New Order Ready for Editing',
      message: `Order ${order.displayId || order.orderNumber || '#' + order.id} is ready for your review.`,
      read: false,
      createdAt: now,
    });
  }

  return {
    status: ORDER_STATUS.EDITING,
    assignedEditorId: editorRecord?.id ?? order.assignedEditorId ?? null,
  };
}

// ========================================
// POST /api/v2/orders/:id/admin/deliver
// Admin/Manager delivers work to client
// ========================================
export async function deliverToClient(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  console.log('[Deliver Order] Starting delivery process for order:', params.id);
  
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    console.log('[Deliver Order] Auth failed:', authCheck.error);
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;
  console.log('[Deliver Order] User:', user.id, user.role, user.email);

  try {
    const body = await request.json().catch(() => ({}));
    const { notes } = body as Record<string, unknown>;
    const deliveryNotes =
      typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null;

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      console.log('[Deliver Order] Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('[Deliver Order] Current order status:', order.status, 'Order ID:', order.displayId);

    // SIMPLIFIED: Allow delivery from ANY status except terminal states
    const TERMINAL_STATUSES = ['delivered', 'approved', 'paid', 'completed', 'cancelled'];
    
    if (TERMINAL_STATUSES.includes(order.status)) {
      console.log('[Deliver Order] Order already in terminal status:', order.status);
      return NextResponse.json(
        { error: `Order is already ${order.status}. Cannot deliver again.` },
        { status: 400 }
      );
    }

    // Calculate manager delivery fee using the canonical formula (accounts for singleSpaced doubling)
    const pages = order.pages || 0;
    const managerDeliveryFee = managerSubmitFee(pages, Boolean((order as any).singleSpaced));

    const now = new Date().toISOString();

    // DIRECT UPDATE: Update order status directly to 'delivered' without validation.
    // IMPORTANT: Production DBs can sometimes lag behind schema changes; if an update fails
    // due to missing columns, fall back to a minimal SQL update so delivery can still proceed.
    console.log('[Deliver Order] Directly updating order to delivered status');
    let updateMode: 'full' | 'fallback_delivered_at' | 'fallback_status_only' = 'full';
    try {
      await db
        .update(jobs)
        .set({
          status: 'delivered',
          deliveredAt: now,
          deliveredById: user.id,
          managerDeliveryFee: managerDeliveryFee,
          editorStatus: 'completed',
          editorApproved: true,
          editorApprovedAt: order.editorApprovedAt ?? now,
          editorCompletedAt: order.editorCompletedAt ?? now,
          updatedAt: now,
        })
        .where(eq(jobs.id, orderId));
    } catch (updateError: any) {
      console.warn('[Deliver Order] Full update failed, attempting fallback:', updateError);
      console.warn('[Deliver Order] Error details:', { message: updateError.message, code: updateError.code, name: updateError.name });

      // Fallback 1: status + delivered_at + updated_at (skip columns that might not exist)
      try {
        updateMode = 'fallback_delivered_at';
        console.log('[Deliver Order] Attempting fallback mode: delivered_at');
        await db.execute(sql`
          UPDATE jobs
          SET status = 'delivered',
              delivered_at = ${now},
              updated_at = ${now}
          WHERE id = ${orderId}
        `);
        console.log('[Deliver Order] Fallback mode delivered_at succeeded');
      } catch (fallback1Error: any) {
        console.warn('[Deliver Order] Fallback (delivered_at) failed, attempting status-only:', fallback1Error);
        console.warn('[Deliver Order] Fallback1 error details:', { message: fallback1Error.message, code: fallback1Error.code });

        // Fallback 2: status + updated_at only (most minimal update)
        try {
          updateMode = 'fallback_status_only';
          console.log('[Deliver Order] Attempting fallback mode: status_only');
          await db.execute(sql`
            UPDATE jobs
            SET status = 'delivered',
                updated_at = ${now}
            WHERE id = ${orderId}
          `);
          console.log('[Deliver Order] Fallback mode status_only succeeded');
        } catch (fallback2Error: any) {
          console.error('[Deliver Order] ALL FALLBACKS FAILED:', fallback2Error);
          throw new Error(`Failed to update order status: ${fallback2Error.message}`);
        }
      }
    }

    console.log('[Deliver Order] Order status updated to delivered. Mode:', updateMode);

    // Log to order history (non-blocking)
    try {
      await db.insert(orderHistory).values({
        jobId: orderId,
        action: `Status changed: ${order.status} → delivered`,
        oldStatus: order.status,
        newStatus: 'delivered',
        actorId: user.id,
        notes: deliveryNotes || `Work delivered to client by ${user.role}`,
        createdAt: now,
      });
    } catch (historyError) {
      console.warn('[Deliver Order] Failed to log history:', historyError);
    }

    // Notify client
    console.log('[Deliver Order] Sending notification to client:', order.clientId);
    try {
      await db.insert(notifications).values({
        userId: order.clientId,
        jobId: orderId,
        type: 'order_delivered',
        title: 'Order Delivered! 📄',
        message: `Your order ${order.displayId} has been completed and is now available for review. Please approve or request revisions.`,
        read: false,
        createdAt: now,
      });
    } catch (notifyError) {
      console.warn('[Deliver Order] Failed to send notification:', notifyError);
    }

    console.log('[Deliver Order] SUCCESS - Order delivered');
    return NextResponse.json({
      success: true,
      message: 'Order delivered to client successfully',
      status: 'delivered',
      managerDeliveryFee: managerDeliveryFee,
      deliveredAt: now,
      previousStatus: order.status,
      updateMode,
    });

  } catch (error: any) {
    console.error('[Deliver Order] Error:', error);
    console.error('[Deliver Order] Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Failed to deliver order',
        details: error?.message || String(error),
        code: 'DELIVER_FAILED',
      },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/v2/orders/:id/client/approve
// Client approves delivered work (CRITICAL FINANCIAL TRANSACTION)
// ========================================
export async function clientApproveOrder(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const authCheck = await requireRole(request, ['client', 'account_owner']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;

  try {
    const body = await request.json();
    const { rating, feedback } = body;

    // Get order with full details
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'You are not the client for this order' }, { status: 403 });
    }

    // Get client's payment terms
    const clientPaymentTerms = user.paymentTerms || 'pod'; // Default to POD (Pay on Delivery)
    
    // For POA (Pay on Approval) clients, payment must be confirmed BEFORE they can approve
    // For POD (Pay on Delivery) clients, they approve work first, then pay
    if (clientPaymentTerms === 'poa' && !order.paymentConfirmed) {
      return NextResponse.json({ 
        error: 'Payment must be confirmed before approving the order (Pay on Approval terms)',
        code: 'PAYMENT_REQUIRED_POA'
      }, { status: 400 });
    }

    // Validate status transition (delivered → approved)
    const validation = validateStatusTransition(
      order.status as any,
      'approved',
      order.hasOpenInternalRevision || false
    );
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, reason: validation.reason },
        { status: 400 }
      );
    }

    // Get freelancer completed orders count for CPP calculation
    const [freelancer] = await db
      .select()
      .from(users)
      .where(eq(users.id, order.assignedFreelancerId!))
      .limit(1);

    if (!freelancer) {
      return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // Process approval with financial calculations (TRANSACTIONAL)
    await processOrderApproval({
      orderId,
      clientId: user.id,
      actorId: user.id,
      pages: order.pages || 0,
      slides: order.slides || 0,
      workType: order.workType || '',
      freelancerId: order.assignedFreelancerId!,
      managerId: order.managerId || null,
      freelancerCompletedOrders: freelancer.completedJobs || 0,
      singleSpaced: order.singleSpaced || false,
    });

    // Update rating if provided
    if (rating) {
      await db
        .update(jobs)
        .set({
          clientRating: rating,
          reviewComment: feedback || null,
        })
        .where(eq(jobs.id, orderId));
    }

    return NextResponse.json({
      success: true,
      message: 'Order approved successfully. Financial calculations completed.',
      status: ORDER_STATUS.APPROVED,
    });

  } catch (error: any) {
    console.error('[Client Approve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve order', details: error.message },
      { status: 500 }
    );
  }
}

