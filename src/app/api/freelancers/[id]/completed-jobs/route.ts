import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/freelancers/[id]/completed-jobs
 * Get the count of completed jobs for a freelancer
 * Used for CPP tier calculation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const freelancerId = parseInt(id);

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { error: 'Invalid freelancer ID' },
        { status: 400 }
      );
    }

    // Get freelancer
    const [freelancer] = await db
      .select()
      .from(users)
      .where(eq(users.id, freelancerId));

    if (!freelancer) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Count completed jobs from database
    // Jobs are considered completed when status is 'completed' or 'paid'
    const completedJobsFromDB = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(
        and(
          eq(jobs.assignedFreelancerId, freelancerId),
          inArray(jobs.status, ['completed', 'paid'])
        )
      );

    const completedCount = completedJobsFromDB.length;

    // Also return the value from user profile as fallback
    const completedJobsFromProfile = freelancer.completedJobs ?? 0;

    // Use the higher of the two values
    const finalCompletedJobs = Math.max(completedCount, completedJobsFromProfile);

    return NextResponse.json({
      success: true,
      freelancerId,
      completedJobs: finalCompletedJobs,
      fromDatabase: completedCount,
      fromProfile: completedJobsFromProfile,
    });
  } catch (error: any) {
    console.error('❌ Error fetching completed jobs:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch completed jobs',
        completedJobs: 0 // Fallback to 0 to prevent CPP calculation errors
      },
      { status: 500 }
    );
  }
}
