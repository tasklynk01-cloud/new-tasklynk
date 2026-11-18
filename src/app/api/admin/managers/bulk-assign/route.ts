import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/admin/managers/bulk-assign
 * Bulk assign users to a manager
 * 
 * Body: { 
 *   managerId: number,
 *   userIds: number[]
 * }
 * 
 * Security: Admin only
 */
export async function POST(request: NextRequest) {
  // Require admin role
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { managerId, userIds } = body;

    // Validate inputs
    if (!managerId || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Manager ID and user IDs array required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const managerIdInt = parseInt(managerId);
    if (isNaN(managerIdInt)) {
      return NextResponse.json(
        { error: 'Invalid manager ID', code: 'INVALID_MANAGER_ID' },
        { status: 400 }
      );
    }

    // Verify manager exists and is approved
    const [manager] = await db.select()
      .from(users)
      .where(and(
        eq(users.id, managerIdInt),
        eq(users.role, 'manager')
      ))
      .limit(1);

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found', code: 'MANAGER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!manager.approved) {
      return NextResponse.json(
        { error: 'Manager is not approved', code: 'MANAGER_NOT_APPROVED' },
        { status: 403 }
      );
    }

    // Parse user IDs
    const userIdsInt = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (userIdsInt.length === 0) {
      return NextResponse.json(
        { error: 'No valid user IDs provided', code: 'NO_VALID_IDS' },
        { status: 400 }
      );
    }

    // Get users to assign
    const usersToAssign = await db.select()
      .from(users)
      .where(inArray(users.id, userIdsInt));

    // Filter only allowed roles
    const allowedRoles = ['client', 'freelancer', 'account_owner'];
    const validUsers = usersToAssign.filter(u => allowedRoles.includes(u.role));

    if (validUsers.length === 0) {
      return NextResponse.json(
        { error: 'No users with valid roles found (client, freelancer, account_owner)', code: 'NO_VALID_USERS' },
        { status: 400 }
      );
    }

    // Bulk update users
    const now = new Date().toISOString();
    const validUserIds = validUsers.map(u => u.id);

    await db.update(users)
      .set({
        assignedManagerId: managerIdInt,
        updatedAt: now
      })
      .where(inArray(users.id, validUserIds));

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${validUsers.length} user(s) to manager ${manager.name}`,
      assignedCount: validUsers.length,
      skippedCount: userIdsInt.length - validUsers.length,
      managerId: managerIdInt,
      managerName: manager.name
    });

  } catch (error) {
    console.error('POST bulk assign manager error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/managers/bulk-assign
 * Get list of all managers for assignment
 * 
 * Security: Admin only
 */
export async function GET(request: NextRequest) {
  // Require admin role
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    // Get all approved managers
    const managers = await db.select()
      .from(users)
      .where(and(
        eq(users.role, 'manager'),
        eq(users.approved, true)
      ));

    // Get assignment counts for each manager
    const managersWithCounts = await Promise.all(
      managers.map(async (manager) => {
        const assignedUsers = await db.select()
          .from(users)
          .where(eq(users.assignedManagerId, manager.id));

        const clients = assignedUsers.filter(u => u.role === 'client' || u.role === 'account_owner');
        const freelancers = assignedUsers.filter(u => u.role === 'freelancer');

        const { password, ...managerWithoutPassword } = manager;

        return {
          ...managerWithoutPassword,
          assignedClientsCount: clients.length,
          assignedFreelancersCount: freelancers.length,
          totalAssignedCount: assignedUsers.length
        };
      })
    );

    return NextResponse.json({
      managers: managersWithCounts,
      totalManagers: managersWithCounts.length
    });

  } catch (error) {
    console.error('GET managers list error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

