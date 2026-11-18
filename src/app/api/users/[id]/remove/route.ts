import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await context.params;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Check if user exists before attempting to delete
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Delete user from database
    const deletedUser = await db.delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to delete user',
          code: 'DELETE_FAILED'
        },
        { status: 500 }
      );
    }

    // 📝 AUDIT: Log admin action (log before returning deleted info)
    await logAdminActionWithRequest(
      request,
      authCheck.user!.id,
      AdminActions.DELETE_USER,
      userId,
      AuditTargetTypes.USER,
      {
        deletedUserEmail: existingUser[0].email,
        deletedUserName: existingUser[0].name,
        deletedUserRole: existingUser[0].role,
      }
    );

    // Return success message with deleted user info (exclude password)
    const { password, ...userInfo } = deletedUser[0];

    return NextResponse.json(
      {
        message: 'User removed successfully',
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          role: userInfo.role
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}