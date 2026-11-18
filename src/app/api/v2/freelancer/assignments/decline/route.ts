import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db, type Database } from '@/db';
import { jobs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

const database = db as Database;

/**
 * POST /api/v2/freelancer/assignments/decline
 * Freelancer declines an assignment
 */
export async function POST(request: NextRequest) {
  try {
    // Verify freelancer authentication
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Verify order is assigned to this freelancer and not yet accepted
    const [order] = await database
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.assignedFreelancerId !== user.id) {
      return NextResponse.json({ error: 'Order not assigned to you' }, { status: 403 });
    }

    if (order.freelancerAccepted) {
      return NextResponse.json({ error: 'Assignment already accepted - cannot decline' }, { status: 400 });
    }

    // Update order to remove assignment
    await database
      .update(jobs)
      .set({
        assignedFreelancerId: null,
        freelancerAccepted: false,
        freelancerAcceptedAt: null,
        freelancerRejected: true,
        freelancerRejectedAt: new Date().toISOString(),
        freelancerRejectionReason: reason || 'No reason provided',
        freelancerResponsePending: false,
        status: 'accepted' // Back to accepted status for reassignment
      })
      .where(eq(jobs.id, orderId));

    // Create notification for admin/manager
    const notificationUserId = order.managerId ?? 1;
    await database.insert(notifications).values({
      userId: notificationUserId,
      title: 'Freelancer Declined Assignment',
      message: `Freelancer declined assignment for order ${order.displayId}. Reason: ${reason || 'No reason provided'}`,
      type: 'assignment_declined',
      read: false,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Assignment declined successfully'
    });

  } catch (error) {
    console.error('Error declining assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

