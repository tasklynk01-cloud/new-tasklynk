import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/v2/freelancers/status
 * Update freelancer online status using users.presenceStatus (unified presence)
 * Body:
 *   - freelancerId: ID of the freelancer
 *   - isOnline: boolean indicating if they're online
 * 
 * MIGRATION: Now uses users.presenceStatus instead of deprecated freelancerOnlineStatus table
 */
export async function POST(request: NextRequest) {
  try {
    const { freelancerId, isOnline } = await request.json();

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 }
      );
    }

    // Count current active jobs for the freelancer
    const activeJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.assignedFreelancerId, freelancerId),
          eq(jobs.status, 'in_progress')
        )
      );

    const now = new Date().toISOString();

    // Update user's presence status in the unified users table
    await db
      .update(users)
      .set({
        presenceStatus: isOnline ? 'online' : 'offline',
        updatedAt: now,
      })
      .where(eq(users.id, freelancerId));

    return NextResponse.json({
      success: true,
      message: isOnline ? 'Marked as online' : 'Marked as offline',
      activeJobsCount: activeJobs.length,
    });
  } catch (error) {
    console.error('Error updating freelancer status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/freelancers/status
 * Get freelancer online status
 * Query params:
 *   - freelancerId: ID of the freelancer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get('freelancerId');

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 }
      );
    }

    // Get user's presence status from users table
    const [user] = await db
      .select({
        id: users.id,
        presenceStatus: users.presenceStatus,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, parseInt(freelancerId)));

    if (!user) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Count current active jobs
    const activeJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.assignedFreelancerId, parseInt(freelancerId)),
          eq(jobs.status, 'in_progress')
        )
      );

    return NextResponse.json({
      freelancerId: user.id,
      isOnline: user.presenceStatus === 'online',
      presenceStatus: user.presenceStatus,
      lastSeenAt: user.updatedAt,
      activeJobsCount: activeJobs.length,
    });
  } catch (error) {
    console.error('Error fetching freelancer status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

