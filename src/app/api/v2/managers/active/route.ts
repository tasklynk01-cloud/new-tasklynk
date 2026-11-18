import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

/**
 * GET /api/v2/managers/active
 * Get list of online managers with contact information
 * 
 * MIGRATED: Now uses users.presenceStatus instead of deprecated managerOnlineStatus table
 */
export async function GET(request: NextRequest) {
  try {
    // Get online managers using the presenceStatus field on users table
    const onlineManagers = await db
      .select({
        managerId: users.id,
        managerName: users.name,
        managerEmail: users.email,
        managerPhone: users.phone,
        presenceStatus: users.presenceStatus,
        lastSeenAt: users.lastLoginAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'manager'),
          eq(users.approved, true),
          or(
            eq(users.presenceStatus, 'online'),
            eq(users.presenceStatus, 'away')
          )
        )
      );

    return NextResponse.json({
      success: true,
      managers: onlineManagers,
      total: onlineManagers.length,
    });
  } catch (error: any) {
    console.error('Error fetching active managers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active managers', details: error?.message },
      { status: 500 }
    );
  }
}

