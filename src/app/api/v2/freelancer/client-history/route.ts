import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientFreelancerHistory, users, jobs } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/freelancer/client-history
 * Get freelancer's client relationship history - repeat clients, work history per client
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

    // Determine which freelancer's history to get
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

    // Get client-freelancer history records
    const history = await db
      .select({
        id: clientFreelancerHistory.id,
        clientId: clientFreelancerHistory.clientId,
        completedJobsCount: clientFreelancerHistory.completedJobsCount,
        lastWorkedAt: clientFreelancerHistory.lastWorkedAt,
        avgRating: clientFreelancerHistory.avgRating,
        createdAt: clientFreelancerHistory.createdAt,
        // Client info
        clientName: users.name,
        clientEmail: users.email,
        clientAvatar: users.profilePictureUrl,
      })
      .from(clientFreelancerHistory)
      .leftJoin(users, eq(clientFreelancerHistory.clientId, users.id))
      .where(eq(clientFreelancerHistory.freelancerId, freelancerId))
      .orderBy(desc(clientFreelancerHistory.completedJobsCount))
      .execute();

    // Calculate summary stats
    const totalClients = history.length;
    const repeatClients = history.filter(h => h.completedJobsCount > 1).length;
    const repeatClientRate = totalClients > 0 
      ? Math.round((repeatClients / totalClients) * 100) 
      : 0;
    const totalJobsFromHistory = history.reduce((sum, h) => sum + h.completedJobsCount, 0);
    const ratingEntries = history.filter((h) => typeof h.avgRating === 'number' && h.avgRating !== null);
    const avgRatingOverall = ratingEntries.length > 0
      ? ratingEntries.reduce((sum, h) => sum + (h.avgRating || 0), 0) / ratingEntries.length
      : null;

    // Get top repeat clients (more than 2 jobs)
    const topRepeatClients = history
      .filter(h => h.completedJobsCount >= 2)
      .slice(0, 5)
      .map(h => ({
        clientId: h.clientId,
        clientName: h.clientName || 'Unknown Client',
        jobsCompleted: h.completedJobsCount,
        avgRating: h.avgRating,
        lastWorkedAt: h.lastWorkedAt,
      }));

    // Get recent jobs with clients for more context
    const recentJobs = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        title: jobs.title,
        status: jobs.status,
        completedAt: jobs.completedAt,
        clientId: jobs.clientId,
        clientName: users.name,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.clientId, users.id))
      .where(and(
        eq(jobs.assignedFreelancerId, freelancerId),
        eq(jobs.status, 'completed')
      ))
      .orderBy(desc(jobs.completedAt))
      .limit(10)
      .execute();

    // Get freelancer info
    const freelancer = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, freelancerId))
      .limit(1)
      .execute();

    return NextResponse.json({
      success: true,
      freelancer: freelancer[0] || { id: freelancerId, name: 'Unknown' },
      summary: {
        totalClients,
        repeatClients,
        repeatClientRate,
        totalJobsCompleted: totalJobsFromHistory,
        avgRating: avgRatingOverall !== null ? parseFloat(avgRatingOverall.toFixed(1)) : null,
      },
      topRepeatClients,
      allClients: history.map(h => ({
        clientId: h.clientId,
        clientName: h.clientName || 'Unknown Client',
        clientEmail: h.clientEmail,
        clientAvatar: h.clientAvatar,
        jobsCompleted: h.completedJobsCount,
        avgRating: h.avgRating,
        lastWorkedAt: h.lastWorkedAt,
        firstWorkedAt: h.createdAt,
        isRepeatClient: h.completedJobsCount > 1,
      })),
      recentCompletedJobs: recentJobs.map(j => ({
        id: j.id,
        displayId: j.displayId,
        title: j.title,
        clientId: j.clientId,
        clientName: j.clientName,
        completedAt: j.completedAt,
      })),
    });

  } catch (error) {
    console.error('Client history GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client history' },
      { status: 500 }
    );
  }
}

