import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/admin-auth';

/**
 * POST /api/v2/auth/presence/online
 * Set user presence status to 'online'
 * Called on login and periodic heartbeat
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update presence status to online and set lastLoginAt timestamp
    await db
      .update(users)
      .set({
        presenceStatus: 'online',
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      presenceStatus: 'online',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating online presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/auth/presence/online
 * Heartbeat endpoint - keeps user marked as online
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update last activity timestamp
    await db
      .update(users)
      .set({
        presenceStatus: 'online',
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      presenceStatus: 'online',
      userId: user.id,
    });
  } catch (error) {
    console.error('Error in presence heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}

