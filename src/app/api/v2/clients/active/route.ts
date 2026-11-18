import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/clients/active
 * Get list of online clients with contact information
 * 
 * MIGRATED: Now uses users.presenceStatus instead of deprecated clientOnlineStatus table
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Get online clients using the presenceStatus field on users table
    const onlineClients = await db
      .select({
        clientId: users.id,
        clientName: users.name,
        clientEmail: users.email,
        clientPhone: users.phone,
        presenceStatus: users.presenceStatus,
        lastSeenAt: users.lastLoginAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'client'),
          eq(users.approved, true),
          or(
            eq(users.presenceStatus, 'online'),
            eq(users.presenceStatus, 'away')
          )
        )
      );

    return NextResponse.json({
      success: true,
      clients: onlineClients,
      total: onlineClients.length,
    });
  } catch (error: any) {
    console.error('Error fetching active clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active clients', details: error?.message },
      { status: 500 }
    );
  }
}

