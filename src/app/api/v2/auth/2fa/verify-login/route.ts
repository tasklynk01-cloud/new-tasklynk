/**
 * 🔐 2FA LOGIN VERIFICATION ENDPOINT
 * 
 * Verifies 2FA code during login and issues session token
 * 
 * POST /api/v2/auth/2fa/verify-login
 * Body: { email: string, token: string }
 * 
 * FLOW:
 * 1. User enters email/password in login form
 * 2. Login API returns requiresTwoFactor: true
 * 3. Client shows 2FA input
 * 4. This endpoint verifies 2FA code
 * 5. Issues session token on success
 * 
 * SECURITY:
 * - Verifies TOTP or backup code
 * - Rate limited to prevent brute force
 * - Updates backup codes if used
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import {
  generateSessionToken,
  createSessionResponse,
  createErrorResponse,
  type UserRole,
} from '@/lib/session';
import { loginRateLimiter, applyRateLimit } from '@/lib/rate-limit';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildSessionUserData } from '@/lib/session-user-data';
import {
  verifyTwoFactor,
  decryptSecret,
  encryptSecret,
} from '@/lib/two-factor-auth';

const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-key-change-in-production';

// Role mapping from database role_id
const ROLE_MAP: Record<number, UserRole> = {
  1: 'admin',
  2: 'client',
  3: 'manager',
  4: 'freelancer',
  5: 'editor',
  6: 'account_owner',
};

/**
 * Determine user role from database data
 */
function determineUserRole(user: any): UserRole {
  if (user.role_id != null && ROLE_MAP[Number(user.role_id)]) {
    return ROLE_MAP[Number(user.role_id)];
  }
  
  if (user.role) {
    const roleText = String(user.role).toLowerCase();
    if (roleText === 'writer') return 'freelancer';
    if (['admin', 'client', 'freelancer', 'manager', 'account_owner', 'editor'].includes(roleText)) {
      return roleText as UserRole;
    }
  }
  
  return 'client';
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, token, rememberMe = false } = body;

    // Validate input
    if (!email || !token) {
      return createErrorResponse('Email and verification code are required', 400);
    }

    // Rate limiting, scoped per-account (email) rather than per-IP so different
    // accounts tested from the same machine don't share a lockout.
    const rateLimitResponse = await applyRateLimit(request, loginRateLimiter, email);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Find user by email
    const userResult = await db.execute(sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email.trim()})`);

    if (userResult.rows.length === 0) {
      return createErrorResponse('Invalid credentials', 401);
    }

    const user: any = userResult.rows[0];

    // Check if 2FA is enabled
    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return createErrorResponse('Two-factor authentication is not enabled for this account', 400);
    }

    // Decrypt secret
    const decryptedSecret = decryptSecret(user.two_factor_secret, ENCRYPTION_KEY);

    // Decrypt backup codes
    let decryptedBackupCodes: string | null = null;
    if (user.two_factor_backup_codes) {
      decryptedBackupCodes = decryptSecret(user.two_factor_backup_codes, ENCRYPTION_KEY);
    }

    // Verify 2FA code (TOTP or backup code)
    const verificationResult = verifyTwoFactor(
      decryptedSecret,
      token,
      decryptedBackupCodes
    );

    if (!verificationResult.isValid) {
      return createErrorResponse('Invalid verification code', 401);
    }

    // Correct 2FA code — clear this account's failed-attempt bucket
    loginRateLimiter.resetForRequest(request, email);

    // If backup code was used, update backup codes in database
    if (verificationResult.usedBackupCode && verificationResult.remainingCodes) {
      const encryptedBackupCodes = encryptSecret(
        JSON.stringify(verificationResult.remainingCodes),
        ENCRYPTION_KEY
      );

      await db.execute(sql`UPDATE users SET two_factor_backup_codes = ${encryptedBackupCodes}, updated_at = ${new Date().toISOString()} WHERE id = ${user.id}`);
    }

    // Update login tracking
    const now = new Date().toISOString();
    await db.execute(sql`UPDATE users SET last_login_at = ${now}, login_count = COALESCE(login_count, 0) + 1, updated_at = ${now} WHERE id = ${user.id}`);

    // Determine user role
    const userRole = determineUserRole(user);

    // Generate secure session token
    const sessionToken = generateSessionToken(
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

    const sessionData = await buildSessionUserData(userRecord, userRole);

    // Create response with session cookie
    const response = createSessionResponse(sessionData, sessionToken, Boolean(rememberMe));

    // Add warning if backup codes are low
    if (verificationResult.usedBackupCode && verificationResult.remainingCodes) {
      if (verificationResult.remainingCodes.length < 3) {
        return NextResponse.json(
          {
            ...response,
            warning: `You have only ${verificationResult.remainingCodes.length} backup codes remaining. Consider regenerating them.`,
          },
          {
            status: 200,
            headers: response.headers,
          }
        );
      }
    }

    return response;
  } catch (error: any) {
    console.error('[2FA Login Verification] Error:', error);
    return createErrorResponse(
      error.message || 'Failed to verify two-factor authentication',
      500
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

