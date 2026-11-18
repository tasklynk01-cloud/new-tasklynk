import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, and, or, isNotNull } from 'drizzle-orm';

/**
 * GET /api/v2/editor/queue
 * Fetch all orders assigned to the authenticated editor
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const editorUserId = authCheck.user.id;

    // Fetch orders assigned to this editor - simplified query
    const queueOrders = await db
      .select({
        id: jobs.id,
        orderId: jobs.orderId,
        displayId: jobs.displayId,
        title: jobs.title,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        deadline: jobs.deadline,
        assignedAt: jobs.editorAssignedAt,
        pages: jobs.pages,
        slides: jobs.slides,
        isFlagged: jobs.editorFlagged,
        hasRevisionRequest: jobs.editorRequestedRevision,
        editorNotes: jobs.editorNotes,
        clientId: jobs.clientId,
        clientName: users.name,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.clientId, users.id))
      .where(eq(jobs.assignedEditorId, editorUserId))
      .orderBy(jobs.deadline);

    // Filter orders by editor status in JS to avoid complex OR queries
    const activeStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review'];
    const filteredOrders = queueOrders.filter(order => 
      order.editorStatus && activeStatuses.includes(order.editorStatus)
    );

    return NextResponse.json({
      success: true,
      orders: filteredOrders || [],
      count: filteredOrders?.length || 0
    });
  } catch (error) {
    console.error('Error fetching editor queue:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch editor queue',
        details: error instanceof Error ? error.message : 'Unknown error',
        orders: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

