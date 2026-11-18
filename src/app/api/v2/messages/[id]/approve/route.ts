import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobMessages, notifications, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { getJobMessageAccess } from '@/lib/message-access';

// POST /api/v2/messages/[id]/approve - Approve a message and mark as delivered
// PATCH /api/v2/messages/[id]/approve - Same as POST (support both methods)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await handleApprove(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await handleApprove(request, params);
}

async function handleApprove(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    // 🔒 AUTHENTICATION: Only admin/manager can approve messages
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const approver = authCheck.user!;

    const { id } = await params;
    const messageId = parseInt(id);

    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID', code: 'INVALID_MESSAGE_ID' }, { status: 400 });
    }

    // Get message
    const [message] = await db.select().from(jobMessages).where(eq(jobMessages.id, messageId));

    if (!message) {
      return NextResponse.json({ error: 'Message not found', code: 'MESSAGE_NOT_FOUND' }, { status: 404 });
    }

    const access = await getJobMessageAccess(approver, message.jobId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, code: access.status === 404 ? 'JOB_NOT_FOUND' : 'FORBIDDEN' },
        { status: access.status }
      );
    }

    // Parse request body for optional parameters
    let approved = true;
    let deliverToRecipient = true;
    
    try {
      const body = await request.json();
      if (typeof body.approved === 'boolean') {
        approved = body.approved;
      }
      if (typeof body.deliverToFreelancer === 'boolean') {
        deliverToRecipient = body.deliverToFreelancer;
      }
      if (typeof body.deliverToClient === 'boolean') {
        deliverToRecipient = body.deliverToClient;
      }
    } catch (jsonError) {
      // No body provided, use defaults
    }

    // Update message to admin approved
    const now = new Date().toISOString();
    const updateData: any = {
      adminApproved: approved,
      approvedAt: approved ? now : null,
      approvedBy: approved ? approver.id : null,
    };

    // Auto-deliver if approved
    if (approved && deliverToRecipient) {
      updateData.isDelivered = true;
    }

    await db.update(jobMessages)
      .set(updateData)
      .where(eq(jobMessages.id, messageId));

    const [updatedMessage] = await db.select().from(jobMessages).where(eq(jobMessages.id, messageId));

    // Get job details for notification
    const [job] = await db.select().from(jobs)
      .where(eq(jobs.id, message.jobId))
      .limit(1);

    // Create notification for sender
    if (approved && job) {
      try {
        await db.insert(notifications).values({
          userId: message.senderId,
          jobId: message.jobId,
          type: 'message_approved',
          title: `Message Approved`,
          message: `Your message on order ${job.displayId || job.orderId} has been approved and delivered.`,
          read: false,
          createdAt: now,
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: updatedMessage,
      info: approved ? 'Message approved and delivered to recipient' : 'Message rejected',
      approved: approved,
      delivered: approved && deliverToRecipient,
    });
  } catch (error: any) {
    console.error('Error approving message:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve message', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}