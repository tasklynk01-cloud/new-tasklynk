import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { getRequestSession } from '@/lib/session';

/**
 * GET /api/v2/presence
 * Get online users list with optional role filter
 * 
 * Query params:
 * - role: 'client' | 'freelancer' | 'manager' | 'admin' | 'all'
 * - status: 'online' | 'away' | 'busy' | 'offline' | 'all'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'online';

    const conditions = [];

    // Role filter
    if (roleFilter !== 'all') {
      conditions.push(eq(users.role, roleFilter));
    }

    // Status filter
    if (statusFilter === 'online') {
      conditions.push(eq(users.presenceStatus, 'online'));
    } else if (statusFilter === 'active') {
      conditions.push(
        or(
          eq(users.presenceStatus, 'online'),
          eq(users.presenceStatus, 'away')
        )
      );
    } else if (statusFilter !== 'all') {
      conditions.push(eq(users.presenceStatus, statusFilter));
    }

    const onlineUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        presenceStatus: users.presenceStatus,
        lastLoginAt: users.lastLoginAt,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Group by role for stats
    const stats = {
      online: 0,
      away: 0,
      busy: 0,
      offline: 0,
      byRole: {} as Record<string, number>,
    };

    onlineUsers.forEach((u) => {
      const status = u.presenceStatus as keyof typeof stats;
      if (status in stats && typeof stats[status] === 'number') {
        (stats as any)[status]++;
      }
      stats.byRole[u.role] = (stats.byRole[u.role] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      users: onlineUsers,
      total: onlineUsers.length,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching presence data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presence data', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/presence
 * Update current user's presence status
 * 
 * Body:
 * - status: 'online' | 'away' | 'busy' | 'offline'
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: online, away, busy, offline' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await db
      .update(users)
      .set({
        presenceStatus: status,
        lastLoginAt: status === 'online' ? now : undefined,
      })
      .where(eq(users.id, session.userId));

    return NextResponse.json({
      success: true,
      status,
      updatedAt: now,
    });
  } catch (error: any) {
    console.error('Error updating presence:', error);
    return NextResponse.json(
      { error: 'Failed to update presence', details: error?.message },
      { status: 500 }
    );
  }
}

