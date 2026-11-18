import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { pendingRegistrations, users, freelancerSubjectMap, freelancerProfiles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendEmailToAdmins, getNewUserRegistrationAdminHTML, sendEmail, getAccountOwnerWelcomeHTML, getAccountRegistrationReceivedHTML } from '@/lib/email';
import { generateUserDisplayId } from '@/app/api/utils/generate-display-id/route';
import { getRoleId } from '@/lib/role-map';
import { generateSessionToken, createSessionResponse, type SessionData, type UserRole } from '@/lib/session';
import { buildSessionUserData, type DbUserRecord } from '@/lib/session-user-data';
import { strictRateLimiter, applyRateLimit } from '@/lib/rate-limit';

// `users.phone` is UNIQUE. Older pending registrations may still carry the
// legacy hardcoded placeholder ("+254700000000") that every phone-less
// signup used to share - inserting a second one collides and blows up the
// verification insert with a generic 500. Swap in a fresh unique value.
const LEGACY_PLACEHOLDER_PHONE = '+254700000000';
function resolveUniquePhone(pendingPhone: string | null | undefined): string {
  if (pendingPhone && pendingPhone !== LEGACY_PLACEHOLDER_PHONE) return pendingPhone;
  return `+000${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export async function POST(request: NextRequest) {
  console.log('🔵 [Verify Code] Request received at:', new Date().toISOString());

  let body;
  try {
    body = await request.json();
    console.log('[Verify Code] Request body parsed successfully:', {
      hasEmail: !!body.email,
      hasCode: !!body.code,
      hasSubjectIds: !!body.subjectIds,
      hasAvailabilityDays: !!body.availabilityDays
    });
  } catch (parseError) {
    console.error('❌ [Verify Code] Failed to parse request body:', parseError);
    return NextResponse.json({
      error: 'Invalid request body',
      code: 'INVALID_REQUEST'
    }, { status: 400 });
  }

  // Rate limiting: prevent brute-force code guessing, scoped per-account
  // (email) rather than per-IP so verifying one account doesn't lock out
  // verification attempts for other accounts on the same machine.
  const rateLimitResponse = await applyRateLimit(request, strictRateLimiter, body?.email);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, code, subjectIds, availabilityDays } = body; // Accept subjectIds and availabilityDays from request body

    // Check database connection
    if (!db) {
      console.error('❌ [Verify Code] Database not initialized');
      return NextResponse.json({ 
        error: 'Database connection error',
        code: 'DATABASE_ERROR'
      }, { status: 503 });
    }

    // Validation
    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.log('[Verify Code] Validation failed: Missing email');
      return NextResponse.json({ error: 'Email is required', code: 'MISSING_EMAIL' }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      console.log('[Verify Code] Validation failed: Missing code');
      return NextResponse.json({ error: 'Verification code is required', code: 'MISSING_CODE' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();
    
    console.log('[Verify Code] Processing verification for:', { email: normalizedEmail, codeLength: normalizedCode.length });

    // 🧹 Clean up expired pending registrations (background task, don't await)
    const currentTimestamp = new Date().toISOString();
    db.delete(pendingRegistrations)
      .where(sql`${pendingRegistrations.codeExpiresAt} < ${currentTimestamp}`)
      .then(result => console.log('[Verify Code] Cleaned up expired pending registrations'))
      .catch(err => console.error('[Verify Code] Failed to clean expired registrations:', err));

    // Find pending registration
    console.log('[Verify Code] Querying pending registrations table...');
    
    let pendingList;
    try {
      pendingList = await db
        .select()
        .from(pendingRegistrations)
        .where(eq(pendingRegistrations.email, normalizedEmail));
      console.log('[Verify Code] Pending registrations found:', pendingList.length);
    } catch (dbError: any) {
      console.error('❌ [Verify Code] Database query failed:', {
        error: dbError,
        message: dbError?.message,
        code: dbError?.code,
        stack: dbError?.stack
      });
      return NextResponse.json({ 
        error: 'Database query failed',
        details: dbError?.message || 'Unknown database error',
        code: 'DATABASE_QUERY_ERROR'
      }, { status: 500 });
    }

    if (pendingList.length === 0) {
      console.log('[Verify Code] No pending registration found for:', normalizedEmail);
      return NextResponse.json({ error: 'Invalid or expired verification code', code: 'INVALID_CODE' }, { status: 400 });
    }

    const pending = pendingList[0];
    console.log('[Verify Code] Found pending registration:', { 
      email: pending.email, 
      role: pending.role,
      hasCode: !!pending.verificationCode,
      expiresAt: pending.codeExpiresAt
    });

    // Verify the code matches and hasn't expired
    if (pending.verificationCode !== normalizedCode) {
      return NextResponse.json({ error: 'Invalid verification code', code: 'INVALID_CODE' }, { status: 400 });
    }

    if (new Date(pending.codeExpiresAt) < new Date()) {
      console.log('[Verify Code] Code expired:', { email: normalizedEmail, expiresAt: pending.codeExpiresAt });
      return NextResponse.json({ error: 'Verification code has expired', code: 'EXPIRED_CODE' }, { status: 400 });
    }

    console.log('[Verify Code] Verification code validated successfully for:', normalizedEmail);

    // Correct code — clear this account's failed-attempt bucket
    strictRateLimiter.resetForRequest(request, normalizedEmail);

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      await db.delete(pendingRegistrations)
        .where(eq(pendingRegistrations.email, normalizedEmail));
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can now sign in.'
      }, { status: 200 });
    }

    const role = pending.role;
    const isAdmin = role === 'admin';
    const isClient = role === 'client' || role === 'account_owner';
    const roleId = getRoleId(role);

    // 🔴 UPDATED: Auto-approve clients and admins for immediate access.
    // Admin accounts: status = 'approved', approved = true (auto-approved)
    // Client accounts: status = 'approved', approved = true (auto-approved - can place orders immediately)
    // Other roles (freelancer, manager): status = 'pending', approved = false (need manual admin approval)
    const initialStatus = (isAdmin || isClient) ? 'approved' : 'pending';
    const isApproved = (isAdmin || isClient) ? true : false;
    const now = new Date().toISOString();

    let resolvedPhone = resolveUniquePhone(pending.phone);

    // generateUserDisplayId() picks the next ID via a plain SELECT MAX(...)+1
    // with no locking, so two verification requests racing (e.g. an impatient
    // re-click after a fast failure) can compute the identical display_id and
    // the second INSERT then dies on the unique constraint. Retry with a
    // freshly-generated ID a few times before giving up. A collision can also
    // land on `users_phone_unique` (e.g. two pending registrations resolved to
    // the same phone) - regenerating only the display_id would just repeat the
    // same failure forever, so detect which column collided and regenerate that one.
    const MAX_INSERT_ATTEMPTS = 3;
    let newUser: { id: number; displayId: string } | undefined;
    let lastInsertError: unknown;

    for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt++) {
      const displayId = await generateUserDisplayId(role);
      console.log('[Verify] Generated display ID (attempt', attempt, '):', displayId);

      try {
        const [inserted] = await db.insert(users).values([{
          displayId,
          email: normalizedEmail,
          password: pending.password,
          name: pending.name,
          phone: resolvedPhone,
          role,
          roleId,
          approved: isApproved,
          emailVerified: true,
          status: initialStatus,
          balance: 0,
          earned: 0,
          totalEarnings: 0,
          totalEarned: 0,
          totalSpent: 0,
          completedJobs: 0,
          loginCount: 0,
          ratingAverage: 0,
          ratingCount: 0,
          badgeList: '[]',
          presenceStatus: 'offline',
          clientTier: 'basic',
          clientPriority: 'regular',
          accountName: pending.accountName || null,
          paymentTerms: (role === 'client' || role === 'account_owner') ? 'pod' : 'pod',
          domainId: null,
          createdAt: now,
          updatedAt: now,
        }]).returning({ id: users.id, displayId: users.displayId });
        newUser = inserted;
        break;
      } catch (insertError: any) {
        lastInsertError = insertError;
        // Postgres unique_violation - retry with a fresh value for whichever
        // column actually collided. Any other error (or repeated collisions)
        // should surface immediately.
        const isUniqueViolation = insertError?.code === '23505' || insertError?.cause?.code === '23505';
        if (!isUniqueViolation || attempt === MAX_INSERT_ATTEMPTS) {
          throw insertError;
        }
        const collidedConstraint = insertError?.constraint || insertError?.cause?.constraint;
        if (collidedConstraint === 'users_phone_unique') {
          const staleResolvedPhone = resolvedPhone;
          resolvedPhone = resolveUniquePhone(null); // force a fresh random phone, ignoring the pending value
          console.warn('[Verify] Unique constraint collision on phone, retrying with a new phone', {
            attempt,
            collidedPhone: staleResolvedPhone,
          });
        } else {
          console.warn('[Verify] Unique constraint collision on insert, retrying with a new display ID', {
            attempt,
            collidedDisplayId: displayId,
            constraint: collidedConstraint,
          });
        }
      }
    }

    if (!newUser) {
      throw lastInsertError instanceof Error ? lastInsertError : new Error('Failed to create user after retries');
    }

    console.log('✅ [Verify Code] User created successfully:', {
      id: newUser.id, 
      displayId: newUser.displayId, 
      status: initialStatus, 
      approved: isApproved,
      role 
    });

    // 📚 Save freelancer's selected subjects if provided
    // NOTE: subjectIds is NOT stored in pending_registrations table
    // Subjects must be passed from the subject selection page via request body
    let subjectsToSave: number[] = [];
    
    if (role === 'freelancer') {
      // Get subjects from request body (passed from subject selection page)
      if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
        subjectsToSave = subjectIds;
      } else {
        console.warn('[Verify] No subjects provided for freelancer registration. Subject selection should happen before verification.');
      }
      
      // Save subjects if we have any
      if (subjectsToSave.length > 0) {
        try {
          const subjectValues = subjectsToSave.map((subjectId: number) => ({
            freelancerId: newUser.id,
            subjectId: subjectId,
            createdAt: now,
          }));
          
          await db.insert(freelancerSubjectMap).values(subjectValues);
          console.log('[Verify] Saved freelancer subjects:', {
            userId: newUser.id, 
            subjectCount: subjectsToSave.length 
          });
        } catch (subjectError) {
          console.error('[Verify] Failed to save freelancer subjects:', subjectError);
          // Don't fail verification for this
        }
      }
      
      // 📅 Save freelancer's availability if provided
      if (availabilityDays && Array.isArray(availabilityDays) && availabilityDays.length > 0) {
        try {
          // Convert days array to JSON string for storage
          const daysJson = JSON.stringify(availabilityDays);
          
          // Check if profile already exists
          const existingProfile = await db
            .select()
            .from(freelancerProfiles)
            .where(eq(freelancerProfiles.userId, newUser.id))
            .limit(1);
          
          if (existingProfile.length > 0) {
            // Update existing profile
            await db
              .update(freelancerProfiles)
              .set({
                availableDays: daysJson,  // Fixed: Use availableDays not availabilityDays
                updatedAt: now,
              })
              .where(eq(freelancerProfiles.userId, newUser.id));
            console.log('[Verify] Updated freelancer availability:', {
              userId: newUser.id,
              daysCount: availabilityDays.length,
            });
          } else {
            // Create new profile
            await db.insert(freelancerProfiles).values({
              userId: newUser.id,
              availableDays: daysJson,  // Fixed: Use availableDays not availabilityDays
              createdAt: now,
              updatedAt: now,
            });
            console.log('[Verify] Created freelancer availability:', {
              userId: newUser.id,
              daysCount: availabilityDays.length,
            });
          }
        } catch (availabilityError) {
          console.error('[Verify] Failed to save freelancer availability:', availabilityError);
          // Don't fail verification for this
        }
      } else {
        console.warn('[Verify] No availability days provided for freelancer registration.');
      }
    }

    // Delete pending registration
    await db.delete(pendingRegistrations)
      .where(eq(pendingRegistrations.email, normalizedEmail));

    // 📧 Send comprehensive welcome email to ALL clients (both 'client' and 'account_owner')
    // NOTE: Email sending should not block verification - wrapped in try-catch
    if (role === 'account_owner' || role === 'client') {
      try {
        console.log('✅ [Verify] Preparing welcome email for client:', {
          email: normalizedEmail,
          role,
          name: pending.name
        });
        
        // Send comprehensive welcome email to ALL clients (both account_owner and regular client)
        const subject = '🎉 Welcome to TaskLynk Academic Writing Platform - Your Professional Writing Team Awaits';
        const html = getAccountOwnerWelcomeHTML(pending.name);

        console.log('✅ [Verify] Email template generated, calling sendEmail...', {
          emailTo: normalizedEmail,
          subjectPreview: subject.substring(0, 50),
          htmlLength: html.length
        });

        const emailResult = await sendEmail({
          to: normalizedEmail,
          subject,
          html,
          category: 'registration'
        });

        if (emailResult.success) {
          console.log('✅✅✅ [Verify] Welcome email sent successfully:', {
            email: normalizedEmail,
            role,
            messageId: emailResult.messageId,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error('⚠️ [Verify] Failed to send welcome email (non-blocking):', {
            email: normalizedEmail,
            role,
            error: emailResult.error,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Email failure should not block registration
        console.error('⚠️ [Verify] Exception sending welcome email (non-blocking):', {
          email: normalizedEmail,
          role,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log('[Verify] Skipping welcome email - not a client role:', { role });
    }

    // Send notification to admins for all non-admin registrations (non-blocking)
    if (!isAdmin) {
      try {
        sendEmailToAdmins({
          subject: `New ${role} Registration - ${pending.name} (Requires Approval)`,
          html: getNewUserRegistrationAdminHTML(
            String(pending.name),
            normalizedEmail,
            role,
            String(pending.phone || 'Not provided')
          )
        }).catch(err => console.error('⚠️ [Verify] Failed to send admin notification (non-blocking):', err));
      } catch (error) {
        console.error('⚠️ [Verify] Exception sending admin notification (non-blocking):', error);
      }
    }

    // Provide accurate message based on approval status (previously checked for 'active' which is never used)
    const verificationMessage = isApproved
      ? 'Email verified successfully! You can now log in.'
      : 'Email verified! Your account is pending admin approval. You will be notified once approved.';

    // 🔑 Create session for the newly verified user (auto-login after verification)
    console.log('[Verify] Creating session for newly verified user:', { userId: newUser.id, role });
    
    // Build session data from the newly created user
    const sessionData: SessionData = await buildSessionUserData({
      id: newUser.id,
      email: normalizedEmail,
      name: pending.name,
      role,
      roleId,
      approved: isApproved,
      emailVerified: true,
      status: initialStatus,
      balance: 0,
      phone: resolvedPhone,
      displayId: newUser.displayId,
      clientTier: isClient ? 'basic' : 'basic',
      clientPriority: isClient ? 'regular' : 'regular',
      presenceStatus: 'offline',
    } as DbUserRecord, role as UserRole);

    // Generate JWT token
    const token = generateSessionToken(
      {
        userId: newUser.id,
        email: normalizedEmail,
        role: role as UserRole,
      },
      false // Short session by default
    );

    console.log('[Verify] Session token generated, returning response with cookie');

    // Return response with session cookie set
    return createSessionResponse(
      {
        ...sessionData,
        message: verificationMessage,
        approved: isApproved,
        status: initialStatus,
      } as SessionData,
      token,
      false
    );

  } catch (error: any) {
    // Drizzle wraps DB failures as `Failed query: ...` on error.message and
    // stashes the actual Postgres error (constraint name, code, etc.) on
    // error.cause - surface both or this just says "insert failed" forever.
    const causeMessage = error?.cause instanceof Error ? error.cause.message : undefined;
    console.error('❌❌❌ [Verify Code] Critical error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      cause: causeMessage,
      code: error?.code || error?.cause?.code,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      error: 'Internal server error during verification',
      details: causeMessage || (error instanceof Error ? error.message : 'Unknown error'),
      code: 'VERIFICATION_ERROR'
    }, { status: 500 });
  }
}

