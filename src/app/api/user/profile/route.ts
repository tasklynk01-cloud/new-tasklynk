import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { PROFILE_ACCESS_ROLES, buildUserProfile, canEditUserProfile, canViewUserProfile, updateUserProfile } from '@/lib/user-profile-service';

/**
 * GET /api/user/profile
 * Fetch complete user profile with ratings, badges, balance, statistics
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, PROFILE_ACCESS_ROLES);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized' },
        { status: authCheck.status || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);

    if (Number.isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    if (!canViewUserProfile(authCheck.user, parsedUserId)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own profile' },
        { status: 403 }
      );
    }

    const profile = await buildUserProfile(parsedUserId);

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update user profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, PROFILE_ACCESS_ROLES);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized' },
        { status: authCheck.status || 401 }
      );
    }

    const body = await request.json();
    const { userId, name, avatar, profilePictureUrl } = body;

    const parsedUserId = userId ? parseInt(String(userId)) : authCheck.user.id;

    if (Number.isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: 'Valid user ID required' },
        { status: 400 }
      );
    }

    if (!canEditUserProfile(authCheck.user, parsedUserId)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own profile' },
        { status: 403 }
      );
    }

    const result = await updateUserProfile(parsedUserId, { name, avatar, profilePictureUrl });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: result.error.status }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

