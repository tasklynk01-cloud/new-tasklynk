import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerProfiles, users, writerTiers } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v2/freelancer-profiles/[id] - Get freelancer profile
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get profile with tier info
    const [profile] = await db
      .select({
        id: freelancerProfiles.id,
        userId: freelancerProfiles.userId,
        currentTierId: freelancerProfiles.currentTierId,
        bio: freelancerProfiles.bio,
        skills: freelancerProfiles.skills,
        certifications: freelancerProfiles.certifications,
        portfolio: freelancerProfiles.portfolio,
        hourlyRate: freelancerProfiles.hourlyRate,
        languages: freelancerProfiles.languages,
        timezone: freelancerProfiles.timezone,
        availability: freelancerProfiles.availability,
        availableDays: freelancerProfiles.availableDays,
        availableTimeStart: freelancerProfiles.availableTimeStart,
        availableTimeEnd: freelancerProfiles.availableTimeEnd,
        responseTime: freelancerProfiles.responseTime,
        totalClients: freelancerProfiles.totalClients,
        repeatClientRate: freelancerProfiles.repeatClientRate,
        jobsCompleted: freelancerProfiles.jobsCompleted,
        isProfileComplete: freelancerProfiles.isProfileComplete,
        createdAt: freelancerProfiles.createdAt,
        updatedAt: freelancerProfiles.updatedAt,
        tierName: writerTiers.name,
        tierColor: writerTiers.color,
        tierIcon: writerTiers.icon,
      })
      .from(freelancerProfiles)
      .leftJoin(writerTiers, eq(freelancerProfiles.currentTierId, writerTiers.id))
      .where(eq(freelancerProfiles.userId, userId))
      .limit(1);

    // Get user info
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        displayId: users.displayId,
        rating: users.rating,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: profile ? {
        ...profile,
        skills: profile.skills || [],
        certifications: profile.certifications || [],
        portfolio: profile.portfolio || [],
        languages: profile.languages || [],
        availableDays: profile.availableDays || [],
      } : null,
      user,
    });
  } catch (error) {
    console.error('Error fetching freelancer profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freelancer profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/freelancer-profiles/[id] - Update freelancer profile
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Authenticate - allow freelancer to update own profile, or admin
    const authCheck = await requireRole(request, ['admin', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Freelancers can only update their own profile
    if (authCheck.user?.role === 'freelancer' && authCheck.user?.id !== userId) {
      return NextResponse.json(
        { error: 'You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const now = new Date().toISOString();

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId))
      .limit(1);

    const updateData: any = {
      updatedAt: now,
    };

    // Handle each field
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.skills !== undefined) updateData.skills = body.skills;
    if (body.certifications !== undefined) updateData.certifications = body.certifications;
    if (body.portfolio !== undefined) updateData.portfolio = body.portfolio;
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;
    if (body.languages !== undefined) updateData.languages = body.languages;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.availability !== undefined) updateData.availability = body.availability;
    if (body.availableDays !== undefined) updateData.availableDays = body.availableDays;
    if (body.availableTimeStart !== undefined) updateData.availableTimeStart = body.availableTimeStart;
    if (body.availableTimeEnd !== undefined) updateData.availableTimeEnd = body.availableTimeEnd;
    if (body.responseTime !== undefined) updateData.responseTime = body.responseTime;
    if (body.currentTierId !== undefined) updateData.currentTierId = body.currentTierId;

    // Calculate profile completeness
    const isComplete = !!(
      body.bio &&
      body.skills?.length > 0 &&
      body.languages?.length > 0 &&
      body.timezone &&
      body.availability
    );
    updateData.isProfileComplete = isComplete;

    let result;
    if (existingProfile) {
      // Update existing profile
      [result] = await db
        .update(freelancerProfiles)
        .set(updateData)
        .where(eq(freelancerProfiles.userId, userId))
        .returning();
    } else {
      // Create new profile
      [result] = await db
        .insert(freelancerProfiles)
        .values({
          userId,
          ...updateData,
          createdAt: now,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      profile: result,
      message: existingProfile ? 'Profile updated' : 'Profile created',
    });
  } catch (error) {
    console.error('Error updating freelancer profile:', error);
    return NextResponse.json(
      { error: 'Failed to update freelancer profile' },
      { status: 500 }
    );
  }
}
