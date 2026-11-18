import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

/**
 * POST /api/v2/orders/[id]/cancel
 * Cancel an order with a reason for audit tracking
 * Only admins and managers can cancel orders
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get the current order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is already cancelled or completed
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }
    if (order.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel a completed order' }, { status: 400 });
    }

    // Parse request body for reason (required)
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch {
      // No body provided
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    // Get details for audit log
    let clientName = 'Unknown';
    let freelancerName = null;
    
    if (order.clientId) {
      const [client] = await db.select({ name: users.name }).from(users).where(eq(users.id, order.clientId)).limit(1);
      if (client) {
        clientName = client.name;
      }
    }
    
    if (order.assignedFreelancerId != null) {
      const freelancerId = order.assignedFreelancerId;
      const [freelancer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, freelancerId))
        .limit(1);
      if (freelancer) {
        freelancerName = freelancer.name;
      }
    }

    // Update order to cancelled status
    const now = new Date().toISOString();
    await db.update(jobs)
      .set({
        status: 'cancelled',
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log the action
    await logAdminActionWithRequest(
      request,
      authCheck.user!.id,
      AdminActions.CANCEL_JOB,
      orderId,
      AuditTargetTypes.JOB,
      {
        previousStatus: order.status,
        reason: reason.trim(),
        clientId: order.clientId,
        clientName,
        freelancerId: order.assignedFreelancerId,
        freelancerName,
        orderAmount: order.amount,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: orderId,
        displayId: order.displayId,
        status: 'cancelled',
      }
    });

  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel order' }, { status: 500 });
  }
}
