import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, ratings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// GET /api/v2/freelancers/[id]/tier-progress - Get freelancer stats for tier calculation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['freelancer', 'manager', 'admin', 'editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resolvedParams = await params;
    const freelancerId = parseInt(resolvedParams.id);

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { error: 'Invalid freelancer ID' },
        { status: 400 }
      );
    }

    if (authCheck.user.role === 'freelancer' && authCheck.user.id !== freelancerId) {
      return NextResponse.json(
        { error: 'You can only view your own tier progress' },
        { status: 403 }
      );
    }

    // Verify user is a freelancer
    const [freelancer] = await db
      .select()
      .from(users)
      .where(eq(users.id, freelancerId))
      .limit(1);

    if (!freelancer || freelancer.role !== 'freelancer') {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    const assignedJobs = await db
      .select({ status: jobs.status })
      .from(jobs)
      .where(eq(jobs.assignedFreelancerId, freelancerId));

    const completedStatuses = new Set(['completed', 'approved', 'paid', 'delivered']);
    const successfulJobs = assignedJobs.filter(job => completedStatuses.has(job.status || ''));
    const jobsCompleted = successfulJobs.length;
    const totalAssigned = assignedJobs.length;
    const successRate = totalAssigned > 0 ? successfulJobs.length / totalAssigned : 0;

    const freelancerRatings = await db
      .select({ score: ratings.rating })
      .from(ratings)
      .where(eq(ratings.ratedUserId, freelancerId));

    const totalRatings = freelancerRatings.length;
    const averageRating = totalRatings > 0
      ? freelancerRatings.reduce((sum, r) => sum + (r.score || 0), 0) / totalRatings
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        jobsCompleted,
        averageRating: parseFloat(averageRating.toFixed(2)),
        successRate: parseFloat(successRate.toFixed(2)),
        totalAssigned,
        totalRatings,
      }
    });
  } catch (error) {
    console.error('Error fetching freelancer tier progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier progress' },
      { status: 500 }
    );
  }
}
