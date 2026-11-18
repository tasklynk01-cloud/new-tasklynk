import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { orderRevisions, jobs, users } from '@/db/schema';
import { eq, sql, count, and, gte, lte } from 'drizzle-orm';

/**
 * GET /api/v2/revisions/analytics
 * Get revision analytics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Date conditions
    const dateConditions: any[] = [];
    if (startDate) {
      dateConditions.push(gte(orderRevisions.createdAt, startDate));
    }
    if (endDate) {
      dateConditions.push(lte(orderRevisions.createdAt, endDate));
    }

    // Total revisions count
    const totalRevisionsResult = await db.select({ count: count() })
      .from(orderRevisions)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined);
    const totalRevisions = totalRevisionsResult[0]?.count || 0;

    // Revisions by type
    const byType = await db.select({
      type: orderRevisions.revisionType,
      count: count(),
    })
    .from(orderRevisions)
    .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
    .groupBy(orderRevisions.revisionType);

    // Revisions by status
    const byStatus = await db.select({
      status: orderRevisions.status,
      count: count(),
    })
    .from(orderRevisions)
    .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
    .groupBy(orderRevisions.status);

    // Pending revisions (need attention)
    const pendingResult = await db.select({ count: count() })
      .from(orderRevisions)
      .where(and(
        eq(orderRevisions.status, 'pending'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    const pendingRevisions = pendingResult[0]?.count || 0;

    // In-progress revisions
    const inProgressResult = await db.select({ count: count() })
      .from(orderRevisions)
      .where(and(
        eq(orderRevisions.status, 'in_progress'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    const inProgressRevisions = inProgressResult[0]?.count || 0;

    // Completed revisions
    const completedResult = await db.select({ count: count() })
      .from(orderRevisions)
      .where(and(
        eq(orderRevisions.status, 'completed'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    const completedRevisions = completedResult[0]?.count || 0;

    // Client vs Internal breakdown
    const clientRevisionsResult = await db.select({ count: count() })
      .from(orderRevisions)
      .where(and(
        eq(orderRevisions.revisionType, 'client'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    const clientRevisions = clientRevisionsResult[0]?.count || 0;

    const internalRevisionsResult = await db.select({ count: count() })
      .from(orderRevisions)
      .where(and(
        eq(orderRevisions.revisionType, 'internal'),
        ...(dateConditions.length > 0 ? dateConditions : [])
      ));
    const internalRevisions = internalRevisionsResult[0]?.count || 0;

    // Top freelancers by revision workload
    const freelancerWorkload = await db.select({
      freelancerId: orderRevisions.assignedTo,
      count: count(),
    })
    .from(orderRevisions)
    .where(and(
      sql`${orderRevisions.assignedTo} IS NOT NULL`,
      ...(dateConditions.length > 0 ? dateConditions : [])
    ))
    .groupBy(orderRevisions.assignedTo)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

    // Get freelancer names
    const freelancerIds = freelancerWorkload.map(f => f.freelancerId).filter(Boolean) as number[];
    const freelancerNames: Record<number, string> = {};
    if (freelancerIds.length > 0) {
      const freelancers = await db.select({ id: users.id, name: users.name })
        .from(users)
        .where(sql`${users.id} IN (${freelancerIds.join(',')})`);
      freelancers.forEach(f => { freelancerNames[f.id] = f.name; });
    }

    const topFreelancersByRevisions = freelancerWorkload.map(f => ({
      freelancerId: f.freelancerId,
      freelancerName: f.freelancerId ? freelancerNames[f.freelancerId] || 'Unknown' : 'Unassigned',
      revisionCount: f.count,
    }));

    // Calculate completion rate
    const completionRate = totalRevisions > 0 
      ? Math.round((completedRevisions / totalRevisions) * 100) 
      : 0;

    return NextResponse.json({
      analytics: {
        totalRevisions,
        pendingRevisions,
        inProgressRevisions,
        completedRevisions,
        clientRevisions,
        internalRevisions,
        completionRate,
        byType,
        byStatus,
        topFreelancersByRevisions,
      }
    });
  } catch (error) {
    console.error('Error fetching revision analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch revision analytics' }, { status: 500 });
  }
}

