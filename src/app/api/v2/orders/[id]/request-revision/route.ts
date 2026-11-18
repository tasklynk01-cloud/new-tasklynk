import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, users, notifications, orderRevisions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { validateStatusTransition } from '@/lib/status-transitions';

// POST /api/v2/orders/[id]/request-revision - Client requests revision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { clientId, revisionNotes } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if client owns this order
    if (order.clientId !== parseInt(clientId)) {
      return NextResponse.json({ error: 'Not authorized to request revision for this order' }, { status: 403 });
    }

    // Validate status transition (delivered → in_progress for freelancer revision)
    const validation = validateStatusTransition(
      order.status as any,
      'in_progress',
      order.hasOpenInternalRevision || false
    );
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error,
        reason: validation.reason
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create client revision record in orderRevisions table
    const [newRevision] = await db.insert(orderRevisions).values({
      orderId: orderId,
      revisionType: 'client',
      requestedBy: parseInt(clientId),
      assignedTo: order.assignedFreelancerId,
      description: revisionNotes || 'Client requested revisions',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Update order to in_progress status (back to step 1 - freelancer works on revisions)
    await db.update(jobs)
      .set({
        status: 'in_progress',
        revisionRequested: true,
        clientRequestedRevision: true, // Flag that client requested this revision
        revisionNotes: revisionNotes || 'Client requested revisions',
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log to history
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: 'in_progress',
      changedBy: parseInt(clientId),
      note: `Client requested revisions: ${revisionNotes || 'No specific notes'}`,
      createdAt: now,
    });

    // Create notification for freelancer
    if (order.assignedFreelancerId) {
      await db.insert(notifications).values({
        userId: order.assignedFreelancerId,
        jobId: orderId,
        type: 'revision_requested',
        title: 'Client Revision Requested',
        message: `Client has requested revisions for order ${order.orderNumber}. Please review the feedback and resubmit.`,
        read: false,
        createdAt: now,
      });
    }

    // Notify managers/admins about client revision request
    const managersAndAdmins = await db.select().from(users)
      .where(eq(users.roleId, 1)) // Admins
      .execute();

    const managerNotifications = managersAndAdmins.map(manager => ({
      userId: manager.id,
      jobId: orderId,
      type: 'revision_requested' as const,
      title: 'Client Revision Request',
      message: `Client requested revisions for order ${order.orderNumber}. Freelancer notified.`,
      read: false,
      createdAt: now,
    }));

    if (managerNotifications.length > 0) {
      await db.insert(notifications).values(managerNotifications);

      // 📧 AUTOMATIC EMAIL: Send revision request email to freelancer
      try {
        const freelancerId = order.assignedFreelancerId;
        if (freelancerId != null) {
          const [freelancer] = await db.select().from(users).where(eq(users.id, freelancerId));
          if (freelancer && freelancer.email) {
            await sendEmail({
              to: freelancer.email,
              subject: `🔄 Client Revision Requested for Order: ${order.orderNumber}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #E63946;">Client Revision Requested</h2>
                  <p>Hello ${freelancer.name},</p>
                  <p>The client has requested revisions for order <strong>${order.orderNumber}</strong>.</p>
                  <h3 style="color: #457B9D;">Order Details:</h3>
                  <ul>
                    <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                    <li><strong>Title:</strong> ${order.title || 'N/A'}</li>
                  </ul>
                  <h3 style="color: #E63946;">Revision Notes:</h3>
                  <p style="background-color: #fff4e6; padding: 15px; border-left: 4px solid #E63946;">${revisionNotes || 'Please review the client feedback and make necessary changes.'}</p>
                  <p><strong>Action Required:</strong></p>
                  <p>Please review the feedback, make the necessary changes, and resubmit the work.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/freelancer/orders/${orderId}" style="display: inline-block; background-color: #E63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Order & Revise</a>
                  <p style="margin-top: 20px; color: #666;">Please complete the revisions as soon as possible.</p>
                  <p style="margin-top: 10px; font-size: 12px; color: #999;">This is a CLIENT revision request (visible to client)</p>
                </div>
              `,
              category: 'transactional'
            });
          }
        }
      } catch (emailError) {
        console.error('❌ [Client Revision Request] Failed to send email to freelancer:', emailError);
      }
    }

    // 📧 AUTOMATIC EMAIL: Notify admins/managers about client revision
    try {
      const adminEmails = managersAndAdmins.filter(u => u.email).map(u => u.email).filter(Boolean);
      if (adminEmails.length > 0) {
        await sendEmail({
          to: adminEmails.join(','),
          subject: `🔄 Client Revision Request - Order: ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #457B9D;">Client Revision Request Logged</h2>
              <p>A client has requested revisions for order <strong>${order.orderNumber}</strong>.</p>
              <h3>Order Details:</h3>
              <ul>
                <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                <li><strong>Title:</strong> ${order.title || 'N/A'}</li>
                <li><strong>Assigned Freelancer:</strong> ${order.assignedFreelancerId ? 'ID ' + order.assignedFreelancerId : 'Not assigned'}</li>
              </ul>
              <h3>Revision Notes:</h3>
              <p style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #457B9D;">${revisionNotes || 'No specific notes provided'}</p>
              <p>The freelancer has been notified and is expected to resubmit the work.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/admin/orders/${orderId}" style="display: inline-block; background-color: #457B9D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Monitor Order</a>
            </div>
          `,
          category: 'transactional'
        });
      }
    } catch (emailError) {
      console.error('❌ [Client Revision Request] Failed to send admin notification:', emailError);
    }

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Revision requested successfully. Order sent back to writer.'
    });
  } catch (error: any) {
    console.error('Error requesting revision:', error);
    return NextResponse.json({ error: error.message || 'Failed to request revision' }, { status: 500 });
  }
}
