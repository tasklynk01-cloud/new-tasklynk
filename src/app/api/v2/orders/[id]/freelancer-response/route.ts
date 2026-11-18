import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, freelancerOrderResponses, notifications, users } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/v2/orders/[id]/freelancer-response
 * Freelancer accepts or rejects an assigned order
 * This is REQUIRED before order can move to in_progress status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { freelancerId, response, rejectionReason } = body;

    // Validate inputs
    if (!freelancerId) {
      return NextResponse.json({ 
        error: 'Freelancer ID is required' 
      }, { status: 400 });
    }

    if (!response || !['accept', 'reject'].includes(response)) {
      return NextResponse.json({ 
        error: 'Response must be "accept" or "reject"' 
      }, { status: 400 });
    }

    if (response === 'reject' && !rejectionReason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required when rejecting an order' 
      }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify freelancer is assigned to this order
    if (order.assignedFreelancerId !== parseInt(freelancerId)) {
      return NextResponse.json({ 
        error: 'You are not assigned to this order' 
      }, { status: 403 });
    }

    // Check if order is in a status that allows freelancer response
    // ✅ Orders now go directly to in_progress when assigned, so we check for that status
    const allowedStatuses = ['in_progress'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json({ 
        error: `Order status (${order.status}) does not allow freelancer response. Only orders in progress can be accepted/rejected.` 
      }, { status: 400 });
    }

    // Check if freelancer has already responded
    if (!order.freelancerResponsePending) {
      return NextResponse.json({ 
        error: 'You have already responded to this order' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const responseTimeMinutes = order.updatedAt 
      ? Math.floor((new Date(now).getTime() - new Date(order.updatedAt).getTime()) / 60000)
      : null;

    // Get freelancer info for notifications
    const [freelancer] = await db.select().from(users).where(eq(users.id, parseInt(freelancerId)));
    const freelancerName = freelancer ? freelancer.name : 'Writer';

    if (response === 'accept') {
      // ✅ FREELANCER ACCEPTED THE ORDER

  // Update order: mark as accepted, move to in_progress
  await db.update(jobs)
    .set({
      status: 'in_progress',
      freelancerAccepted: true,
      freelancerAcceptedAt: now,
      freelancerResponsePending: false,
      updatedAt: now,
    })
    .where(eq(jobs.id, orderId));

  // Log freelancer acceptance (status stays in_progress but acceptance is recorded)
  await db.insert(jobStatusLogs).values({
    jobId: orderId,
    oldStatus: order.status,
    newStatus: 'in_progress',
    changedBy: parseInt(freelancerId),
    note: `Freelancer ${freelancerName} accepted the assignment`,
    createdAt: now,
  });

  // Track response in statistics table
  await db.insert(freelancerOrderResponses).values({
    freelancerId: parseInt(freelancerId),
    jobId: orderId,
    responseStatus: 'accepted',
    responseAt: now,
    responseTimeMinutes,
    createdAt: now,
    updatedAt: now,
  });

  // Notify manager if assigned
  if (order.managerId) {
    await db.insert(notifications).values({
      userId: order.managerId,
      type: 'order',
      title: 'Order Accepted by Writer',
      message: `${freelancerName} has accepted order ${order.orderNumber} and work is now in progress.`,
      read: false,
      createdAt: now,
    });
  }

      // Email manager about acceptance
      if (order.managerId) {
        try {
          const [manager] = await db.select().from(users).where(eq(users.id, order.managerId));
          if (manager && manager.email) {
            await sendEmail({
              to: manager.email,
              subject: `✅ Order ${order.orderNumber} Accepted by Writer`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #10b981;">Order Accepted!</h2>
                  <p>Hello ${manager.name},</p>
                  <p><strong>${freelancerName}</strong> has accepted order <strong>${order.orderNumber}</strong>.</p>
                  <p><strong>Order Title:</strong> ${order.title}</p>
                  <p><strong>Status:</strong> In Progress</p>
                  <p>The writer will now begin working on this order.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/manager/orders/${orderId}" style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Order</a>
                </div>
              `,
              category: 'transactional'
            });
          }
        } catch (emailError) {
          console.error('Failed to send acceptance email:', emailError);
        }
      }

      return NextResponse.json({ 
        success: true,
        message: 'Order accepted successfully.',
        order: { 
          id: orderId,
          status: 'in_progress',
          freelancerAccepted: true 
        }
      });

    } else {
      // ❌ FREELANCER REJECTED THE ORDER

  // Update order: mark as rejected, revert to accepted for reassignment
  await db.update(jobs)
    .set({
      status: 'accepted', // Back to accepted for reassignment (not pending)
      assignedFreelancerId: null, // Unassign freelancer
      freelancerRejected: true,
      freelancerRejectedAt: now,
      freelancerRejectionReason: rejectionReason,
      freelancerResponsePending: false,
      freelancerAccepted: false, // Reset acceptance flag
      freelancerAcceptedAt: null,
      updatedAt: now,
    })
    .where(eq(jobs.id, orderId));

  // Log status change - from current status (could be assigned or in_progress)
  await db.insert(jobStatusLogs).values({
    jobId: orderId,
    oldStatus: order.status, // Use actual current status
    newStatus: 'accepted',
    changedBy: parseInt(freelancerId),
    note: `Freelancer ${freelancerName} rejected: ${rejectionReason}`,
    createdAt: now,
  });

  // Track response in statistics table
  await db.insert(freelancerOrderResponses).values({
    freelancerId: parseInt(freelancerId),
    jobId: orderId,
    responseStatus: 'rejected',
    responseAt: now,
    rejectionReason,
    responseTimeMinutes,
    createdAt: now,
    updatedAt: now,
  });

  // Notify manager about rejection if assigned
  if (order.managerId) {
    await db.insert(notifications).values({
      userId: order.managerId,
      type: 'order',
      title: 'Order Rejected by Writer',
      message: `${freelancerName} has rejected order ${order.orderNumber}. Reason: ${rejectionReason}. Please reassign to another writer.`,
      read: false,
      createdAt: now,
    });
  }

      // Email manager about rejection
      if (order.managerId) {
        try {
          const [manager] = await db.select().from(users).where(eq(users.id, order.managerId));
          if (manager && manager.email) {
            await sendEmail({
              to: manager.email,
              subject: `❌ Order ${order.orderNumber} Rejected by Writer`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #ef4444;">Order Rejected</h2>
                  <p>Hello ${manager.name},</p>
                  <p><strong>${freelancerName}</strong> has rejected order <strong>${order.orderNumber}</strong>.</p>
                  <p><strong>Rejection Reason:</strong></p>
                  <p style="background-color: #fee; padding: 15px; border-left: 4px solid #ef4444;">${rejectionReason}</p>
                  <p>The order has been returned to accepted status and is available for reassignment. Please assign it to another writer.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/manager/orders/${orderId}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Reassign Order</a>
                </div>
              `,
              category: 'transactional'
            });
          }
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      }

      return NextResponse.json({ 
        success: true,
        message: 'Order rejected successfully. It has been returned to the manager for reassignment.',
        order: { 
          id: orderId,
          status: 'accepted',
          freelancerRejected: true 
        }
      });
    }

  } catch (error: any) {
    console.error('Error processing freelancer response:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process response' 
    }, { status: 500 });
  }
}

/**
 * GET /api/v2/orders/[id]/freelancer-response
 * Get freelancer acceptance statistics for a specific freelancer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get('freelancerId');

    if (!freelancerId) {
      return NextResponse.json({ 
        error: 'Freelancer ID is required' 
      }, { status: 400 });
    }

    // Get all responses for this freelancer
    const responses = await db.select()
      .from(freelancerOrderResponses)
      .where(eq(freelancerOrderResponses.freelancerId, parseInt(freelancerId)));

    const totalResponses = responses.length;
    const acceptedCount = responses.filter(r => r.responseStatus === 'accepted').length;
    const rejectedCount = responses.filter(r => r.responseStatus === 'rejected').length;

    const acceptanceRate = totalResponses > 0 
      ? ((acceptedCount / totalResponses) * 100).toFixed(1)
      : '0.0';
    
    const rejectionRate = totalResponses > 0 
      ? ((rejectedCount / totalResponses) * 100).toFixed(1)
      : '0.0';

    // Calculate average response time (in minutes)
    const responseTimes = responses
      .filter(r => r.responseTimeMinutes !== null)
      .map(r => r.responseTimeMinutes!);
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;

    return NextResponse.json({
      freelancerId: parseInt(freelancerId),
      totalResponses,
      acceptedCount,
      rejectedCount,
      acceptanceRate: parseFloat(acceptanceRate),
      rejectionRate: parseFloat(rejectionRate),
      averageResponseTimeSeconds: avgResponseTime,
      responses: responses.map(r => ({
        jobId: r.jobId,
        response: r.responseStatus,
        rejectionReason: r.rejectionReason,
        responseTime: r.responseTimeMinutes,
        createdAt: r.createdAt,
      }))
    });

  } catch (error: any) {
    console.error('Error getting freelancer statistics:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get statistics' 
    }, { status: 500 });
  }
}
