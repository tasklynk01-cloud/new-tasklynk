/**
 * Secure Login API Route
 * 
 * Features:
 * - Rate limiting to prevent brute force attacks
 * - Secure password verification with bcrypt
 * - JWT session management with httpOnly cookies
 * - Comprehensive status checks (rejected, suspended, blacklisted)
 * - Role-based access control
 * - Session expiry with remember-me option
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { 
  generateSessionToken, 
  createSessionResponse, 
  createErrorResponse,
  type UserRole
} from '@/lib/session';
import { loginRateLimiter, applyRateLimit } from '@/lib/rate-limit';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildSessionUserData } from '@/lib/session-user-data';
import { handleOptions } from '@/lib/api-helpers';

// Role mapping from database role_id
const ROLE_MAP: Record<number, UserRole> = {
  1: 'admin',
  2: 'client',
  3: 'manager',
  4: 'freelancer',
  5: 'editor',
  6: 'account_owner',
};

// Valid status values
type UserStatus = 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'blacklisted';

/**
 * Normalize database status values
 */
function normalizeStatus(raw: unknown): UserStatus {
  const status = String(raw || '').trim().toLowerCase();
  
  // Approved statuses
  if (['approved', 'active'].includes(status)) {
    return status as 'approved' | 'active';
  }
  
  // Pending statuses
  if (['pending', 'awaiting_approval', 'awaiting-approval', 'unverified', 'new', 'inactive'].includes(status)) {
    return 'pending';
  }
  
  // Blocked statuses
  if (status === 'rejected') return 'rejected';
  if (status === 'suspended') return 'suspended';
  if (status === 'blacklisted') return 'blacklisted';
  
  // Default to pending for safety
  return 'pending';
}

/**
 * Determine user role from database data
 */
function determineUserRole(user: any): UserRole {
  // Priority 1: Use role_id if present
  if (user.role_id != null && ROLE_MAP[Number(user.role_id)]) {
    return ROLE_MAP[Number(user.role_id)];
  }
  
  // Priority 2: Use text role field
  if (user.role) {
    const roleText = String(user.role).toLowerCase();
    // Map common variations
    if (roleText === 'writer') return 'freelancer';
    if (['admin', 'client', 'freelancer', 'manager', 'account_owner', 'editor'].includes(roleText)) {
      return roleText as UserRole;
    }
  }
  
  // Default to client
  return 'client';
}

/**
 * Check if user account is blocked
 */
function checkAccountStatus(status: UserStatus): { blocked: boolean; message?: string; code?: string } {
  switch (status) {
    case 'rejected':
      return {
        blocked: true,
        message: 'Your account has been rejected. Please contact support for more information.',
        code: 'ACCOUNT_REJECTED',
      };
    case 'blacklisted':
      return {
        blocked: true,
        message: 'Your account has been blacklisted. Please contact support.',
        code: 'ACCOUNT_BLACKLISTED',
      };
    case 'suspended':
      return {
        blocked: true,
        message: 'Your account is currently suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED',
      };
    default:
      return { blocked: false };
  }
}

/**
 * Login POST handler
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return createErrorResponse('Invalid email or password format', 400);
    }

    // Rate limiting: Prevent brute force attacks.
    // Scoped per-account (email) rather than per-IP so testing/using different
    // accounts (client, admin, manager, editor, freelancer) from the same
    // machine doesn't lock everyone out because of one account's failures.
    const rateLimitResponse = await applyRateLimit(request, loginRateLimiter, email);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }


    // Find user by email (case-insensitive)
    const userResult = await db.execute(sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email.trim()})`);

    if (userResult.rows.length === 0) {
      // Don't reveal whether email exists
      return createErrorResponse('Invalid email or password', 401);
    }

    const user: any = userResult.rows[0];
    const userStatus = normalizeStatus(user.status);
    
    console.log({
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      status: userStatus,
    });

    // Check if account is blocked
    const statusCheck = checkAccountStatus(userStatus);
    if (statusCheck.blocked) {
      return createErrorResponse(statusCheck.message!, 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, String(user.password));
    
    if (!isPasswordValid) {
      // Don't reveal that email was correct
      return createErrorResponse('Invalid email or password', 401);
    }

    // Correct password — clear this account's failed-attempt bucket
    loginRateLimiter.resetForRequest(request, email);

    // 🔐 Check if 2FA is enabled for this user
    if (user.two_factor_enabled) {
      // Return special response indicating 2FA is required
      // Client should prompt for 2FA code
      return NextResponse.json(
        {
          requiresTwoFactor: true,
          userId: user.id,
          email: user.email,
          message: 'Two-factor authentication required',
        },
        { status: 200 }
      );
    }

    // Update login tracking
    const now = new Date().toISOString();
    await db.execute(sql`UPDATE users SET last_login_at = ${now}, login_count = COALESCE(login_count, 0) + 1, updated_at = ${now} WHERE id = ${user.id}`);

    // Determine user role
    const userRole = determineUserRole(user);
    
    console.log({
      role: userRole,
      role_id: user.role_id,
      role_text: user.role,
      email: user.email,
    });
    
    // ✅ FIX: Check if user is approved using approved field (primary source of truth)
    const isApproved = Boolean(user.approved) || userStatus === 'approved' || userStatus === 'active';

    console.log({
      isApproved,
      userStatus,
      approved_field: user.approved,
      approved_boolean: Boolean(user.approved),
    });

    // ✅ FIX: If approved, update DB status to 'active' to fix sync issues
    if (isApproved && userStatus === 'pending') {
      await db.execute(sql`UPDATE users SET status = ${'active'} WHERE id = ${user.id}`);
    }

    // Generate secure session token
    const token = generateSessionToken(
      {
        userId: Number(user.id),
        email: String(user.email),
        role: userRole,
      },
      Boolean(rememberMe)
    );


    // Prepare session data
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(user.id)))
      .limit(1);

    if (!userRecord) {
      return createErrorResponse('Unable to load user profile', 500);
    }

    const normalizedUser = {
      ...userRecord,
      status: isApproved ? 'active' : userRecord.status,
      approved: isApproved,
    } as typeof userRecord;

    const sessionData = await buildSessionUserData(normalizedUser, userRole);

    console.log({
      id: sessionData.id,
      email: sessionData.email,
      role: sessionData.role,
      approved: sessionData.approved,
      status: sessionData.status,
    });

    // Create response with session cookie
    const response = createSessionResponse(sessionData, token, Boolean(rememberMe));


    return response;

  } catch (error: any) {
    // Log full details server-side only - never expose raw error messages
    // (e.g. SQL query text/params from a DB driver error) to the client.
    console.error('[Login] Unexpected error:', error);
    // Ensure a JSON response is always sent on error
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    return createErrorResponse('An unexpected error occurred. Please try again.', 500);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

