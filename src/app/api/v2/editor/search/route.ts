import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, or, like, and } from 'drizzle-orm';

/**
 * GET /api/v2/editor/search
 * Search for orders by ID, title, or client name
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const searchTerm = `%${query.trim()}%`;

    // Search in orders that are in editing workflow
    const editorStatuses = ['pending_editing', 'editing_in_progress', 'awaiting_revision', 'awaiting_admin_review'];

    const results = await db
      .select({
        id: jobs.id,
        orderId: jobs.orderId,
        displayId: jobs.displayId,
        title: jobs.title,
        status: jobs.status,
        editorStatus: jobs.editorStatus,
        deadline: jobs.deadline,
        assignedEditorId: jobs.assignedEditorId,
        editorClaimedAt: jobs.editorClaimedAt,
        clientId: jobs.clientId,
      })
      .from(jobs)
      .where(
        and(
          or(
            like(jobs.orderId, searchTerm),
            like(jobs.displayId, searchTerm),
            like(jobs.title, searchTerm)
          )
        )
      )
      .limit(50);

    // Enrich with client names
    const enrichedResults = await Promise.all(
      results.map(async (order) => {
        const [client] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, order.clientId))
          .limit(1);

        return {
          ...order,
          clientName: client?.name || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: enrichedResults,
      count: enrichedResults.length,
    });
  } catch (error) {
    console.error('Error searching orders:', error);
    return NextResponse.json(
      { error: 'Failed to search orders' },
      { status: 500 }
    );
  }
}

