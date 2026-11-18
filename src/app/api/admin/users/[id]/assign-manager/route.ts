import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * PATCH /api/admin/users/[id]/assign-manager
 * Assign or reassign a manager to a user (client, freelancer, account_owner)
 * 
 * Body: { managerId: number | null }
 * 
 * Security: Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin role
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { managerId } = body;

    // Validate managerId (can be null to unassign, or a valid manager ID)
    if (managerId !== null && managerId !== undefined) {
      const managerIdInt = parseInt(managerId);
      if (isNaN(managerIdInt)) {
        return NextResponse.json(
          { error: 'Invalid manager ID', code: 'INVALID_MANAGER_ID' },
          { status: 400 }
        );
      }

      // Verify that the manager exists and has role='manager'
      const [manager] = await db.select()
        .from(users)
        .where(and(
          eq(users.id, managerIdInt),
          eq(users.role, 'manager')
        ))
        .limit(1);

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found or user is not a manager', code: 'MANAGER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Verify that the manager is approved
      if (!manager.approved) {
        return NextResponse.json(
          { error: 'Manager is not approved', code: 'MANAGER_NOT_APPROVED' },
          { status: 403 }
        );
      }
    }

    // Get the user to assign manager to
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only allow assignment to client, freelancer, account_owner roles
    const allowedRoles = ['client', 'freelancer', 'account_owner'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: `Cannot assign manager to role: ${user.role}. Allowed roles: ${allowedRoles.join(', ')}`, code: 'INVALID_USER_ROLE' },
        { status: 400 }
      );
    }

    // Update user with assigned manager
    const now = new Date().toISOString();
    await db.update(users)
      .set({
        assignedManagerId: managerId === null ? null : parseInt(managerId),
        updatedAt: now
      })
      .where(eq(users.id, userId));

    // Fetch updated user
    const [updatedUser] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      message: managerId === null 
        ? `Manager unassigned from ${user.name}` 
        : `Manager assigned to ${user.name}`,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('PATCH assign manager error:', error);
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
 * GET /api/admin/users/[id]/assign-manager
 * Get current manager assignment for a user
 * 
 * Security: Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require admin role
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Get user with manager details
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    let managerDetails = null;
    if (user.assignedManagerId) {
      const [manager] = await db.select()
        .from(users)
        .where(eq(users.id, user.assignedManagerId))
        .limit(1);
      
      if (manager) {
        const { password, ...managerWithoutPassword } = manager;
        managerDetails = managerWithoutPassword;
      }
    }

    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      assignedManager: managerDetails
    });

  } catch (error) {
    console.error('GET manager assignment error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
