import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/users/online
 * Get online users by role
 * Query params:
 *   - role: 'freelancer', 'client', 'manager', 'all' (admin only)
 * 
 * Returns list of online users with their presence status
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin or manager role
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role') || 'all';
    const currentUser = authCheck.user;

    // Build base query
    const baseQuery = db
      .select({
        id: users.id,
        displayId: users.displayId,
        name: users.name,
        email: users.email,
        role: users.role,
        presenceStatus: users.presenceStatus,
        lastLoginAt: users.lastLoginAt,
        balance: users.balance,
        rating: users.rating,
        completedJobs: users.completedJobs,
        freelancerBadge: users.freelancerBadge,
        clientTier: users.clientTier,
        phone: users.phone,
        updatedAt: users.updatedAt,
      })
      .from(users);

    // Apply role filtering in a single WHERE (Drizzle doesn't support chaining `where()` here)
    const conditions = [
      eq(users.approved, true),
      eq(users.presenceStatus, 'online'),
    ];

    if (!(roleFilter === 'all' && currentUser.role === 'admin')) {
      if (roleFilter === 'freelancer') {
        conditions.push(eq(users.role, 'freelancer'));
      } else if (roleFilter === 'client') {
        conditions.push(inArray(users.role, ['client', 'account_owner']));
      } else if (roleFilter === 'manager') {
        conditions.push(eq(users.role, 'manager'));
      } else if (currentUser.role === 'manager') {
        // Default: managers can see freelancers + clients
        conditions.push(inArray(users.role, ['freelancer', 'client', 'account_owner']));
      }
    }

    const results = await baseQuery.where(and(...conditions));

    // Calculate "last seen" time ago
    const now = new Date();
    const onlineUsers = results.map((user) => {
      let lastSeenText = 'Just now';
      
      if (user.updatedAt) {
        const lastUpdate = new Date(user.updatedAt);
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
          lastSeenText = 'Just now';
        } else if (diffMins < 60) {
          lastSeenText = `${diffMins}m ago`;
        } else {
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) {
            lastSeenText = `${diffHours}h ago`;
          } else {
            const diffDays = Math.floor(diffHours / 24);
            lastSeenText = `${diffDays}d ago`;
          }
        }
      }

      return {
        ...user,
        lastSeenText,
        isOnline: user.presenceStatus === 'online',
      };
    });

    return NextResponse.json({
      success: true,
      count: onlineUsers.length,
      users: onlineUsers,
      role: roleFilter,
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/users/online
 * Update user's online status
 * Body:
 *   - userId: ID of the user
 *   - isOnline: boolean indicating if they're online
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, isOnline } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update user's presence status
    await db
      .update(users)
      .set({
        presenceStatus: isOnline ? 'online' : 'offline',
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: isOnline ? 'Marked as online' : 'Marked as offline',
    });
  } catch (error) {
    console.error('Error updating user online status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

