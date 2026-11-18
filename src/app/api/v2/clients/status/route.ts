import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/clients/status
 * Update client online/offline status using users.presenceStatus (unified presence)
 * Body:
 *   - clientId: ID of the client
 *   - isOnline: boolean indicating online status
 * 
 * MIGRATION: Now uses users.presenceStatus instead of deprecated clientOnlineStatus table
 */
export async function POST(request: NextRequest) {
  try {
    const { clientId, isOnline } = await request.json();

    if (!clientId || isOnline === undefined) {
      return NextResponse.json(
        { error: 'clientId and isOnline are required' },
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
      .where(eq(users.id, parseInt(clientId)));

    return NextResponse.json({
      success: true,
      status: {
        clientId: parseInt(clientId),
        isOnline,
        lastSeenAt: now,
      },
    });
  } catch (error) {
    console.error('Error updating client status:', error);
    return NextResponse.json(
      { error: 'Failed to update client status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/clients/status
 * Get client online status
 * Query params:
 *   - clientId: ID of the client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
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
      .where(eq(users.id, parseInt(clientId)));

    if (!user) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      clientId: user.id,
      isOnline: user.presenceStatus === 'online',
      presenceStatus: user.presenceStatus,
      lastSeenAt: user.lastSeenAt,
    });
  } catch (error) {
    console.error('Error fetching client status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

