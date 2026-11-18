import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/admin/clients/[id]/orders
 * Get all orders for a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate admin
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const clientId = parseInt(resolvedParams.id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    // Get all orders for this client
    const orders = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        title: jobs.title,
        amount: jobs.amount,
        status: jobs.status,
        workType: jobs.workType,
        pages: jobs.pages,
        slides: jobs.slides,
        deadline: jobs.deadline,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(eq(jobs.clientId, clientId))
      .orderBy(desc(jobs.createdAt));

    return NextResponse.json({
      success: true,
      orders,
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.amount, 0),
    });

  } catch (error) {
    console.error('Failed to get client orders:', error);
    return NextResponse.json(
      { error: 'Failed to get client orders' },
      { status: 500 }
    );
  }
}