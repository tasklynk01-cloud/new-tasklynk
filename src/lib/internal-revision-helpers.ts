/**
 * INTERNAL REVISIONS API
 * 
 * Handles admin/manager → freelancer revisions WITHOUT changing client-visible order status.
 * 
 * Endpoints:
 * - POST /api/v2/orders/:id/internal-revision - Create internal revision request
 * - GET /api/v2/internal-revisions - Get internal revisions (filtered by role)
 * - GET /api/v2/internal-revisions/:id - Get specific internal revision
 * - POST /api/v2/internal-revisions/:id/submit - Freelancer submits revision
 * - POST /api/v2/internal-revisions/:id/review - Admin/manager reviews submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, users, notifications, orderRevisions } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// ========================================
// POST /api/v2/orders/:id/internal-revision
// Create internal revision request (admin/manager only)
// ========================================
export async function createInternalRevision(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Authenticate
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const orderId = parseInt(params.id);
  const user = authCheck.user!;

  try {
    const body = await request.json();
    const { assignedTo, reason, details } = body;

    // Validate inputs
    if (!assignedTo || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: assignedTo, reason' },
        { status: 400 }
      );
    }

    // Get order
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify assignedTo is a freelancer
    const [freelancer] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, assignedTo), eq(users.role, 'freelancer')))
      .limit(1);

    if (!freelancer) {
      return NextResponse.json(
        { error: 'Assigned user must be a freelancer' },
        { status: 400 }
      );
    }

    // Create internal revision using orderRevisions table
    const now = new Date().toISOString();
    const result = await db.insert(orderRevisions).values({
      orderId: orderId,
      revisionType: 'internal',
      requestedBy: user.id,
      assignedTo: assignedTo,
      description: reason,
      filesJson: details ?? [],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }).returning({ id: orderRevisions.id });

    const revisionId = result[0].id;

    // Update order flags
    await db
      .update(jobs)
      .set({
        hasOpenInternalRevision: true,
        internalRevisionCount: sql`internal_revision_count + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, orderId));

    // Create audit log
    await db.execute(sql`
      INSERT INTO audit_logs (order_id, action, actor_id, actor_role, target_id, target_type, note, timestamp, created_at)
      VALUES (
        ${orderId},
        ${'internal_revision_created'},
        ${user.id},
        ${user.role},
        ${revisionId},
        ${'internal_revision'},
        ${`Internal revision requested from freelancer: ${reason}`},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `);

    // Notify freelancer
    await db.insert(notifications).values({
      userId: assignedTo,
      jobId: orderId,
      type: 'internal_revision_requested',
      title: 'Internal Revision Requested',
      message: `${user.role === 'admin' ? 'Admin' : 'Manager'} has requested revisions on order ${order.displayId}: ${reason}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      revisionId: Number(revisionId),
      message: 'Internal revision created and freelancer notified',
    });

  } catch (error: any) {
    console.error('[Internal Revision] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create internal revision', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// GET /api/v2/internal-revisions
// Get internal revisions (filtered by role)
// ========================================
export async function getInternalRevisions(
  request: NextRequest,
  options?: { orderId?: number }
): Promise<NextResponse> {
  // Authenticate
  const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const user = authCheck.user!;

  try {
    const searchParams = request.nextUrl.searchParams;
    const orderIdParam = searchParams.get('orderId');
    const orderId = options?.orderId ?? (orderIdParam ? Number(orderIdParam) : undefined);

    const baseConditions = [eq(orderRevisions.revisionType, 'internal')];
    if (Number.isFinite(orderId)) {
      baseConditions.push(eq(orderRevisions.orderId, orderId as number));
    }

    if (user.role === 'freelancer') {
      const revisions = await db
        .select({
          revision: orderRevisions,
          orderDisplayId: jobs.displayId,
          orderTitle: jobs.title,
          requestedByName: users.name,
          requestedByRole: users.role,
        })
        .from(orderRevisions)
        .innerJoin(jobs, eq(orderRevisions.orderId, jobs.id))
        .innerJoin(users, eq(orderRevisions.requestedBy, users.id))
        .where(and(...baseConditions, eq(orderRevisions.assignedTo, user.id)))
        .orderBy(desc(orderRevisions.createdAt));

      return NextResponse.json({
        success: true,
        revisions,
        count: revisions.length,
      });
    }

    if (user.role === 'admin') {
      const requestedBy = alias(users, 'requested_by');
      const assignedTo = alias(users, 'assigned_to');

      const revisions = await db
        .select({
          revision: orderRevisions,
          orderDisplayId: jobs.displayId,
          orderTitle: jobs.title,
          freelancerName: assignedTo.name,
          requestedByName: requestedBy.name,
        })
        .from(orderRevisions)
        .innerJoin(jobs, eq(orderRevisions.orderId, jobs.id))
        .leftJoin(assignedTo, eq(orderRevisions.assignedTo, assignedTo.id))
        .innerJoin(requestedBy, eq(orderRevisions.requestedBy, requestedBy.id))
        .where(and(...baseConditions))
        .orderBy(desc(orderRevisions.createdAt));

      return NextResponse.json({
        success: true,
        revisions,
        count: revisions.length,
      });
    }

    // Managers see only internal revisions they created
    const assignedTo = alias(users, 'assigned_to');
    const revisions = await db
      .select({
        revision: orderRevisions,
        orderDisplayId: jobs.displayId,
        orderTitle: jobs.title,
        freelancerName: assignedTo.name,
      })
      .from(orderRevisions)
      .innerJoin(jobs, eq(orderRevisions.orderId, jobs.id))
      .leftJoin(assignedTo, eq(orderRevisions.assignedTo, assignedTo.id))
      .where(and(...baseConditions, eq(orderRevisions.requestedBy, user.id)))
      .orderBy(desc(orderRevisions.createdAt));

    return NextResponse.json({
      success: true,
      revisions,
      count: revisions.length,
    });

  } catch (error: any) {
    console.error('[Internal Revision] Get list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch internal revisions', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/v2/internal-revisions/:id/submit
// Freelancer submits internal revision
// ========================================
export async function submitInternalRevision(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Authenticate
  const authCheck = await requireRole(request, ['freelancer']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const revisionId = parseInt(params.id);
  const user = authCheck.user!;

  try {
    const body = await request.json();
    const { action, reviewNotes, notes } = body;

    // Get revision from order_revisions table
    const revisionResult = await db.execute(sql`
      SELECT * FROM order_revisions WHERE id = ${revisionId} AND revision_type = 'internal'
    `);
    const [revision]: any = revisionResult.rows;

    if (!revision) {
      return NextResponse.json({ error: 'Internal revision not found' }, { status: 404 });
    }

    if (revision.assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this revision' },
        { status: 403 }
      );
    }

    if (revision.status !== 'open') {
      return NextResponse.json(
        { error: `Revision is already ${revision.status}` },
        { status: 400 }
      );
    }

    // Update revision status in order_revisions table
    await db.execute(sql`
      UPDATE order_revisions
      SET status = 'in_progress', submitted_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
      WHERE id = ${revisionId}
    `);

    // Log audit
    await db.execute(sql`
      INSERT INTO audit_logs (order_id, action, actor_id, actor_role, target_id, target_type, note, timestamp, created_at)
      VALUES (
        ${revision.order_id},
        ${'internal_revision_submitted'},
        ${user.id},
        ${user.role},
        ${revisionId},
        ${'internal_revision'},
        ${notes || reviewNotes || 'Freelancer submitted internal revision'},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `);

    // Notify requester
    await db.insert(notifications).values({
      userId: revision.requested_by,
      jobId: revision.order_id,
      type: 'internal_revision_submitted',
      title: 'Internal Revision Submitted',
      message: `Freelancer ${user.name} has submitted the internal revision for review.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Internal revision submitted successfully',
    });

  } catch (error: any) {
    console.error('[Internal Revision] Submit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit internal revision', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/v2/internal-revisions/:id/review
// Admin/manager reviews internal revision submission
// ========================================
export async function reviewInternalRevision(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Authenticate
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const revisionId = parseInt(params.id);
  const user = authCheck.user!;

  try {
    const body = await request.json();
    const { action, notes } = body; // action: 'accept' | 'request_more'

    if (!action || !['accept', 'request_more'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "request_more"' },
        { status: 400 }
      );
    }

    // Get revision from order_revisions table
    const revisionResult = await db.execute(sql`
      SELECT * FROM order_revisions WHERE id = ${revisionId} AND revision_type = 'internal'
    `);
    const [revision]: any = revisionResult.rows;

    if (!revision) {
      return NextResponse.json({ error: 'Internal revision not found' }, { status: 404 });
    }

    if (revision.requested_by !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot review this revision' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Close the revision
      await db.execute(sql`
        UPDATE order_revisions
        SET status = 'completed', completed_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}, closed_by = ${user.id}
        WHERE id = ${revisionId}
      `);

      // Check if there are other pending internal revisions for this order
      const openCountResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM order_revisions
        WHERE order_id = ${revision.order_id} AND revision_type = 'internal' AND status = 'pending'
      `);
      const [openCount]: any = openCountResult.rows;

      if (openCount?.count === 0) {
        // No more open revisions - clear flag
        await db
          .update(jobs)
          .set({
            hasOpenInternalRevision: false,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(jobs.id, revision.order_id));
      }

      // Notify freelancer
      await db.insert(notifications).values({
        userId: revision.assigned_to,
        jobId: revision.order_id,
        type: 'internal_revision_accepted',
        title: 'Internal Revision Accepted! ✅',
        message: `Your internal revision has been accepted. ${notes || ''}`,
        read: false,
        createdAt: new Date().toISOString(),
      });

    } else if (action === 'request_more') {
      // Reopen the revision
      await db.execute(sql`
        UPDATE order_revisions
        SET status = 'pending', updated_at = ${new Date().toISOString()}
        WHERE id = ${revisionId}
      `);

      // Notify freelancer
      await db.insert(notifications).values({
        userId: revision.assigned_to,
        jobId: revision.order_id,
        type: 'internal_revision_request_more',
        title: 'More Work Needed on Internal Revision',
        message: `Please address additional feedback: ${notes || 'Check revision details'}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Log audit
    await db.execute(sql`
      INSERT INTO audit_logs (order_id, action, actor_id, actor_role, target_id, target_type, note, timestamp, created_at)
      VALUES (
        ${revision.order_id},
        ${`internal_revision_${action}`},
        ${user.id},
        ${user.role},
        ${revisionId},
        ${'internal_revision'},
        ${notes || `Internal revision ${action}ed`},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `);

    return NextResponse.json({
      success: true,
      message: `Internal revision ${action === 'accept' ? 'accepted' : 'reopened for more work'}`,
    });

  } catch (error: any) {
    console.error('[Internal Revision] Review error:', error);
    return NextResponse.json(
      { error: 'Failed to review internal revision', details: error.message },
      { status: 500 }
    );
  }
}

