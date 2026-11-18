import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerProfiles, users, freelancerSubjectMap, subjects } from '@/db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/freelancer-profiles
 * Get all freelancer profiles (admin/manager) or single profile (freelancer)
 * Query params:
 * - userId: Filter by user ID
 * - search: Search by bio, skills
 * - page, limit: Pagination
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { searchParams } = new URL(request.url);
    
    // Freelancers can only see their own profile
    let userId = searchParams.get('userId');
    if (user.role === 'freelancer') {
      userId = String(user.id);
    }

    // If fetching single profile
    if (userId) {
      const [profile] = await db
        .select({
          id: freelancerProfiles.id,
          userId: freelancerProfiles.userId,
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
          // User info
          userName: users.name,
          userEmail: users.email,
          userPhone: users.phone,
        })
        .from(freelancerProfiles)
        .leftJoin(users, eq(freelancerProfiles.userId, users.id))
        .where(eq(freelancerProfiles.userId, parseInt(userId)))
        .limit(1);

      // Get subjects
      const userSubjects = await db
        .select({
          subjectId: freelancerSubjectMap.subjectId,
          subjectName: subjects.name,
          categoryId: subjects.categoryId,
        })
        .from(freelancerSubjectMap)
        .leftJoin(subjects, eq(freelancerSubjectMap.subjectId, subjects.id))
        .where(eq(freelancerSubjectMap.freelancerId, parseInt(userId)));

      if (!profile) {
        // Profile doesn't exist yet - return empty profile with subjects
        return NextResponse.json({
          profile: null,
          subjects: userSubjects,
          message: 'Profile not created yet',
        });
      }

      return NextResponse.json({ 
        profile,
        subjects: userSubjects,
      });
    }

    // Admin/Manager: Get all profiles with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          like(freelancerProfiles.bio, `%${search}%`),
          like(freelancerProfiles.skills, `%${search}%`),
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(freelancerProfiles)
      .leftJoin(users, eq(freelancerProfiles.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get profiles
    const profiles = await db
      .select({
        id: freelancerProfiles.id,
        userId: freelancerProfiles.userId,
        bio: freelancerProfiles.bio,
        skills: freelancerProfiles.skills,
        availability: freelancerProfiles.availability,
        jobsCompleted: freelancerProfiles.jobsCompleted,
        repeatClientRate: freelancerProfiles.repeatClientRate,
        isProfileComplete: freelancerProfiles.isProfileComplete,
        createdAt: freelancerProfiles.createdAt,
        // User info
        userName: users.name,
        userEmail: users.email,
        userApproved: users.approved,
      })
      .from(freelancerProfiles)
      .leftJoin(users, eq(freelancerProfiles.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(freelancerProfiles.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching freelancer profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freelancer profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/freelancer-profiles
 * Create or update freelancer profile
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const body = await request.json();
    
    // Determine userId - freelancers can only update their own profile
    let targetUserId = body.userId;
    if (user.role === 'freelancer') {
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, targetUserId))
      .limit(1);

    const profileData = {
      bio: body.bio || null,
      skills: body.skills || null,
      certifications: body.certifications || null,
      portfolio: body.portfolio || null,
      hourlyRate: body.hourlyRate || null,
      languages: body.languages || null,
      timezone: body.timezone || null,
      availability: body.availability || 'part-time',
      availableDays: body.availableDays || null,
      availableTimeStart: body.availableTimeStart || null,
      availableTimeEnd: body.availableTimeEnd || null,
      responseTime: body.responseTime || null,
      updatedAt: now,
    };

    // Check if profile is complete
    const isComplete = !!(
      profileData.bio &&
      profileData.skills &&
      profileData.availability
    );

    if (existingProfile) {
      // Update existing profile
      await db
        .update(freelancerProfiles)
        .set({
          ...profileData,
          isProfileComplete: isComplete,
        })
        .where(eq(freelancerProfiles.id, existingProfile.id));

      return NextResponse.json({
        message: 'Profile updated successfully',
        profileId: existingProfile.id,
      });
    } else {
      // Create new profile
      const result = await db.insert(freelancerProfiles).values({
        userId: targetUserId,
        ...profileData,
        totalClients: 0,
        repeatClientRate: 0,
        jobsCompleted: 0,
        isProfileComplete: isComplete,
        createdAt: now,
      }).returning({ id: freelancerProfiles.id });

      return NextResponse.json({
        message: 'Profile created successfully',
        profileId: result[0].id,
      });
    }
  } catch (error: any) {
    console.error('Error saving freelancer profile:', error);
    return NextResponse.json(
      { error: 'Failed to save freelancer profile' },
      { status: 500 }
    );
  }
}

