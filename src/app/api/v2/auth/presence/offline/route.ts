import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/admin-auth';

/**
 * POST /api/v2/auth/presence/offline
 * Set user presence status to 'offline'
 * Called on logout
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

    // Update presence status to offline
    await db
      .update(users)
      .set({
        presenceStatus: 'offline',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      presenceStatus: 'offline',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating offline presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence status' },
      { status: 500 }
    );
  }
}

