import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/users/[id]/assign-manager
 * Assign a manager to a client or freelancer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate admin
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = parseInt(resolvedParams.id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Parse request body
    const { managerId } = await request.json();

    // Validate managerId (can be null to unassign)
    if (managerId !== null && managerId !== undefined) {
      const managerIdNum = parseInt(managerId);
      if (isNaN(managerIdNum)) {
        return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
      }

      // Verify the manager exists and has manager role
      const [manager] = await db
        .select()
        .from(users)
        .where(eq(users.id, managerIdNum))
        .limit(1);

      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }

      if (manager.role !== 'manager') {
        return NextResponse.json({ error: 'Selected user is not a manager' }, { status: 400 });
      }
    }

    // Fetch user to verify they exist
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is a client or freelancer
    if (!['client', 'account_owner', 'freelancer'].includes(user.role)) {
      return NextResponse.json({ 
        error: 'Only clients and freelancers can be assigned to managers' 
      }, { status: 400 });
    }

    // Update assigned manager
    await db
      .update(users)
      .set({
        assignedManagerId: managerId === null ? null : parseInt(managerId),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    console.log('[Admin] Manager assignment updated:', {
      userId,
      userEmail: user.email,
      userRole: user.role,
      previousManagerId: user.assignedManagerId,
      newManagerId: managerId,
      updatedBy: authCheck.user.id,
    });

    return NextResponse.json({
      success: true,
      message: managerId === null ? 'Manager unassigned successfully' : 'Manager assigned successfully',
      data: {
        userId,
        managerId,
      },
    });
  } catch (error) {
    console.error('Failed to assign manager:', error);
    return NextResponse.json(
      { error: 'Failed to assign manager' },
      { status: 500 }
    );
  }
}
