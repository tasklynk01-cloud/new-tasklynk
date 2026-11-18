import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, freelancerProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/freelancer/profile - Retrieve own specialist profile
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, user.id))
      .limit(1);

    // Fetch user details to get fresh approved status & avatar
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        name: userRecord?.name || user.name,
        email: userRecord?.email || user.email,
        approved: userRecord?.approved ?? false,
        avatarUrl: userRecord?.avatarUrl || userRecord?.profilePictureUrl || null,
        headline: profile?.profileHeadline || '',
        bio: profile?.bio || '',
        profileStatus: profile?.profileStatus || 'draft',
        publicSlug: profile?.publicSlug || '',
        education: profile?.education || [],
        experience: profile?.experience || [],
        portfolio: profile?.portfolioScreenshots || [],
        skills: profile?.skills || [],
        availability: profile?.availability || 'Available Now',
        reviewNotes: profile?.reviewNotes || null,
        publishedAt: profile?.publishedAt || null,
        isProfileComplete: profile?.isProfileComplete || false,
      },
    });
  } catch (error: any) {
    console.error('[Freelancer Profile GET] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/freelancer/profile - Update own specialist profile and make immediately visible
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;
    const body = await request.json();

    const {
      headline,
      bio,
      education,
      experience,
      portfolio,
      skills,
      availability,
      submitForReview,
      publishNow,
    } = body;

    // Check if user is an approved specialist in users table
    const [userRecord] = await db
      .select({ approved: users.approved, name: users.name })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const isApproved = userRecord?.approved === true;

    // Sanitize portfolio (max 3 items)
    const sanitizedPortfolio = Array.isArray(portfolio)
      ? portfolio.slice(0, 3).map((item: any) => ({
          title: String(item.title || '').trim(),
          role: String(item.role || '').trim(),
          description: String(item.description || '').trim(),
          imageUrl: item.imageUrl ? String(item.imageUrl).trim() : undefined,
          date: item.date ? String(item.date).trim() : undefined,
        }))
      : [];

    // Sanitize skills
    const sanitizedSkills = Array.isArray(skills)
      ? skills.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

    // Check if profile exists
    const [existing] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, user.id))
      .limit(1);

    // Auto-generate or maintain slug
    const baseSlug = (userRecord?.name || user.name || 'specialist')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const targetSlug = existing?.publicSlug || `${baseSlug}-${user.id}`;

    // If the user is approved, or if the profile is already published, or if publishNow is requested, publish immediately!
    let nextStatus = existing?.profileStatus || 'draft';
    if (isApproved || existing?.profileStatus === 'published' || publishNow) {
      nextStatus = 'published';
    } else if (submitForReview) {
      nextStatus = 'pending_review';
    }

    const isComplete = Boolean(
      headline && String(headline).trim().length > 5 &&
      bio && String(bio).trim().length > 20
    );

    const updatePayload: any = {
      profileHeadline: headline ? String(headline).trim() : null,
      bio: bio ? String(bio).trim() : null,
      skills: sanitizedSkills.length > 0 ? sanitizedSkills : (existing?.skills || []),
      availability: availability ? String(availability).trim() : (existing?.availability || 'Available Now'),
      education: Array.isArray(education) ? education : [],
      experience: Array.isArray(experience) ? experience : [],
      portfolioScreenshots: sanitizedPortfolio,
      publicSlug: targetSlug,
      profileStatus: nextStatus,
      isProfileComplete: isComplete,
      updatedAt: new Date().toISOString(),
      ...(nextStatus === 'published' && !existing?.publishedAt ? { publishedAt: new Date().toISOString() } : {}),
    };

    if (existing) {
      await db
        .update(freelancerProfiles)
        .set(updatePayload)
        .where(eq(freelancerProfiles.userId, user.id));
    } else {
      await db.insert(freelancerProfiles).values({
        userId: user.id,
        ...updatePayload,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: nextStatus === 'published'
        ? 'Profile updated and published live to your public directory page!'
        : 'Profile details saved successfully.',
      data: {
        profileStatus: nextStatus,
        publicSlug: targetSlug,
        publicUrl: `/professionals/${targetSlug}`,
      },
    });
  } catch (error: any) {
    console.error('[Freelancer Profile PUT] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 });
  }
}
