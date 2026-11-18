import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientProfiles, users } from '@/db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/client-profiles
 * Get all client profiles (admin/manager) or single profile (client)
 * Query params:
 * - userId: Filter by user ID
 * - search: Search by company name, industry
 * - page, limit: Pagination
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const { searchParams } = new URL(request.url);
    
    // Clients can only see their own profile
    let userId = searchParams.get('userId');
    if (user.role === 'client' || user.role === 'account_owner') {
      userId = String(user.id);
    }

    // If fetching single profile
    if (userId) {
      const [profile] = await db
        .select({
          id: clientProfiles.id,
          userId: clientProfiles.userId,
          companyName: clientProfiles.companyName,
          industry: clientProfiles.industry,
          website: clientProfiles.website,
          taxId: clientProfiles.taxId,
          businessRegistration: clientProfiles.businessRegistration,
          billingAddress: clientProfiles.billingAddress,
          shippingAddress: clientProfiles.shippingAddress,
          preferredPaymentMethod: clientProfiles.preferredPaymentMethod,
          automatePayments: clientProfiles.automatePayments,
          totalJobsPosted: clientProfiles.totalJobsPosted,
          totalSpent: clientProfiles.totalSpent,
          recurringClientDiscount: clientProfiles.recurringClientDiscount,
          isProfileComplete: clientProfiles.isProfileComplete,
          createdAt: clientProfiles.createdAt,
          updatedAt: clientProfiles.updatedAt,
          // User info
          userName: users.name,
          userEmail: users.email,
          userPhone: users.phone,
        })
        .from(clientProfiles)
        .leftJoin(users, eq(clientProfiles.userId, users.id))
        .where(eq(clientProfiles.userId, parseInt(userId)))
        .limit(1);

      if (!profile) {
        // Profile doesn't exist yet - return empty profile
        return NextResponse.json({
          profile: null,
          message: 'Profile not created yet',
        });
      }

      return NextResponse.json({ profile });
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
          like(clientProfiles.companyName, `%${search}%`),
          like(clientProfiles.industry, `%${search}%`),
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(clientProfiles)
      .leftJoin(users, eq(clientProfiles.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Get profiles
    const profiles = await db
      .select({
        id: clientProfiles.id,
        userId: clientProfiles.userId,
        companyName: clientProfiles.companyName,
        industry: clientProfiles.industry,
        website: clientProfiles.website,
        totalJobsPosted: clientProfiles.totalJobsPosted,
        totalSpent: clientProfiles.totalSpent,
        isProfileComplete: clientProfiles.isProfileComplete,
        createdAt: clientProfiles.createdAt,
        // User info
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        userApproved: users.approved,
      })
      .from(clientProfiles)
      .leftJoin(users, eq(clientProfiles.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(clientProfiles.createdAt))
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
    console.error('Error fetching client profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/client-profiles
 * Create or update client profile
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const body = await request.json();
    
    // Determine userId - clients can only update their own profile
    let targetUserId = body.userId;
    if (user.role === 'client' || user.role === 'account_owner') {
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(clientProfiles)
      .where(eq(clientProfiles.userId, targetUserId))
      .limit(1);

    const profileData = {
      companyName: body.companyName || null,
      industry: body.industry || null,
      website: body.website || null,
      taxId: body.taxId || null,
      businessRegistration: body.businessRegistration || null,
      billingAddress: body.billingAddress ? JSON.stringify(body.billingAddress) : null,
      shippingAddress: body.shippingAddress ? JSON.stringify(body.shippingAddress) : null,
      preferredPaymentMethod: body.preferredPaymentMethod || null,
      automatePayments: body.automatePayments === true,
      recurringClientDiscount: body.recurringClientDiscount || 0,
      updatedAt: now,
    };

    // Check if profile is complete
    const isComplete = !!(
      profileData.companyName &&
      profileData.industry &&
      profileData.billingAddress
    );

    if (existingProfile) {
      // Update existing profile
      await db
        .update(clientProfiles)
        .set({
          ...profileData,
          isProfileComplete: isComplete,
        })
        .where(eq(clientProfiles.id, existingProfile.id));

      return NextResponse.json({
        message: 'Profile updated successfully',
        profileId: existingProfile.id,
      });
    } else {
      // Create new profile
      const result = await db.insert(clientProfiles).values({
        userId: targetUserId,
        ...profileData,
        totalJobsPosted: 0,
        totalSpent: 0,
        isProfileComplete: isComplete,
        createdAt: now,
      }).returning({ id: clientProfiles.id });

      return NextResponse.json({
        message: 'Profile created successfully',
        profileId: result[0].id,
      });
    }
  } catch (error: any) {
    console.error('Error saving client profile:', error);
    return NextResponse.json(
      { error: 'Failed to save client profile' },
      { status: 500 }
    );
  }
}

