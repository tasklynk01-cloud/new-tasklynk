import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/managers/status
 * Update manager online/offline status using users.presenceStatus (unified presence)
 * Body:
 *   - managerId: ID of the manager
 *   - isOnline: boolean indicating online status
 * 
 * MIGRATION: Now uses users.presenceStatus instead of deprecated managerOnlineStatus table
 */
export async function POST(request: NextRequest) {
  try {
    const { managerId, isOnline } = await request.json();

    if (!managerId || isOnline === undefined) {
      return NextResponse.json(
        { error: 'managerId and isOnline are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update user's presence status in the unified users table
    await db
      .update(users)
      .set({
        presenceStatus: isOnline ? 'online' : 'offline',
        updatedAt: now,
      })
      .where(eq(users.id, parseInt(managerId)));

    return NextResponse.json({
      success: true,
      status: {
        managerId: parseInt(managerId),
        isOnline,
        lastSeenAt: now,
      },
    });
  } catch (error) {
    console.error('Error updating manager status:', error);
    return NextResponse.json(
      { error: 'Failed to update manager status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/managers/status
 * Get manager online status
 * Query params:
 *   - managerId: ID of the manager
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');

    if (!managerId) {
      return NextResponse.json(
        { error: 'managerId is required' },
        { status: 400 }
      );
    }

    // Get user's presence status from users table
    const [user] = await db
      .select({
        id: users.id,
        presenceStatus: users.presenceStatus,
        lastSeenAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, parseInt(managerId)));

    if (!user) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      managerId: user.id,
      isOnline: user.presenceStatus === 'online',
      presenceStatus: user.presenceStatus,
      lastSeenAt: user.lastSeenAt,
    });
  } catch (error) {
    console.error('Error fetching manager status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

