import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerInvitations, invitations, users, managers, editorProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ROLE_ID_MAP } from '@/lib/role-map';
import bcrypt from 'bcryptjs';

// Helper: generate a unique manager displayId with retries
async function generateUniqueManagerDisplayId(): Promise<string> {
  // Use the standard display ID generator for consistency
  const { generateUserDisplayId } = await import('@/app/api/utils/generate-display-id/route');
  try {
    return await generateUserDisplayId('manager');
  } catch (error) {
    // Fallback: Try up to 10 times to avoid rare collisions
    for (let i = 0; i < 10; i++) {
      const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      const displayId = `MGR#${suffix}`;
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.displayId, displayId));
      if (!existing) return displayId;
    }
    // Last resort: timestamp-based id
    const ts = Date.now().toString().slice(-6);
    return `MGR#${ts}`;
  }
}

// Helper: generate a unique editor displayId with retries
async function generateUniqueEditorDisplayId(): Promise<string> {
  // Use the standard display ID generator for consistency
  const { generateUserDisplayId } = await import('@/app/api/utils/generate-display-id/route');
  try {
    return await generateUserDisplayId('editor');
  } catch (error) {
    // Fallback: Try up to 10 times to avoid rare collisions
    for (let i = 0; i < 10; i++) {
      const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      const displayId = `ED-${suffix}`;
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.displayId, displayId));
      if (!existing) return displayId;
    }
    // Last resort: timestamp-based id
    const ts = Date.now().toString().slice(-6);
    return `ED-${ts}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, fullName, phoneNumber } = body;


    if (!token || !password || !fullName) {
      return NextResponse.json({ 
        error: 'Token, password, and full name are required' 
      }, { status: 400 });
    }

    // Try to find invitation in new unified invitations table first
    let invitation: any = null;
    let invitationType: 'unified' | 'legacy' = 'unified';
    
    const [unifiedInvitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));

    if (unifiedInvitation) {
      invitation = unifiedInvitation;
    } else {
      // Fall back to legacy managerInvitations table (now also used for editor invitations)
      const [legacyInvitation] = await db
        .select()
        .from(managerInvitations)
        .where(eq(managerInvitations.token, token));
      
      if (legacyInvitation) {
        // Use the role from the invitation, default to 'manager' only if not set
        invitation = { ...legacyInvitation, role: legacyInvitation.role || 'manager' };
        invitationType = 'legacy';
      }
    }

    if (!invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation link' 
      }, { status: 404 });
    }

    // ✅ CRITICAL FIX: Check if already used
    if (invitation.used) {
      return NextResponse.json({ 
        error: 'This invitation link has already been used' 
      }, { status: 400 });
    }

    // ✅ CRITICAL FIX: Check if expired
    if (invitation.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(invitation.expiresAt);
      
      if (now > expiryDate) {
        // Mark as expired in appropriate database table
        if (invitationType === 'unified') {
          await db
            .update(invitations)
            .set({ status: 'expired' })
            .where(eq(invitations.id, invitation.id));
        } else {
          await db
            .update(managerInvitations)
            .set({ status: 'expired' })
            .where(eq(managerInvitations.id, invitation.id));
        }
        
        return NextResponse.json({ 
          error: 'This invitation link has expired',
          expiresAt: invitation.expiresAt
        }, { status: 400 });
      }
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email));

    if (existingUser) {
      return NextResponse.json({ 
        error: 'A user account already exists with this email' 
      }, { status: 400 });
    }

    // Determine role from invitation
    const isEditor = invitation.role === 'editor';
    const role = isEditor ? 'editor' : 'manager';
    const roleId = ROLE_ID_MAP[role] ?? ROLE_ID_MAP.manager;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date().toISOString();
    const displayId = isEditor 
      ? await generateUniqueEditorDisplayId()
      : await generateUniqueManagerDisplayId();
    const phoneValue = (phoneNumber ?? '').toString() || '';


    let newUser:
      | { id: number; email: string; name: string; role: string; displayId: string }
      | undefined;

    try {
      // Create user with appropriate role - Use Drizzle ORM to match schema exactly
      const insertResult = await db.insert(users).values([{
        displayId,
        email: invitation.email,
        password: hashedPassword,
        name: fullName,
        role,
        roleId,
        phone: phoneValue || '0000000000',
        approved: true,
        emailVerified: true,
        status: 'approved',
        balance: 0,
        earned: 0,
        totalEarnings: 0,
        ratingAverage: 0,
        ratingCount: 0,
        badgeList: '[]',
        presenceStatus: 'offline',
        paymentTerms: 'pod',
        totalEarned: 0,
        totalSpent: 0,
        completedJobs: 0,
        loginCount: 0,
        clientTier: 'basic',
        clientPriority: 'regular',
        createdAt: now,
        updatedAt: now,
      }]).returning();


      // Get the created user from insert result
      if (insertResult && insertResult.length > 0) {
        newUser = {
          id: insertResult[0].id,
          email: insertResult[0].email,
          name: insertResult[0].name,
          role: insertResult[0].role,
          displayId: insertResult[0].displayId,
        };
      } else {
        // Fallback: Fetch if returning didn't work
        const [fetched] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            displayId: users.displayId,
          })
          .from(users)
          .where(eq(users.email, invitation.email));

        if (fetched) {
          newUser = fetched as any;
        }
      }
    } catch (insertError: any) {
      console.error('❌ Manager registration insert failed:', {
        error: insertError,
        message: insertError?.message,
        code: insertError?.code,
        cause: insertError?.cause,
        sqlState: insertError?.sqlState,
        errno: insertError?.errno,
        stack: insertError?.stack,
        email: invitation.email,
        displayId,
      });
      
      // Provide user-friendly error messages
      let userFriendlyError = 'Account creation failed. Please try again.';
      const errorMessage = insertError?.message || '';
      
      if (errorMessage.includes('UNIQUE constraint') || errorMessage.includes('duplicate')) {
        if (errorMessage.includes('email')) {
          userFriendlyError = 'An account with this email already exists. Please log in instead.';
        } else if (errorMessage.includes('display_id') || errorMessage.includes('displayId')) {
          userFriendlyError = 'Display ID conflict. Please try again.';
        } else if (errorMessage.includes('phone')) {
          userFriendlyError = 'This phone number is already registered. Please use a different number.';
        }
      } else if (errorMessage.includes('NOT NULL constraint')) {
        userFriendlyError = 'Missing required information. Please fill all required fields.';
      } else if (errorMessage.includes('no such column')) {
        userFriendlyError = 'Database schema error. Please contact support.';
      }
      
      return NextResponse.json({
        error: userFriendlyError,
        code: 'REGISTRATION_FAILED',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, { status: 500 });
    }

    if (!newUser) {
      return NextResponse.json({
        error: 'Account creation failed: User record not found after insert',
      }, { status: 500 });
    }


    // Create role-specific profile with correct schema columns
    try {
      if (isEditor) {
        const [existingProfile] = await db
          .select({ id: editorProfiles.id })
          .from(editorProfiles)
          .where(eq(editorProfiles.userId, newUser.id));

        if (!existingProfile) {
          // Create editor profile using actual schema columns
          await db.insert(editorProfiles).values({
            userId: newUser.id,
            specialization: null,
            yearsExperience: null,
            languages: '[]',
            qualifications: '[]',
            areasOfExpertise: '[]',
            averageEditsPerOrder: 0,
            ordersTouched: 0,
            clientSatisfactionRate: 0,
            isProfileComplete: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      } else {
        const [existingProfile] = await db
          .select({ id: managers.id })
          .from(managers)
          .where(eq(managers.userId, newUser.id));
        
        if (!existingProfile) {
          // Create manager profile using actual schema columns (userId, phone, balance, totalEarnings, status)
          await db.insert(managers).values({
            userId: newUser.id,
            phone: phoneValue || null,
            balance: 0,
            totalEarnings: 0,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    } catch (profileErr) {
      console.error(`Failed to create ${role} profile:`, profileErr);
      // Do not fail the entire request if profile creation fails
    }

    // Mark invitation as used in appropriate table
    if (invitationType === 'unified') {
      await db
        .update(invitations)
        .set({
          used: true,
          usedAt: now,
          status: 'used',
        })
        .where(eq(invitations.id, invitation.id));
    } else {
      await db
        .update(managerInvitations)
        .set({
          used: true,
          usedAt: now,
          status: 'used',
        })
        .where(eq(managerInvitations.id, invitation.id));
    }


    return NextResponse.json({
      success: true,
      message: `${isEditor ? 'Editor' : 'Manager'} account created successfully! You can now log in.`,
      user: newUser,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to complete registration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

