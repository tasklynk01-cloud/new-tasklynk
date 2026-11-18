import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/save-pending-subjects
 * Save subject selections to pending_registration for new freelancer registrations
 * This is used before email verification when the user doesn't exist yet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subjectIds } = body;

    // Validation
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ 
        error: 'Email is required', 
        code: 'MISSING_EMAIL' 
      }, { status: 400 });
    }

    if (!subjectIds || !Array.isArray(subjectIds)) {
      return NextResponse.json({ 
        error: 'subjectIds array is required', 
        code: 'MISSING_SUBJECT_IDS' 
      }, { status: 400 });
    }

    if (subjectIds.length < 7 || subjectIds.length > 15) {
      return NextResponse.json({ 
        error: 'Please select between 7-15 subjects', 
        code: 'INVALID_SUBJECT_COUNT' 
      }, { status: 400 });
    }

    // Validate all IDs are numbers
    const validIds = subjectIds.every(id => typeof id === 'number' && !isNaN(id));
    if (!validIds) {
      return NextResponse.json({ 
        error: 'All subject IDs must be valid numbers', 
        code: 'INVALID_SUBJECT_IDS' 
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find pending registration
    const pendingList = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, normalizedEmail))
      .limit(1);

    if (pendingList.length === 0) {
      return NextResponse.json({ 
        error: 'No pending registration found for this email', 
        code: 'NO_PENDING_REGISTRATION' 
      }, { status: 404 });
    }

    const pending = pendingList[0];

    // Verify this is a freelancer registration
    if (pending.role !== 'freelancer') {
      return NextResponse.json({ 
        error: 'Subject selection is only for freelancer registrations', 
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    // NOTE: subjectIds field does NOT exist in pending_registrations table
    // Subjects are stored in sessionStorage on the client side and passed to verify-code endpoint
    // This endpoint just validates that:
    // 1. Pending registration exists
    // 2. It's a freelancer registration
    // 3. Subject count is valid (7-15)
    // The actual subjects will be passed from the client to verify-code when email is verified
    // We do NOT update the database here - just validate

    console.log('[Save Pending Subjects] Validation successful:', {
      email: normalizedEmail,
      subjectCount: subjectIds.length,
      role: pending.role,
      note: 'Subjects validated - will be saved during email verification via sessionStorage'
    });

    return NextResponse.json({
      success: true,
      message: 'Subject preferences validated successfully',
      subjectCount: subjectIds.length,
      note: 'Subjects will be saved when you verify your email'
    });
  } catch (error) {
    console.error('POST /api/auth/save-pending-subjects error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}


