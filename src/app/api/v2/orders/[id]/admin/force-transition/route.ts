import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * POST /api/v2/orders/[id]/admin/force-transition
 * 
 * Admin utility to force-transition stuck orders to a target status.
 * Used for recovery when orders get stuck in editing/revision/in_progress states.
 * 
 * Safety Features:
 * - Only admin role allowed
 * - Validates source/target status compatibility
 * - Logs detailed audit trail with reason
 * - Sends notifications to affected users
 * - Prevents transitions to/from terminal states
 * 
 * Auth: Admin only
 * 
 * Body:
 * {
 *   targetStatus: 'in_progress' | 'editing' | 'delivered' | 'revision' | 'on_hold',
 *   reason: string,              // Required: explanation for manual intervention
 *   notifyUsers?: boolean        // Default: true - notify freelancer/manager/client
 * }
 * 
 * Response:
 * {
 *   order: { ... updated order },
 *   transition: {
 *     from: string,
 *     to: string,
 *     reason: string,
 *     adminId: number
 *   }
 * }
 */

// Allowed target statuses for recovery (excludes terminal and financial states)
// NOTE: 'assigned' removed - orders go directly to in_progress when freelancer is assigned
const RECOVERY_TARGET_STATUSES = [
  'in_progress',
  'editing',
  'delivered',
  'revision',
  'on_hold',
] as const;

// Source statuses that can be force-transitioned
const RECOVERABLE_SOURCE_STATUSES = [
  'in_progress',
  'editing',
  'revision',
  'revision_pending',
  'on_hold',
  'delivered',
] as const;

// Statuses that should NEVER be force-transitioned
const PROTECTED_STATUSES = ['approved', 'paid', 'completed', 'cancelled'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const admin = authCheck.user!;

  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { targetStatus, reason, notifyUsers = true } = body;

    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    if (!targetStatus) {
      return NextResponse.json({ error: 'Target status is required' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason is required (minimum 10 characters) for manual intervention' },
        { status: 400 }
      );
    }

    if (!RECOVERY_TARGET_STATUSES.includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `Invalid target status. Allowed: ${RECOVERY_TARGET_STATUSES.join(', ')}`,
          allowedStatuses: RECOVERY_TARGET_STATUSES,
        },
        { status: 400 }
      );
    }

    // Fetch current order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentStatus = order.status;

    // Validate source status is recoverable
    if (PROTECTED_STATUSES.includes(currentStatus as any)) {
      return NextResponse.json(
        {
          error: `Cannot force-transition from protected status: ${currentStatus}`,
          hint: 'Protected statuses (approved/paid/completed/cancelled) cannot be manually overridden',
        },
        { status: 403 }
      );
    }

    if (!RECOVERABLE_SOURCE_STATUSES.includes(currentStatus as any)) {
      return NextResponse.json(
        {
          error: `Source status ${currentStatus} is not recoverable`,
          recoverableStatuses: RECOVERABLE_SOURCE_STATUSES,
        },
        { status: 400 }
      );
    }

    // Prevent no-op transitions
    if (currentStatus === targetStatus) {
      return NextResponse.json(
        { error: `Order is already in ${targetStatus} status` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Perform atomic transition
    await db
      .update(jobs)
      .set({
        status: targetStatus,
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log detailed audit trail
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: currentStatus,
      newStatus: targetStatus,
      changedBy: admin.id,
      note: `🛠️ FORCE TRANSITION by admin (${admin.email}). Reason: ${reason}`,
      createdAt: now,
    });

    // Log to audit_logs table
    await db.execute(sql`
      INSERT INTO audit_logs (order_id, action, actor_id, actor_role, note, timestamp, created_at)
      VALUES (
        ${orderId},
        ${'force_status_transition'},
        ${admin.id},
        ${'admin'},
        ${'Force transition from ' + currentStatus + ' to ' + targetStatus + '. Reason: ' + reason},
        ${now},
        ${now}
      )
    `);

    // Notify affected users
    if (notifyUsers) {
      const notificationPromises = [];

      if (order.assignedFreelancerId) {
        notificationPromises.push(
          db.insert(notifications).values({
            userId: order.assignedFreelancerId,
            jobId: orderId,
            type: 'status_change',
            title: 'Order Status Updated',
            message: `Order ${order.displayId} status changed from ${currentStatus} to ${targetStatus} by admin. Reason: ${reason}`,
            read: false,
            createdAt: now,
          })
        );
      }

      if (order.managerId) {
        notificationPromises.push(
          db.insert(notifications).values({
            userId: order.managerId,
            jobId: orderId,
            type: 'status_change',
            title: 'Order Status Updated',
            message: `Order ${order.displayId} status changed from ${currentStatus} to ${targetStatus} by admin. Reason: ${reason}`,
            read: false,
            createdAt: now,
          })
        );
      }

      if (order.clientId) {
        notificationPromises.push(
          db.insert(notifications).values({
            userId: order.clientId,
            jobId: orderId,
            type: 'status_change',
            title: 'Order Status Updated',
            message: `Order ${order.displayId} status changed from ${currentStatus} to ${targetStatus}. Our team is actively resolving this.`,
            read: false,
            createdAt: now,
          })
        );
      }

      await Promise.all(notificationPromises);
    }

    // Fetch updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      transition: {
        from: currentStatus,
        to: targetStatus,
        reason,
        adminId: admin.id,
        timestamp: now,
      },
      message: `Order ${order.displayId} successfully transitioned from ${currentStatus} to ${targetStatus}`,
    });
  } catch (error: any) {
    console.error('Error force-transitioning order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to force-transition order' },
      { status: 500 }
    );
  }
}
