import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/v2/editor/orders/[id]/flag
 * Toggle flag status on an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const orderId = parseInt(params.id);
    const editorId = authCheck.user.id;

    // Fetch order
    const [order] = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.id, orderId),
          eq(jobs.assignedEditorId, editorId)
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not assigned to you' },
        { status: 404 }
      );
    }

    const newFlaggedStatus = !order.editorFlagged;

    // Update flag status
    await db
      .update(jobs)
      .set({
        editorFlagged: newFlaggedStatus,
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, orderId));

    // TODO: Add audit logging when proper editor audit table is created

    return NextResponse.json({
      success: true,
      flagged: newFlaggedStatus,
      message: newFlaggedStatus ? 'Order flagged' : 'Flag removed'
    });
  } catch (error) {
    console.error('Error toggling flag:', error);
    return NextResponse.json(
      { error: 'Failed to toggle flag' },
      { status: 500 }
    );
  }
}
