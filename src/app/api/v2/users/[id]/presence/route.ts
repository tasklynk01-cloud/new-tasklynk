import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/users/[id]/presence
 * Get presence status of a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        presenceStatus: users.presenceStatus,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user should be marked as offline based on last activity
    // If lastLoginAt is more than 5 minutes ago, consider them offline
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
    const isActive = lastLogin && lastLogin > fiveMinutesAgo;

    const actualStatus = isActive && user.presenceStatus === 'online' ? 'online' : 'offline';

    // If status changed, update in database
    if (actualStatus !== user.presenceStatus) {
      await db
        .update(users)
        .set({ presenceStatus: actualStatus })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      name: user.name,
      presenceStatus: actualStatus,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    console.error('Error fetching user presence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presence status' },
      { status: 500 }
    );
  }
}
