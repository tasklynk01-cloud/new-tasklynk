import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, orderRevisions, jobStatusLogs, notifications, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { validateStatusTransition } from '@/lib/status-transitions';

/**
 * PATCH /api/v2/orders/[id]/revisions/[revisionId]/submit
 * 
 * Freelancer submits/completes a revision (internal or client-requested)
 * 
 * Key Behavior:
 * - For internal revisions:
 *   - Updates revision status to 'completed'
 *   - Sets submittedAt timestamp
 *   - Adds freelancerResponse notes
 *   - Checks if all internal revisions closed → set hasOpenInternalRevision=false
 *   - Notifies admin/manager for review (NOT client)
 *   
 * - For client revisions:
 *   - Updates revision status to 'completed'
 *   - May transition order status back to 'delivered' or 'editing'
 *   - Notifies client AND admin/manager
 * 
 * Auth: Requires freelancer role (must be assigned to order)
 * 
 * Body:
 * {
 *   response: string,  // Freelancer's notes about what was fixed
 *   files?: string[]   // Optional: Array of file URLs uploaded
 * }
 * 
 * Response:
 * {
 *   revision: { ... updated revision },
 *   order: { ... updated order if status changed },
 *   message: "Revision submitted successfully"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  try {
    // Validate freelancer authentication
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const freelancer = authCheck.user!;

    const { id, revisionId } = await params;
    const orderId = parseInt(id);
    const revId = parseInt(revisionId);
    
    const body = await request.json();
    const { response, files = [] } = body;

    if (!response || response.trim().length === 0) {
      return NextResponse.json({ error: 'Response is required' }, { status: 400 });
    }

    // Get revision
    const [revision] = await db.select()
      .from(orderRevisions)
      .where(eq(orderRevisions.id, revId));

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    // Verify revision belongs to this order
    if (revision.orderId !== orderId) {
      return NextResponse.json({ 
        error: 'Revision does not belong to this order' 
      }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify freelancer is assigned to this order
    if (order.assignedFreelancerId !== freelancer.id) {
      return NextResponse.json({ 
        error: 'Not authorized to submit this revision' 
      }, { status: 403 });
    }

    // Check revision status
    if (revision.status === 'completed') {
      return NextResponse.json({ 
        error: 'Revision already completed' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const isInternalRevision = revision.revisionType === 'internal';

    // Update revision record
    await db.update(orderRevisions)
      .set({
        status: 'completed',
        freelancerResponse: response.trim(),
        submittedAt: now,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(orderRevisions.id, revId));

    let updatedOrder = order;

    if (isInternalRevision) {
      // === INTERNAL REVISION SUBMISSION ===
      
      // Check if there are any other open internal revisions
      const openInternalRevisions = await db.select()
        .from(orderRevisions)
        .where(
          and(
            eq(orderRevisions.orderId, orderId),
            eq(orderRevisions.revisionType, 'internal'),
            eq(orderRevisions.status, 'pending')
          )
        );

      // If no more open internal revisions, clear the flag
      if (openInternalRevisions.length === 0) {
        await db.update(jobs)
          .set({
            hasOpenInternalRevision: false,
            updatedAt: now,
          })
          .where(eq(jobs.id, orderId));
      }

      // Log status change
      await db.insert(jobStatusLogs).values({
        jobId: orderId,
        oldStatus: order.status,
        newStatus: order.status, // Status doesn't change for internal revisions
        changedBy: freelancer.id,
        note: `Internal revision completed by freelancer: ${response.substring(0, 100)}...`,
        createdAt: now,
      });

      // Notify admin/manager (NOT client)
      const adminsManagers = await db.select()
        .from(users)
        .where(sql`${users.roleId} IN (1, 3)`); // Admin=1, Manager=3

      const notifications_data = adminsManagers.map(user => ({
        userId: user.id,
        jobId: orderId,
        type: 'internal_revision_completed' as const,
        title: 'Internal Revision Completed',
        message: `Freelancer completed internal QC revision for order ${order.orderNumber}. Ready for review.`,
        read: false,
        createdAt: now,
      }));

      if (notifications_data.length > 0) {
        await db.insert(notifications).values(notifications_data);
      }

      // 📧 AUTOMATIC EMAIL: Notify admin/manager
      try {
        const adminEmails = adminsManagers.filter(u => u.email).map(u => u.email);
        if (adminEmails.length > 0) {
          await sendEmail({
            to: adminEmails.join(','),
            subject: `✅ Internal QC Revision Completed - Order: ${order.orderNumber}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2A9D8F;">Internal Revision Completed</h2>
                <p>The freelancer has completed the internal QC revision for order <strong>${order.orderNumber}</strong>.</p>
                <h3>Order Details:</h3>
                <ul>
                  <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                  <li><strong>Title:</strong> ${order.title || 'N/A'}</li>
                  <li><strong>Freelancer:</strong> ${freelancer.name}</li>
                </ul>
                <h3>Freelancer Response:</h3>
                <div style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #2A9D8F; margin: 15px 0;">
                  ${response.replace(/\n/g, '<br>')}
                </div>
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Review the freelancer's changes</li>
                  <li>Check attached files (if any)</li>
                  <li>${openInternalRevisions.length === 0 ? 'All internal revisions completed - ready for client delivery' : `${openInternalRevisions.length} other internal revision(s) still open`}</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/admin/orders/${orderId}" style="display: inline-block; background-color: #2A9D8F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Review Order</a>
                <p style="margin-top: 10px; font-size: 12px; color: #999;">This is an INTERNAL revision (not visible to client)</p>
              </div>
            `,
            category: 'transactional'
          });
        }
      } catch (emailError) {
        console.error('❌ [Internal Revision Completed] Failed to send email:', emailError);
      }

    } else {
      // === CLIENT REVISION SUBMISSION ===
      
      // Transition order back to 'delivered' status
      await db.update(jobs)
        .set({
          status: 'delivered',
          deliveredAt: now,
          updatedAt: now,
        })
        .where(eq(jobs.id, orderId));

      // Log status change
      await db.insert(jobStatusLogs).values({
        jobId: orderId,
        oldStatus: order.status,
        newStatus: 'delivered',
        changedBy: freelancer.id,
        note: `Client revision completed and redelivered: ${response.substring(0, 100)}...`,
        createdAt: now,
      });

      // Notify client
      if (order.clientId) {
        await db.insert(notifications).values({
          userId: order.clientId,
          jobId: orderId,
          type: 'revision_completed',
          title: 'Revision Completed',
          message: `Your requested revisions for order ${order.orderNumber} have been completed and redelivered.`,
          read: false,
          createdAt: now,
        });

        // 📧 AUTOMATIC EMAIL: Notify client
        try {
          const [client] = await db.select().from(users).where(eq(users.id, order.clientId));
          if (client && client.email) {
            await sendEmail({
              to: client.email,
              subject: `✅ Revisions Completed - Order: ${order.orderNumber}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2A9D8F;">Revisions Completed</h2>
                  <p>Hello ${client.name},</p>
                  <p>Your requested revisions for order <strong>${order.orderNumber}</strong> have been completed.</p>
                  <h3>Order Details:</h3>
                  <ul>
                    <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                    <li><strong>Title:</strong> ${order.title || 'N/A'}</li>
                  </ul>
                  <h3>Freelancer Notes:</h3>
                  <div style="background-color: #e6f7f5; padding: 15px; border-left: 4px solid #2A9D8F; margin: 15px 0;">
                    ${response.replace(/\n/g, '<br>')}
                  </div>
                  <p>Please review the updated work and let us know if you have any concerns.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/client/orders/${orderId}" style="display: inline-block; background-color: #2A9D8F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View & Review Order</a>
                </div>
              `,
              category: 'transactional'
            });
          }
        } catch (emailError) {
          console.error('❌ [Client Revision Completed] Failed to send email to client:', emailError);
        }
      }

      // Notify admin/manager
      const adminsManagers = await db.select()
        .from(users)
        .where(sql`${users.roleId} IN (1, 3)`);

      const admin_notifications = adminsManagers.map(user => ({
        userId: user.id,
        jobId: orderId,
        type: 'revision_completed' as const,
        title: 'Client Revision Completed',
        message: `Freelancer completed client revision for order ${order.orderNumber}. Client has been notified.`,
        read: false,
        createdAt: now,
      }));

      if (admin_notifications.length > 0) {
        await db.insert(notifications).values(admin_notifications);
      }

      // Get updated order
      const [newOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));
      updatedOrder = newOrder;
    }

    // Get updated revision
    const [updatedRevision] = await db.select()
      .from(orderRevisions)
      .where(eq(orderRevisions.id, revId));

    return NextResponse.json({
      revision: updatedRevision,
      order: updatedOrder,
      message: `${isInternalRevision ? 'Internal' : 'Client'} revision submitted successfully`,
    });

  } catch (error: any) {
    console.error('Error submitting revision:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to submit revision' 
    }, { status: 500 });
  }
}
