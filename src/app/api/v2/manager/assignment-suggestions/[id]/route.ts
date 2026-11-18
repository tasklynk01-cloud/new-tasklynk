/**
 * GET /api/v2/manager/assignment-suggestions/[id]
 * 
 * Returns recommended freelancers for an order with commission preview.
 * Combines Phase 4 recommendation engine with Phase 5 manager workflow automation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { recommendFreelancersForOrder } from '@/lib/freelancer-recommendations';
import { getManagerCommissionPreview } from '@/lib/manager-commission';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    // Verify order exists and is in assignable state
    const [order] = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        title: jobs.title,
        status: jobs.status,
        pages: jobs.pages,
        slides: jobs.slides,
        workType: jobs.workType,
        actualDeadline: jobs.actualDeadline,
        assignedFreelancerId: jobs.assignedFreelancerId,
      })
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is assignable
    const assignableStatuses = ['accepted', 'pending'];
    if (!assignableStatuses.includes(order.status || '')) {
      return NextResponse.json({
        error: 'Order is not in assignable state',
        currentStatus: order.status,
        assignableStatuses,
      }, { status: 400 });
    }

    // Get freelancer recommendations
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const activeLoadCap = parseInt(searchParams.get('activeLoadCap') || '5', 10);

    const recommendations = await recommendFreelancersForOrder({
      orderId,
      limit: Math.min(Math.max(limit, 1), 20),
      activeLoadCap: Math.min(Math.max(activeLoadCap, 1), 10),
    });

    // Get commission preview for this order
    const commissionPreview = await getManagerCommissionPreview(orderId);

    // Calculate deadline urgency
    const now = new Date();
    const deadline = order.actualDeadline ? new Date(order.actualDeadline) : null;
    const hoursUntilDeadline = deadline
      ? (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
      : null;

    const urgency = hoursUntilDeadline !== null
      ? hoursUntilDeadline < 4
        ? 'critical'
        : hoursUntilDeadline < 8
          ? 'high'
          : hoursUntilDeadline < 24
            ? 'medium'
            : 'low'
      : 'unknown';

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        displayId: order.displayId,
        title: order.title,
        status: order.status,
        pages: order.pages,
        slides: order.slides,
        workType: order.workType,
        deadline: order.actualDeadline,
        hoursUntilDeadline: hoursUntilDeadline !== null ? Math.round(hoursUntilDeadline * 10) / 10 : null,
        urgency,
      },
      recommendations: recommendations.map((r) => ({
        ...r,
        recommended: r.score >= 2.5, // Strong recommendation threshold
        warning: r.activeLoad >= 4 ? 'High workload - may affect delivery time' : null,
      })),
      commissionPreview,
      meta: {
        totalCandidates: recommendations.length,
        strongRecommendations: recommendations.filter((r) => r.score >= 2.5).length,
        activeLoadCap,
      },
    });
  } catch (error) {
    console.error('[Manager Assignment Suggestions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment suggestions' },
      { status: 500 }
    );
  }
}
