import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, orderRevisions, jobStatusLogs, notifications, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/v2/orders/[id]/revisions/internal
 * 
 * Admin/Manager creates internal QC revision (HIDDEN from client)
 * 
 * Key Behavior:
 * - Does NOT change order status (stays 'editing' or 'in_progress')
 * - Creates order_revisions record with revisionType='internal'
 * - Sets hasOpenInternalRevision=true on jobs table
 * - Increments internalRevisionCount
 * - Notifies ONLY freelancer (NOT client)
 * 
 * Auth: Requires admin or manager role
 * 
 * Body:
 * {
 *   description: string,  // Required: What needs to be fixed
 *   priority?: 'low' | 'medium' | 'high',
 *   dueDate?: string  // ISO timestamp
 * }
 * 
 * Response:
 * {
 *   revision: { ... new revision record },
 *   order: { ... updated order with flags },
 *   message: "Internal revision created. Freelancer notified."
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Validate admin/manager authentication
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const orderId = parseInt(id);
    const body = await request.json();
    const { description, priority = 'medium', dueDate } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate order status (must be in progress or editing)
    if (!['editing', 'in_progress'].includes(order.status)) {
      return NextResponse.json({ 
        error: `Cannot create internal revision for order in status: ${order.status}. Order must be in 'editing' or 'in_progress' status.` 
      }, { status: 400 });
    }

    // Validate freelancer is assigned
    if (!order.assignedFreelancerId) {
      return NextResponse.json({ 
        error: 'Cannot create internal revision for unassigned order' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create internal revision record
    // Note: priority and dueDate are stored in description since those columns don't exist in schema
    const fullDescription = priority !== 'medium' || dueDate 
      ? `[Priority: ${priority}]${dueDate ? ` [Due: ${dueDate}]` : ''}\n\n${description.trim()}`
      : description.trim();
    
    let newRevision: any = null;
    try {
      const [insertedRevision] = await db.insert(orderRevisions).values({
        orderId: orderId,
        revisionType: 'internal',
        requestedBy: user.id,
        assignedTo: order.assignedFreelancerId,
        description: fullDescription,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }).returning();
      newRevision = insertedRevision;
    } catch (tableError: any) {
      const errorMessage = tableError?.message?.toLowerCase() || '';
      if (errorMessage.includes('no such table') || errorMessage.includes('order_revisions')) {
        console.warn('[Internal Revision] order_revisions table not found, skipping revision record');
        // Continue without creating revision record - still update order flags
      } else {
        throw tableError;
      }
    }

    // Update order flags
    await db.update(jobs)
      .set({
        hasOpenInternalRevision: true,
        internalRevisionCount: sql`COALESCE(${jobs.internalRevisionCount}, 0) + 1`,
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log to status history
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: order.status, // Status doesn't change
      changedBy: user.id,
      note: `Internal QC revision requested: ${description.substring(0, 100)}...`,
      createdAt: now,
    });

    // Create notification for freelancer ONLY
    // Use raw SQL to avoid Drizzle including the id field
    try {
      await db.execute(sql`
        INSERT INTO notifications (user_id, job_id, type, title, message, is_read, created_at)
        VALUES (
          ${order.assignedFreelancerId},
          ${orderId},
          'internal_revision_requested',
          'Internal QC Revision Requested',
          ${'Quality control revision requested for order ' + (order.orderNumber || order.displayId || `#${orderId}`) + '. Please review and address the feedback.'},
          0,
          ${now}
        )
      `);
    } catch (notifError) {
      console.error('[Internal Revision] Failed to create notification:', notifError);
      // Don't fail the entire operation if notification fails
    }

    // 📧 AUTOMATIC EMAIL: Send internal revision to freelancer
    try {
      const [freelancer] = await db.select().from(users).where(eq(users.id, order.assignedFreelancerId));
      if (freelancer && freelancer.email) {
        await sendEmail({
          to: freelancer.email,
          subject: `🔧 Internal QC Revision - Order: ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #457B9D;">Internal Quality Control Revision</h2>
              <p>Hello ${freelancer.name},</p>
              <p>Our quality control team has requested revisions for order <strong>${order.orderNumber}</strong>.</p>
              <h3 style="color: #457B9D;">Order Details:</h3>
              <ul>
                <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                <li><strong>Title:</strong> ${order.title || 'N/A'}</li>
                <li><strong>Priority:</strong> <span style="color: ${priority === 'high' ? '#E63946' : priority === 'medium' ? '#F77F00' : '#2A9D8F'};">${priority.toUpperCase()}</span></li>
                ${dueDate ? `<li><strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}</li>` : ''}
              </ul>
              <h3 style="color: #E63946;">QC Feedback:</h3>
              <div style="background-color: #fff4e6; padding: 15px; border-left: 4px solid #457B9D; margin: 15px 0;">
                ${description.replace(/\n/g, '<br>')}
              </div>
              <p><strong>Important Notes:</strong></p>
              <ul>
                <li>This is an <strong>internal revision</strong> - the client has not seen the work yet</li>
                <li>Please address the feedback and resubmit</li>
                <li>The order status remains unchanged</li>
                <li>No client notification will be sent</li>
              </ul>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'}/freelancer/orders/${orderId}" style="display: inline-block; background-color: #457B9D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Order & Address Feedback</a>
              <p style="margin-top: 20px; color: #666;">Please complete the revisions promptly to maintain quality standards.</p>
              <p style="margin-top: 10px; font-size: 12px; color: #999;">This is an INTERNAL QC revision (hidden from client)</p>
            </div>
          `,
          category: 'transactional'
        });
      }
    } catch (emailError) {
      console.error('❌ [Internal Revision] Failed to send email to freelancer:', emailError);
    }

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({
      revision: newRevision,
      order: updatedOrder,
      message: 'Internal revision created successfully. Freelancer notified (client not notified).',
    });
  } catch (error: any) {
    console.error('Error creating internal revision:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create internal revision' 
    }, { status: 500 });
  }
}

/**
 * GET /api/v2/orders/[id]/revisions/internal
 * 
 * Get all internal revisions for an order
 * 
 * Auth: Requires admin, manager, or assigned freelancer
 * 
 * Response:
 * {
 *   revisions: [...array of internal revisions],
 *   count: number
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Validate authentication
    const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const orderId = parseInt(id);

    // Get order to verify access
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If freelancer, verify they're assigned to this order
    if (user.role === 'freelancer' && order.assignedFreelancerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to view this order' }, { status: 403 });
    }

    // Get all internal revisions - handle missing table gracefully
    let revisions: any[] = [];
    try {
      revisions = await db.select()
        .from(orderRevisions)
        .where(
          and(
            eq(orderRevisions.orderId, orderId),
            eq(orderRevisions.revisionType, 'internal')
          )
        )
        .orderBy(orderRevisions.createdAt);
    } catch (tableError: any) {
      // If table doesn't exist, return empty array instead of error
      const errorMessage = tableError?.message?.toLowerCase() || '';
      if (errorMessage.includes('no such table') || errorMessage.includes('order_revisions')) {
        console.warn('[Internal Revisions API] order_revisions table not found, returning empty array');
        revisions = [];
      } else {
        throw tableError;
      }
    }

    return NextResponse.json({
      revisions: revisions,
      count: revisions.length,
    });
  } catch (error: any) {
    console.error('[Internal Revisions API] Error fetching internal revisions:', error);
    console.error('[Internal Revisions API] Error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch internal revisions',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
