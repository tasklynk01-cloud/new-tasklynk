import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, notifications, orderHistory, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/orders/[id]/freelancer/request-revision
 * 
 * Freelancer requests clarification/revision when order is in 'editing' status
 * 
 * This is used when:
 * - Admin/manager has the order for QC review (status = 'editing')
 * - Freelancer realizes something needs to be fixed/clarified
 * - Creates a notification for admin/manager to review
 * 
 * Flow:
 * - Validates order is in 'editing' status
 * - Validates freelancer is assigned to this order
 * - Creates notification for admin/manager with revision request message
 * - Logs to order_history
 * - Does NOT change order status (stays in 'editing')
 * 
 * Body:
 * {
 *   message: string  // Required: What needs to be revised/clarified
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: "Revision request sent successfully"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate as freelancer
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }

    const user = authCheck.user!;
    const { id } = await params;
    const orderId = parseInt(id);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Valid order ID required', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Revision message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    // Get order
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify freelancer is assigned
    if (order.assignedFreelancerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this order', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Verify order is in editing status
    if (order.status !== 'editing') {
      return NextResponse.json(
        { error: `Cannot request revision from status: ${order.status}. Order must be in editing stage.`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create notifications for admin and manager
    const notificationTargets: number[] = [];
    
    // Add manager if assigned
    if (order.managerId) {
      notificationTargets.push(order.managerId);
    }

    // Add all admins
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'));
    
    notificationTargets.push(...admins.map(a => a.id));

    // Create notifications
    for (const targetId of notificationTargets) {
      await db.insert(notifications).values({
        userId: targetId,
        jobId: orderId,
        type: 'revision_request',
        title: '🔄 Freelancer Revision Request',
        message: `${user.name} has requested a revision for order ${order.displayId}:\n\n"${message.trim()}"`,
        read: false,
        createdAt: now,
      });
    }

    // Log to order history
    await db.insert(orderHistory).values({
      jobId: orderId,
      actorId: user.id,
      action: 'freelancer_revision_request',
      notes: `Freelancer requested revision: ${message.trim()}`,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Revision request sent successfully. Admin/manager will review and respond.',
    });

  } catch (error: any) {
    console.error('[Freelancer Revision Request] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send revision request', details: error.message },
      { status: 500 }
    );
  }
}
