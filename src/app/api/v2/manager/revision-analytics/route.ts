import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderRevisions, jobs, users } from '@/db/schema';
import { eq, desc, and, gte, lte, sql, count } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/manager/revision-analytics
 * Get revision analytics for manager's orders
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['manager', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const freelancerId = searchParams.get('freelancerId');

    // Build conditions
    const conditions: any[] = [];
    
    if (startDate) {
      conditions.push(gte(orderRevisions.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orderRevisions.createdAt, endDate));
    }

    // Get overall revision stats
    const overallStats = await db
      .select({
        totalRevisions: sql<number>`count(*)`,
        clientRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'client' then 1 else 0 end)`,
        internalRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'internal' then 1 else 0 end)`,
        completedRevisions: sql<number>`sum(case when ${orderRevisions.status} = 'completed' then 1 else 0 end)`,
        pendingRevisions: sql<number>`sum(case when ${orderRevisions.status} = 'pending' or ${orderRevisions.status} = 'in_progress' then 1 else 0 end)`,
      })
      .from(orderRevisions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get revisions by freelancer
    const revisionsByFreelancer = await db
      .select({
        freelancerId: jobs.assignedFreelancerId,
        freelancerName: users.name,
        totalRevisions: sql<number>`count(${orderRevisions.id})`,
        clientRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'client' then 1 else 0 end)`,
        internalRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'internal' then 1 else 0 end)`,
      })
      .from(orderRevisions)
      .innerJoin(jobs, eq(orderRevisions.orderId, jobs.id))
      .leftJoin(users, eq(jobs.assignedFreelancerId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(jobs.assignedFreelancerId, users.name)
      .orderBy(desc(sql<number>`count(${orderRevisions.id})`))
      .limit(10);

    // Get revisions by work type
    const revisionsByWorkType = await db
      .select({
        workType: jobs.workType,
        totalRevisions: sql<number>`count(${orderRevisions.id})`,
        clientRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'client' then 1 else 0 end)`,
        internalRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'internal' then 1 else 0 end)`,
      })
      .from(orderRevisions)
      .innerJoin(jobs, eq(orderRevisions.orderId, jobs.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(jobs.workType)
      .orderBy(desc(sql<number>`count(${orderRevisions.id})`));

    // Get recent revisions
    const recentRevisions = await db
      .select({
        id: orderRevisions.id,
        orderId: orderRevisions.orderId,
        revisionType: orderRevisions.revisionType,
        description: orderRevisions.description,
        status: orderRevisions.status,
        createdAt: orderRevisions.createdAt,
        completedAt: orderRevisions.completedAt,
        orderDisplayId: jobs.displayId,
        orderNumber: jobs.orderNumber,
        orderTitle: jobs.title,
        freelancerName: users.name,
      })
      .from(orderRevisions)
      .innerJoin(jobs, eq(orderRevisions.orderId, jobs.id))
      .leftJoin(users, eq(jobs.assignedFreelancerId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orderRevisions.createdAt))
      .limit(20);

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await db
      .select({
        month: sql<string>`strftime('%Y-%m', ${orderRevisions.createdAt})`,
        totalRevisions: sql<number>`count(*)`,
        clientRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'client' then 1 else 0 end)`,
        internalRevisions: sql<number>`sum(case when ${orderRevisions.revisionType} = 'internal' then 1 else 0 end)`,
      })
      .from(orderRevisions)
      .where(gte(orderRevisions.createdAt, sixMonthsAgo.toISOString()))
      .groupBy(sql`strftime('%Y-%m', ${orderRevisions.createdAt})`)
      .orderBy(sql`strftime('%Y-%m', ${orderRevisions.createdAt})`);

    // Get revision rate (orders with revisions vs total orders)
    const orderStats = await db
      .select({
        totalOrders: sql<number>`count(distinct ${jobs.id})`,
        ordersWithRevisions: sql<number>`count(distinct ${orderRevisions.orderId})`,
      })
      .from(jobs)
      .leftJoin(orderRevisions, eq(jobs.id, orderRevisions.orderId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const revisionRate = orderStats[0]?.totalOrders > 0
      ? ((orderStats[0]?.ordersWithRevisions || 0) / orderStats[0].totalOrders * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      overview: {
        totalRevisions: Number(overallStats[0]?.totalRevisions) || 0,
        clientRevisions: Number(overallStats[0]?.clientRevisions) || 0,
        internalRevisions: Number(overallStats[0]?.internalRevisions) || 0,
        completedRevisions: Number(overallStats[0]?.completedRevisions) || 0,
        pendingRevisions: Number(overallStats[0]?.pendingRevisions) || 0,
        revisionRate: parseFloat(revisionRate),
        totalOrders: Number(orderStats[0]?.totalOrders) || 0,
        ordersWithRevisions: Number(orderStats[0]?.ordersWithRevisions) || 0,
      },
      byFreelancer: revisionsByFreelancer.map(r => ({
        freelancerId: r.freelancerId,
        freelancerName: r.freelancerName || 'Unknown',
        totalRevisions: Number(r.totalRevisions) || 0,
        clientRevisions: Number(r.clientRevisions) || 0,
        internalRevisions: Number(r.internalRevisions) || 0,
      })),
      byWorkType: revisionsByWorkType.map(r => ({
        workType: r.workType || 'Unknown',
        totalRevisions: Number(r.totalRevisions) || 0,
        clientRevisions: Number(r.clientRevisions) || 0,
        internalRevisions: Number(r.internalRevisions) || 0,
      })),
      recentRevisions: recentRevisions.map(r => ({
        id: r.id,
        jobId: r.orderId,
        revisionType: r.revisionType,
        reason: r.description,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        displayId: r.orderDisplayId || r.orderNumber,
        orderTitle: r.orderTitle,
        freelancerName: r.freelancerName,
      })),
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        totalRevisions: Number(m.totalRevisions) || 0,
        clientRevisions: Number(m.clientRevisions) || 0,
        internalRevisions: Number(m.internalRevisions) || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching revision analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revision analytics' },
      { status: 500 }
    );
  }
}

