import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editorAssignments, users, jobs, notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/orders/[id]/editor
 * Get editor assignment for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get current editor assignment - with error handling for missing table
    let assignment: any[] = [];
    try {
      assignment = await db
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
        .innerJoin(users, eq(editorAssignments.editorId, users.id))
        .where(eq(editorAssignments.jobId, jobId))
        .orderBy(desc(editorAssignments.createdAt))
        .limit(1);
    } catch (tableError: any) {
      const errorMessage = tableError?.message?.toLowerCase() || '';
      if (errorMessage.includes('no such table') || errorMessage.includes('editor_assignments')) {
        console.warn('[Editor API] editor_assignments table not found, returning null');
        return NextResponse.json({ assignment: null });
      }
      throw tableError;
    }

    return NextResponse.json({
      assignment: assignment[0] || null,
    });
  } catch (error) {
    console.error('Error fetching editor assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editor assignment' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/orders/[id]/editor
 * Assign an editor to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);
    const body = await request.json();
    const { editorId } = body;

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    if (!editorId) {
      return NextResponse.json({ error: 'Editor ID is required' }, { status: 400 });
    }

    // Verify the job exists
    const job = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the editor exists and is active
    const editor = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, editorId),
        eq(users.roleId, 5),
        eq(users.approved, true)
      ))
      .limit(1);

    if (!editor[0]) {
      return NextResponse.json({ error: 'Editor not found or not active' }, { status: 404 });
    }

    // Check if there's already an active assignment - with error handling for missing table
    let existingAssignment: any[] = [];
    try {
      existingAssignment = await db
        .select()
        .from(editorAssignments)
        .where(and(
          eq(editorAssignments.jobId, jobId),
          eq(editorAssignments.approvalStatus, 'pending')
        ))
        .limit(1);
    } catch (tableError: any) {
      const errorMessage = tableError?.message?.toLowerCase() || '';
      if (errorMessage.includes('no such table') || errorMessage.includes('editor_assignments')) {
        console.warn('[Editor API] editor_assignments table not found');
        return NextResponse.json({ 
          error: 'Editor assignment feature not available. Database table missing.' 
        }, { status: 503 });
      }
      throw tableError;
    }

    if (existingAssignment[0]) {
      return NextResponse.json(
        { error: 'There is already a pending editor assignment for this order' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create the assignment
    const newAssignment = await db
      .insert(editorAssignments)
      .values({
        editorId,
        jobId,
        assignedAt: now,
        approvalStatus: 'pending',
        revisionsRequested: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create notification for editor
    await db.insert(notifications).values({
      userId: editorId,
      jobId,
      type: 'editor_assignment',
      title: 'New Order for Review',
      message: `You have been assigned to review order #${job[0].displayId || job[0].orderNumber}`,
      read: false,
      relatedId: newAssignment[0]?.id,
      relatedType: 'editor_assignment',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      assignment: newAssignment[0],
      message: `Editor ${editor[0].name} assigned to order`,
    });
  } catch (error) {
    console.error('Error assigning editor:', error);
    return NextResponse.json(
      { error: 'Failed to assign editor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/orders/[id]/editor
 * Remove editor assignment from an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Delete all pending assignments for this job
    await db
      .delete(editorAssignments)
      .where(and(
        eq(editorAssignments.jobId, jobId),
        eq(editorAssignments.approvalStatus, 'pending')
      ));

    return NextResponse.json({
      success: true,
      message: 'Editor assignment removed',
    });
  } catch (error) {
    console.error('Error removing editor assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove editor assignment' },
      { status: 500 }
    );
  }
}
