import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editorAssignments, jobs, users, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/v2/orders/[id]/assign-editor
 * Assign an editor to an order for quality control review
 * Accessible by: admin, manager
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Validate authentication
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { editorId, notes } = body;

    if (!editorId) {
      return NextResponse.json({ error: 'Editor ID is required' }, { status: 400 });
    }

    // Verify the order exists
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the editor exists and is an editor
    const [editor] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, editorId), eq(users.roleId, 5)))
      .limit(1);

    if (!editor) {
      return NextResponse.json({ error: 'Editor not found' }, { status: 404 });
    }

    // Check if editor is already assigned to this order
    const existingAssignment = await db
      .select()
      .from(editorAssignments)
      .where(
        and(
          eq(editorAssignments.jobId, jobId),
          eq(editorAssignments.editorId, editorId)
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      return NextResponse.json(
        { error: 'This editor is already assigned to this order' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create the editor assignment
    const [assignment] = await db
      .insert(editorAssignments)
      .values({
        editorId,
        jobId,
        assignedAt: now,
        approvalStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create notification for the editor
    await db.insert(notifications).values({
      userId: editorId,
      jobId,
      type: 'editor_assignment',
      title: 'New Order Assignment',
      message: `You have been assigned to review order ${job.displayId || job.orderNumber}`,
      read: false,
      relatedId: assignment.id,
      relatedType: 'editor_assignment',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Editor ${editor.name} assigned successfully`,
      assignment: {
        id: assignment.id,
        editorId,
        editorName: editor.name,
        jobId,
        assignedAt: now,
        approvalStatus: 'pending',
      },
    });
  } catch (error) {
    console.error('Failed to assign editor:', error);
    return NextResponse.json(
      { error: 'Failed to assign editor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/orders/[id]/assign-editor
 * Get current editor assignment for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Validate authentication
    const authCheck = await requireRole(request, ['admin', 'manager', 'editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Get all editor assignments for this order
    const assignments = await db
      .select({
        id: editorAssignments.id,
        editorId: editorAssignments.editorId,
        jobId: editorAssignments.jobId,
        assignedAt: editorAssignments.assignedAt,
        reviewStartedAt: editorAssignments.reviewStartedAt,
        approvalStatus: editorAssignments.approvalStatus,
        approvalReason: editorAssignments.approvalReason,
        revisionsRequested: editorAssignments.revisionsRequested,
        revisionNotes: editorAssignments.revisionNotes,
        createdAt: editorAssignments.createdAt,
        editorName: users.name,
        editorEmail: users.email,
      })
      .from(editorAssignments)
      .leftJoin(users, eq(editorAssignments.editorId, users.id))
      .where(eq(editorAssignments.jobId, jobId));

    return NextResponse.json({
      assignments,
      total: assignments.length,
    });
  } catch (error) {
    console.error('Failed to fetch editor assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editor assignments' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/orders/[id]/assign-editor
 * Remove an editor assignment from an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Validate authentication
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const editorId = searchParams.get('editorId');

    if (!editorId) {
      return NextResponse.json({ error: 'Editor ID is required' }, { status: 400 });
    }

    // Delete the assignment
    await db
      .delete(editorAssignments)
      .where(
        and(
          eq(editorAssignments.jobId, jobId),
          eq(editorAssignments.editorId, parseInt(editorId))
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Editor assignment removed',
    });
  } catch (error) {
    console.error('Failed to remove editor assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove editor assignment' },
      { status: 500 }
    );
  }
}
