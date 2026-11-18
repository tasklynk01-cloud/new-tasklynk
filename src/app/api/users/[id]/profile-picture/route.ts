import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { PROFILE_ACCESS_ROLES, buildUserProfile, canEditUserProfile, canViewUserProfile, updateUserProfile } from '@/lib/user-profile-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, PROFILE_ACCESS_ROLES);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized' },
        { status: authCheck.status || 401 }
      );
    }

    const { id } = await context.params;
    
    // Validate ID parameter
    const userId = parseInt(id);
    if (!id || isNaN(userId)) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    if (!canEditUserProfile(authCheck.user, userId)) {
      return NextResponse.json(
        {
          error: 'Forbidden: You can only update your own profile picture',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { imageData } = body;

    // Validate imageData is provided
    if (!imageData) {
      return NextResponse.json(
        { 
          error: 'Image data is required',
          code: 'MISSING_IMAGE_DATA'
        },
        { status: 400 }
      );
    }

    // Validate imageData is a non-empty string after trimming
    if (typeof imageData !== 'string' || imageData.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Image data cannot be empty',
          code: 'EMPTY_IMAGE_DATA'
        },
        { status: 400 }
      );
    }

    const result = await updateUserProfile(userId, { profilePictureUrl: imageData.trim() });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: result.error.status }
      );
    }

    return NextResponse.json(result.user, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, PROFILE_ACCESS_ROLES);
    if (authCheck.error || !authCheck.user) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized' },
        { status: authCheck.status || 401 }
      );
    }

    const { id } = await context.params;
    
    // Validate ID parameter
    const userId = parseInt(id);
    if (!id || isNaN(userId)) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    if (!canViewUserProfile(authCheck.user, userId)) {
      return NextResponse.json(
        {
          error: 'Forbidden: You can only view your own profile picture',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const profile = await buildUserProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: profile.id, profilePictureUrl: profile.profilePictureUrl }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}