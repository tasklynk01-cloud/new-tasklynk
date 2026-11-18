import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/users/[id]/toggle-approval
 * Toggle user approval status
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

    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Toggle approval status
    const newApprovalStatus = !user.approved;

    await db
      .update(users)
      .set({
        approved: newApprovalStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    console.log('[Admin] User approval toggled:', {
      userId,
      userEmail: user.email,
      previousStatus: user.approved,
      newStatus: newApprovalStatus,
      toggledBy: authCheck.user.id,
    });

    return NextResponse.json({
      success: true,
      message: `User ${newApprovalStatus ? 'approved' : 'unapproved'} successfully`,
      approved: newApprovalStatus,
    });

  } catch (error) {
    console.error('Failed to toggle user approval:', error);
    return NextResponse.json(
      { error: 'Failed to toggle user approval' },
      { status: 500 }
    );
  }
}