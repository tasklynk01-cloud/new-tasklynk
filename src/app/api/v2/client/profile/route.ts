import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { clientProfiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/client/profile
 * Fetch client extended profile
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    
    // Get userId from query params (for admin/manager viewing other profiles) or use authenticated user
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    
    // Determine which profile to fetch
    let profileUserId = user.id;
    if (targetUserId) {
      const requestedUserId = parseInt(targetUserId);
      // Allow clients to view their own profile via userId param
      // Only admin/manager can view OTHER users' profiles
      if (requestedUserId !== user.id && user.role !== 'admin' && user.role !== 'manager') {
        return NextResponse.json({ error: 'Unauthorized to view other profiles' }, { status: 403 });
      }
      profileUserId = requestedUserId;
    }

    // Fetch client profile
    const profile = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.userId, profileUserId),
    });

    if (!profile) {
      return NextResponse.json({ 
        profile: null,
        message: 'Profile not found. Please create one.' 
      }, { status: 200 });
    }

    // Parse JSON fields
    const profileData = {
      ...profile,
      billingAddress: profile.billingAddress || null,
      shippingAddress: profile.shippingAddress || null,
    };

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * POST /api/v2/client/profile
 * Create new client extended profile
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const body = await request.json();

    // Check if profile already exists
    const existingProfile = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.userId, user.id),
    });

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists. Use PUT to update.' }, { status: 400 });
    }

    // Validate required fields
    const { companyName, industry, website, taxId, businessRegistration, billingAddress, shippingAddress, preferredPaymentMethod, automatePayments } = body;

    // Create profile
    const now = new Date().toISOString();
    const [newProfile] = await db.insert(clientProfiles).values({
      userId: user.id,
      companyName: companyName || null,
      industry: industry || null,
      website: website || null,
      taxId: taxId || null,
      businessRegistration: businessRegistration || null,
      billingAddress: billingAddress || null,
      shippingAddress: shippingAddress || null,
      preferredPaymentMethod: preferredPaymentMethod || null,
      automatePayments: automatePayments || false,
      totalJobsPosted: 0,
      totalSpent: 0,
      recurringClientDiscount: 0,
      isProfileComplete: !!(companyName && industry && billingAddress),
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      profile: {
        ...newProfile,
        billingAddress: newProfile.billingAddress || null,
        shippingAddress: newProfile.shippingAddress || null,
      },
      message: 'Profile created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}

/**
 * PUT /api/v2/client/profile
 * Update client extended profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    const body = await request.json();

    // Get userId from body (for admin updating other profiles) or use authenticated user
    const targetUserId = body.userId || user.id;
    
    // If updating another user's profile, must be admin
    if (targetUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to update other profiles' }, { status: 403 });
    }

    // Check if profile exists
    const existingProfile = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.userId, targetUserId),
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found. Create one first.' }, { status: 404 });
    }

    // Extract fields
    const { 
      companyName, 
      industry, 
      website, 
      taxId, 
      businessRegistration, 
      billingAddress, 
      shippingAddress, 
      preferredPaymentMethod, 
      automatePayments,
      recurringClientDiscount // Admin only
    } = body;

    const billingAddressValue = billingAddress !== undefined ? billingAddress : existingProfile.billingAddress;
    const shippingAddressValue = shippingAddress !== undefined ? shippingAddress : existingProfile.shippingAddress;

    // Determine if profile is complete
    const isComplete = !!(
      (companyName || existingProfile.companyName) &&
      (industry || existingProfile.industry) &&
      (billingAddressValue || existingProfile.billingAddress)
    );

    // Build update object
    const updateData: any = {
      companyName: companyName !== undefined ? companyName : existingProfile.companyName,
      industry: industry !== undefined ? industry : existingProfile.industry,
      website: website !== undefined ? website : existingProfile.website,
      taxId: taxId !== undefined ? taxId : existingProfile.taxId,
      businessRegistration: businessRegistration !== undefined ? businessRegistration : existingProfile.businessRegistration,
      billingAddress: billingAddressValue,
      shippingAddress: shippingAddressValue,
      preferredPaymentMethod: preferredPaymentMethod !== undefined ? preferredPaymentMethod : existingProfile.preferredPaymentMethod,
      automatePayments: automatePayments !== undefined ? automatePayments : existingProfile.automatePayments,
      isProfileComplete: isComplete,
      updatedAt: new Date().toISOString(),
    };

    // Admin can update discount
    if (user.role === 'admin' && recurringClientDiscount !== undefined) {
      updateData.recurringClientDiscount = recurringClientDiscount;
    }

    // Update profile
    const [updatedProfile] = await db
      .update(clientProfiles)
      .set(updateData)
      .where(eq(clientProfiles.userId, targetUserId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      profile: {
        ...updatedProfile,
        billingAddress: updatedProfile.billingAddress || null,
        shippingAddress: updatedProfile.shippingAddress || null,
      },
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

