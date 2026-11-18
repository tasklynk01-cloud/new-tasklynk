import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/editors
 * Get list of available editors for assignment
 * Accessible by: admin, manager
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Get all editors (roleId = 5)
    const editors = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        rating: users.rating,
        completedJobs: users.completedJobs,
        status: users.status,
        approved: users.approved,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.roleId, 5),
          eq(users.approved, true),
          inArray(users.status, ['active', 'approved'])
        )
      );

    return NextResponse.json({ 
      editors,
      total: editors.length
    });
  } catch (error) {
    console.error('Failed to fetch editors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editors' },
      { status: 500 }
    );
  }
}

