import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

/**
 * GET /api/v2/freelancers/active
 * Get count and list of currently active/online freelancers with contact info
 * 
 * MIGRATED: Now uses users.presenceStatus instead of deprecated freelancerOnlineStatus table
 */
export async function GET(request: NextRequest) {
  try {
    // Get online freelancers using the presenceStatus field on users table
    const onlineFreelancers = await db
      .select({
        freelancerId: users.id,
        freelancerName: users.name,
        freelancerEmail: users.email,
        freelancerPhone: users.phone,
        freelancerRating: users.rating,
        completedJobs: users.completedJobs,
        presenceStatus: users.presenceStatus,
        lastSeenAt: users.lastLoginAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'freelancer'),
          eq(users.approved, true),
          or(
            eq(users.presenceStatus, 'online'),
            eq(users.presenceStatus, 'away')
          )
        )
      );

    return NextResponse.json({
      success: true,
      activeCount: onlineFreelancers.length,
      freelancers: onlineFreelancers,
    });
  } catch (error: any) {
    console.error('Error fetching active freelancers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active freelancers', details: error?.message },
      { status: 500 }
    );
  }
}

