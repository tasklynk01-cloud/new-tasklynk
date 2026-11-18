import { db } from '@/db';
import { jobs, notifications } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Check for new assignments for a freelancer
 * Returns assignments that haven't been accepted/declined yet
 * NOTE: Orders now go directly to in_progress with freelancerResponsePending=true
 */
export async function checkForNewAssignments(freelancerId: number) {
  try {
    const newAssignments = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.assignedFreelancerId, freelancerId),
          eq(jobs.status, 'in_progress'),
          eq(jobs.freelancerResponsePending, true),
          eq(jobs.freelancerAccepted, false),
          eq(jobs.freelancerRejected, false)
        )
      );

    return newAssignments;
  } catch (error) {
    console.error('Error checking for new assignments:', error);
    return [];
  }
}

/**
 * Create notification for freelancer about new assignment
 */
export async function notifyFreelancerAssignment(freelancerId: number, orderId: number, orderDisplayId: string) {
  try {
    await db.insert(notifications).values({
      userId: freelancerId,
      jobId: orderId,
      title: 'New Order Assignment',
      message: `You have been assigned to order ${orderDisplayId}. Please accept or decline to proceed.`,
      type: 'assignment_received',
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating assignment notification:', error);
  }
}

