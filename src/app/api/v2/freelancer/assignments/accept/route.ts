import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db, type Database } from '@/db';
import { jobs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

const database = db as Database;

/**
 * POST /api/v2/freelancer/assignments/accept
 * Freelancer accepts an assignment
 */
export async function POST(request: NextRequest) {
  try {
    // Verify freelancer authentication
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { orderId } = await request.json();

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
      return NextResponse.json({ error: 'Assignment already accepted' }, { status: 400 });
    }

    // Update order with acceptance
    await database
      .update(jobs)
      .set({
        freelancerAccepted: true,
        freelancerAcceptedAt: new Date().toISOString(),
        freelancerRejected: false,
        freelancerRejectedAt: null,
        freelancerRejectionReason: null,
        freelancerResponsePending: false,
        status: 'in_progress'
      })
      .where(eq(jobs.id, orderId));

    // Create notification for admin/manager
    const notificationUserId = order.managerId ?? 1;
    await database.insert(notifications).values({
      userId: notificationUserId,
      title: 'Freelancer Accepted Assignment',
      message: `Freelancer has accepted assignment for order ${order.displayId}`,
      type: 'assignment_accepted',
      read: false,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Assignment accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

