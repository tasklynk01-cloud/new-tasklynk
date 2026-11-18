import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { freelancerOrderResponses, users, jobs } from '@/db/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

// GET - Fetch freelancer response analytics
export async function GET(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const freelancerId = searchParams.get('freelancerId');
    const responseStatus = searchParams.get('responseStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build conditions
    const conditions = [];
    
    if (freelancerId) {
      conditions.push(eq(freelancerOrderResponses.freelancerId, parseInt(freelancerId)));
    }
    if (responseStatus) {
      conditions.push(eq(freelancerOrderResponses.responseStatus, responseStatus));
    }
    if (startDate) {
      conditions.push(gte(freelancerOrderResponses.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(freelancerOrderResponses.createdAt, endDate));
    }

    // Query responses with joins
    const responses = await db
      .select({
        id: freelancerOrderResponses.id,
        freelancerId: freelancerOrderResponses.freelancerId,
        freelancerName: users.name,
        freelancerEmail: users.email,
        jobId: freelancerOrderResponses.jobId,
        jobDisplayId: jobs.displayId,
        jobTitle: jobs.title,
        responseStatus: freelancerOrderResponses.responseStatus,
        responseAt: freelancerOrderResponses.responseAt,
        rejectionReason: freelancerOrderResponses.rejectionReason,
        responseTimeMinutes: freelancerOrderResponses.responseTimeMinutes,
        createdAt: freelancerOrderResponses.createdAt,
      })
      .from(freelancerOrderResponses)
      .leftJoin(users, eq(freelancerOrderResponses.freelancerId, users.id))
      .leftJoin(jobs, eq(freelancerOrderResponses.jobId, jobs.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(freelancerOrderResponses.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(freelancerOrderResponses)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get overall stats
    const overallStats = await db
      .select({
        totalResponses: sql<number>`count(*)`,
        acceptedCount: sql<number>`sum(case when ${freelancerOrderResponses.responseStatus} = 'accepted' then 1 else 0 end)`,
        rejectedCount: sql<number>`sum(case when ${freelancerOrderResponses.responseStatus} = 'rejected' then 1 else 0 end)`,
        avgResponseTime: sql<number>`avg(${freelancerOrderResponses.responseTimeMinutes})`,
      })
      .from(freelancerOrderResponses)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get freelancer-level stats (top 20 by response count)
    const freelancerStats = await db
      .select({
        freelancerId: freelancerOrderResponses.freelancerId,
        freelancerName: users.name,
        totalResponses: sql<number>`count(*)`,
        acceptedCount: sql<number>`sum(case when ${freelancerOrderResponses.responseStatus} = 'accepted' then 1 else 0 end)`,
        rejectedCount: sql<number>`sum(case when ${freelancerOrderResponses.responseStatus} = 'rejected' then 1 else 0 end)`,
        avgResponseTime: sql<number>`avg(${freelancerOrderResponses.responseTimeMinutes})`,
      })
      .from(freelancerOrderResponses)
      .leftJoin(users, eq(freelancerOrderResponses.freelancerId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(freelancerOrderResponses.freelancerId, users.name)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(20);

    // Get rejection reason breakdown
    const rejectionReasons = await db
      .select({
        reason: freelancerOrderResponses.rejectionReason,
        count: sql<number>`count(*)`,
      })
      .from(freelancerOrderResponses)
      .where(and(
        eq(freelancerOrderResponses.responseStatus, 'rejected'),
        sql`${freelancerOrderResponses.rejectionReason} IS NOT NULL`
      ))
      .groupBy(freelancerOrderResponses.rejectionReason)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    const stats = overallStats[0];
    const acceptanceRate = stats?.totalResponses > 0 
      ? ((stats?.acceptedCount || 0) / stats.totalResponses * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      responses,
      total: countResult[0]?.count || 0,
      stats: {
        totalResponses: stats?.totalResponses || 0,
        acceptedCount: stats?.acceptedCount || 0,
        rejectedCount: stats?.rejectedCount || 0,
        acceptanceRate: parseFloat(acceptanceRate as string),
        avgResponseTimeMinutes: Math.round(stats?.avgResponseTime || 0),
      },
      freelancerStats: freelancerStats.map(fs => ({
        ...fs,
        acceptanceRate: fs.totalResponses > 0 
          ? ((fs.acceptedCount || 0) / fs.totalResponses * 100).toFixed(1)
          : 0,
      })),
      rejectionReasons,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching freelancer response analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch response analytics' }, { status: 500 });
  }
}

