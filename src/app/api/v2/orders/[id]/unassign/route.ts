import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

/**
 * POST /api/v2/orders/[id]/unassign
 * Unassign a freelancer from an order, return it to the available pool
 * Only admins and managers can unassign freelancers
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

    // Check if order has a freelancer assigned
    const freelancerId = order.assignedFreelancerId;
    if (!freelancerId) {
      return NextResponse.json({ error: 'No freelancer is assigned to this order' }, { status: 400 });
    }

    // Get freelancer details for audit log
    let freelancerName = 'Unknown';
    if (freelancerId) {
      const [freelancer] = await db.select({ name: users.name }).from(users).where(eq(users.id, freelancerId)).limit(1);
      if (freelancer) {
        freelancerName = freelancer.name;
      }
    }

    // Parse request body for optional reason
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch {
      // No body provided, that's okay
    }

    // Update order to unassign freelancer and reset status
    const now = new Date().toISOString();
    await db.update(jobs)
      .set({
        assignedFreelancerId: null,
        status: 'accepted', // Return to accepted status so it can be reassigned
        freelancerAccepted: false, // Reset acceptance flags
        freelancerRejected: false,
        freelancerResponsePending: false,
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log the action
    await logAdminActionWithRequest(
      request,
      authCheck.user!.id,
      AdminActions.UNASSIGN_FREELANCER,
      orderId,
      AuditTargetTypes.JOB,
      {
        previousFreelancerId: freelancerId,
        previousFreelancerName: freelancerName,
        previousStatus: order.status,
        reason: reason || 'No reason provided',
        newStatus: 'accepted',
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Freelancer unassigned successfully. Order is now available for reassignment.',
      order: {
        id: orderId,
        displayId: order.displayId,
        previousFreelancer: freelancerName,
        newStatus: 'accepted',
      }
    });

  } catch (error: any) {
    console.error('Error unassigning freelancer:', error);
    return NextResponse.json({ error: error.message || 'Failed to unassign freelancer' }, { status: 500 });
  }
}
