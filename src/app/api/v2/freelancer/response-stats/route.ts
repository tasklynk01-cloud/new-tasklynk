import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerOrderResponses, jobs, users } from '@/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/freelancer/response-stats
 * Get freelancer's order response statistics
 * 
 * Query params:
 * - freelancerId: Required if admin/manager, optional for freelancer (uses session)
 * - period: 'week', 'month', '3months', 'year', 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const requestedFreelancerId = searchParams.get('freelancerId');
    const period = searchParams.get('period') || 'all';

    // Determine which freelancer to get stats for
    let freelancerId: number;
    
    if (authCheck.user.role === 'freelancer') {
      freelancerId = authCheck.user.id;
    } else if (requestedFreelancerId) {
      freelancerId = parseInt(requestedFreelancerId);
    } else {
      return NextResponse.json(
        { error: 'freelancerId is required for admin/manager' },
        { status: 400 }
      );
    }

    // Calculate date filter based on period
    let dateFilter: Date | null = null;
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Build conditions
    const conditions = [eq(freelancerOrderResponses.freelancerId, freelancerId)];
    if (dateFilter) {
      conditions.push(gte(freelancerOrderResponses.createdAt, dateFilter.toISOString()));
    }

    // Get all responses
    const responses = await db
      .select({
        id: freelancerOrderResponses.id,
        responseStatus: freelancerOrderResponses.responseStatus,
        responseTimeMinutes: freelancerOrderResponses.responseTimeMinutes,
        responseAt: freelancerOrderResponses.responseAt,
        rejectionReason: freelancerOrderResponses.rejectionReason,
        createdAt: freelancerOrderResponses.createdAt,
        jobId: freelancerOrderResponses.jobId,
        jobTitle: jobs.title,
        jobDisplayId: jobs.displayId,
      })
      .from(freelancerOrderResponses)
      .leftJoin(jobs, eq(freelancerOrderResponses.jobId, jobs.id))
      .where(and(...conditions))
      .orderBy(desc(freelancerOrderResponses.createdAt))
      .limit(100)
      .execute();

    // Calculate statistics
    const totalResponses = responses.length;
    const acceptedResponses = responses.filter(r => r.responseStatus === 'accepted');
    const rejectedResponses = responses.filter(r => r.responseStatus === 'rejected');
    
    const acceptanceRate = totalResponses > 0 
      ? Math.round((acceptedResponses.length / totalResponses) * 100) 
      : 0;

    // Calculate average response time (only for responses with valid time)
    const responsesWithTime = responses.filter(r => r.responseTimeMinutes != null && r.responseTimeMinutes > 0);
    const avgResponseTimeMinutes = responsesWithTime.length > 0
      ? Math.round(responsesWithTime.reduce((sum, r) => sum + (r.responseTimeMinutes || 0), 0) / responsesWithTime.length)
      : 0;

    // Format average response time
    const formatResponseTime = (minutes: number) => {
      if (minutes < 60) return `${minutes} min`;
      if (minutes < 1440) return `${Math.round(minutes / 60)} hrs`;
      return `${Math.round(minutes / 1440)} days`;
    };

    // Get rejection reasons breakdown
    const rejectionReasons = rejectedResponses.reduce((acc, r) => {
      const reason = r.rejectionReason || 'No reason provided';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Response time distribution
    const responseTimeDistribution = {
      under1Hour: responsesWithTime.filter(r => (r.responseTimeMinutes || 0) < 60).length,
      under4Hours: responsesWithTime.filter(r => (r.responseTimeMinutes || 0) >= 60 && (r.responseTimeMinutes || 0) < 240).length,
      under24Hours: responsesWithTime.filter(r => (r.responseTimeMinutes || 0) >= 240 && (r.responseTimeMinutes || 0) < 1440).length,
      over24Hours: responsesWithTime.filter(r => (r.responseTimeMinutes || 0) >= 1440).length,
    };

    // Get freelancer info
    const freelancer = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, freelancerId))
      .limit(1)
      .execute();

    return NextResponse.json({
      success: true,
      freelancer: freelancer[0] || { id: freelancerId, name: 'Unknown', email: '' },
      period,
      stats: {
        totalResponses,
        acceptedCount: acceptedResponses.length,
        rejectedCount: rejectedResponses.length,
        acceptanceRate,
        avgResponseTimeMinutes,
        avgResponseTimeFormatted: formatResponseTime(avgResponseTimeMinutes),
      },
      responseTimeDistribution,
      rejectionReasons,
      recentResponses: responses.slice(0, 10).map(r => ({
        id: r.id,
        jobId: r.jobId,
        jobTitle: r.jobTitle,
        jobDisplayId: r.jobDisplayId,
        status: r.responseStatus,
        responseTime: r.responseTimeMinutes ? formatResponseTime(r.responseTimeMinutes) : null,
        respondedAt: r.responseAt,
        createdAt: r.createdAt,
      })),
    });

  } catch (error) {
    console.error('Response stats GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response statistics' },
      { status: 500 }
    );
  }
}

