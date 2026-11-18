import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { PROFILE_ACCESS_ROLES, updateUserProfile } from '@/lib/user-profile-service';

/**
 * PATCH /api/user/update-profile
 * Update authenticated user's own profile (name, phone, profile picture)
 * Email changes are NOT allowed for security reasons
 */
export async function PATCH(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, PROFILE_ACCESS_ROLES);
    if (authCheck.error || !authCheck.user?.id) {
      return NextResponse.json(
        {
          error: authCheck.error || 'Unauthorized - Please login',
          code: 'UNAUTHORIZED'
        },
        { status: authCheck.status || 401 }
      );
    }

    const userId = authCheck.user.id;

    // Parse request body
    const body = await request.json();
    const result = await updateUserProfile(userId, body);

    if ('error' in result) {
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
        },
        { status: result.error.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: result.user
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

