import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { PROFILE_ACCESS_ROLES, buildUserProfile, canEditUserProfile, canViewUserProfile, updateUserProfile } from '@/lib/user-profile-service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireRole(request, PROFILE_ACCESS_ROLES);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json({ error: authCheck.error || 'Unauthorized' }, { status: authCheck.status || 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id, 10);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (!canViewUserProfile(authCheck.user, userId)) {
      return NextResponse.json({ error: 'Forbidden: You can only view your own profile' }, { status: 403 });
    }

    const profile = await buildUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching v2 user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authCheck = await requireRole(request, PROFILE_ACCESS_ROLES);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json({ error: authCheck.error || 'Unauthorized' }, { status: authCheck.status || 401 });
    }

    const { id } = await context.params;
    const userId = parseInt(id, 10);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID', code: 'INVALID_ID' }, { status: 400 });
    }

    if (!canEditUserProfile(authCheck.user, userId)) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own profile' }, { status: 403 });
    }

    const body = await request.json();
    const result = await updateUserProfile(userId, body);

    if ('error' in result) {
      return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: result.error.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.user,
    });
  } catch (error) {
    console.error('Error updating v2 user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}