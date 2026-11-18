import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, editorProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/editor/profile
 * Retrieves editor profile data
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['editor', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { searchParams } = new URL(request.url);
    const editorId = searchParams.get('editorId');

    // Determine which editor ID to use
    let editorIdInt: number;
    if (editorId) {
      editorIdInt = parseInt(editorId);
      if (isNaN(editorIdInt)) {
        return NextResponse.json(
          { error: 'Editor ID must be a valid integer' },
          { status: 400 }
        );
      }
      // Editors can only view their own profile; admin/manager can view any
      if (user.role === 'editor' && user.id !== editorIdInt) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only view your own profile' },
          { status: 403 }
        );
      }
    } else {
      // If no editorId provided, use authenticated user's ID (must be editor)
      if (user.role !== 'editor') {
        return NextResponse.json(
          { error: 'Editor ID is required for admin/manager access' },
          { status: 400 }
        );
      }
      editorIdInt = user.id;
    }

    // Verify editor exists and has editor role
    const editor = await db.select()
      .from(users)
      .where(eq(users.id, editorIdInt))
      .limit(1);

    if (editor.length === 0 || editor[0].role !== 'editor') {
      return NextResponse.json(
        { error: 'Not authorized: Editor access required' },
        { status: 403 }
      );
    }

    // Get editor profile
    const profile = await db.select()
      .from(editorProfiles)
      .where(eq(editorProfiles.userId, editorIdInt))
      .limit(1);

    return NextResponse.json({
      editor: {
        id: editor[0].id,
        name: editor[0].name,
        email: editor[0].email,
        phone: editor[0].phone,
        displayId: editor[0].displayId,
      },
      profile: profile.length > 0 ? profile[0] : null,
    });

  } catch (error) {
    console.error('Editor profile GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editor profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/editor/profile
 * Updates or creates editor profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['editor', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const body = await request.json();
    const { 
      editorId, 
      specialization, 
      yearsExperience, 
      languages, 
      qualifications, 
      areasOfExpertise 
    } = body;

    // Determine target editor ID
    let editorIdInt: number;
    if (editorId) {
      editorIdInt = parseInt(editorId);
      if (isNaN(editorIdInt)) {
        return NextResponse.json(
          { error: 'Editor ID must be a valid integer' },
          { status: 400 }
        );
      }
      // Editors can only update their own profile; admin can update any
      if (user.role === 'editor' && user.id !== editorIdInt) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only update your own profile' },
          { status: 403 }
        );
      }
    } else {
      // If no editorId provided, use authenticated user's ID (must be editor)
      if (user.role !== 'editor') {
        return NextResponse.json(
          { error: 'Editor ID is required for admin access' },
          { status: 400 }
        );
      }
      editorIdInt = user.id;
    }

    // Verify editor exists and has editor role
    const editor = await db.select()
      .from(users)
      .where(eq(users.id, editorIdInt))
      .limit(1);

    if (editor.length === 0 || editor[0].role !== 'editor') {
      return NextResponse.json(
        { error: 'Not authorized: Editor access required' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // Check if profile exists
    const existingProfile = await db.select()
      .from(editorProfiles)
      .where(eq(editorProfiles.userId, editorIdInt))
      .limit(1);

    // Determine if profile is complete
    const isComplete = !!(
      specialization && 
      yearsExperience !== null && 
      languages && 
      qualifications && 
      areasOfExpertise
    );

    if (existingProfile.length > 0) {
      // Update existing profile
      await db.update(editorProfiles)
        .set({
          specialization,
          yearsExperience,
          languages,
          qualifications,
          areasOfExpertise,
          isProfileComplete: isComplete,
          updatedAt: now,
        })
        .where(eq(editorProfiles.userId, editorIdInt));
    } else {
      // Create new profile
      await db.insert(editorProfiles).values({
        userId: editorIdInt,
        specialization,
        yearsExperience,
        languages,
        qualifications,
        areasOfExpertise,
        averageEditsPerOrder: 0,
        ordersTouched: 0,
        clientSatisfactionRate: 0,
        isProfileComplete: isComplete,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Fetch updated profile
    const updatedProfile = await db.select()
      .from(editorProfiles)
      .where(eq(editorProfiles.userId, editorIdInt))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile[0],
    });

  } catch (error) {
    console.error('Editor profile PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update editor profile' },
      { status: 500 }
    );
  }
}

