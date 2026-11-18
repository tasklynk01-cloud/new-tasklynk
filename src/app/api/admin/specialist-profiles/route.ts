import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, freelancerProfiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/specialist-profiles - List specialist profiles for review
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';

    let query = db
      .select({
        profileId: freelancerProfiles.id,
        userId: freelancerProfiles.userId,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        headline: freelancerProfiles.profileHeadline,
        bio: freelancerProfiles.bio,
        profileStatus: freelancerProfiles.profileStatus,
        publicSlug: freelancerProfiles.publicSlug,
        education: freelancerProfiles.education,
        experience: freelancerProfiles.experience,
        portfolio: freelancerProfiles.portfolioScreenshots,
        reviewNotes: freelancerProfiles.reviewNotes,
        publishedAt: freelancerProfiles.publishedAt,
        reviewedBy: freelancerProfiles.reviewedBy,
        skills: freelancerProfiles.skills,
        updatedAt: freelancerProfiles.updatedAt,
      })
      .from(freelancerProfiles)
      .leftJoin(users, eq(freelancerProfiles.userId, users.id))
      .orderBy(desc(freelancerProfiles.updatedAt));

    const records = await query;

    const filtered = statusFilter === 'all'
      ? records
      : records.filter((r) => r.profileStatus === statusFilter);

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error: any) {
    console.error('[Admin Specialist Profiles GET] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch profiles' }, { status: 500 });
  }
}

// POST /api/admin/specialist-profiles - Evaluate profile (approve, request_changes, reject, unpublish)
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const admin = authCheck.user!;

    const body = await request.json();
    const { userId, action, reviewNotes, customSlug } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const [userRecord] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let nextStatus = profile.profileStatus || 'draft';
    let publishedAt = profile.publishedAt;

    // Generate clean slug if approving and currently empty
    let slug = customSlug || profile.publicSlug;
    if (!slug) {
      slug = (userRecord?.name || 'specialist')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      slug = `${slug}-${userId}`;
    }

    if (action === 'approve') {
      nextStatus = 'published';
      publishedAt = new Date().toISOString();
    } else if (action === 'request_changes') {
      nextStatus = 'changes_requested';
    } else if (action === 'reject') {
      nextStatus = 'rejected';
    } else if (action === 'unpublish') {
      nextStatus = 'draft';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await db
      .update(freelancerProfiles)
      .set({
        profileStatus: nextStatus,
        publicSlug: slug,
        publishedAt: action === 'approve' ? publishedAt : profile.publishedAt,
        reviewedBy: admin.id,
        reviewNotes: reviewNotes || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(freelancerProfiles.userId, userId));

    return NextResponse.json({
      success: true,
      message: `Specialist profile updated to ${nextStatus}`,
      data: {
        userId,
        profileStatus: nextStatus,
        publicSlug: slug,
      },
    });
  } catch (error: any) {
    console.error('[Admin Specialist Profiles POST] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to evaluate profile' }, { status: 500 });
  }
}
