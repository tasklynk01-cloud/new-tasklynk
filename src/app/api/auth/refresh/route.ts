/**
 * Token Refresh Endpoint
 * 
 * POST /api/auth/refresh
 * 
 * Refreshes an expired access token using a refresh token.
 * Returns a new access token and optionally a new refresh token.
 */

import { NextRequest } from 'next/server';
import { handleOptions, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers';
import { verifySessionToken, generateSessionToken } from '@/lib/session';
import { setSessionCookie } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';
import type { UserRole } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from request body or cookie
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken || request.cookies.get('auth_session')?.value;

    if (!refreshToken) {
      return createErrorResponse(
        'Refresh token is required',
        'MISSING_REFRESH_TOKEN',
        400
      );
    }

    // Verify refresh token
    const session = verifySessionToken(refreshToken);
    
    if (!session) {
      return createErrorResponse(
        'Invalid or expired refresh token',
        'INVALID_REFRESH_TOKEN',
        401
      );
    }

    // Verify user still exists and is active
    const user = await withRetry(
      async () => {
        const [userResult] = await db
          .select()
          .from(users)
          .where(eq(users.id, session.userId))
          .limit(1);
        
        return userResult;
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    if (!user) {
      return createErrorResponse(
        'User not found',
        'USER_NOT_FOUND',
        404
      );
    }

    // Check if user account is still active
    if (user.status === 'suspended' || user.status === 'blacklisted' || user.status === 'rejected') {
      return createErrorResponse(
        'Account is not active',
        'ACCOUNT_INACTIVE',
        403
      );
    }

    // Generate new session token
    const roleCandidate = (user.role || 'client') as string;
    const role: UserRole = [
      'admin',
      'client',
      'freelancer',
      'manager',
      'account_owner',
      'writer',
      'editor',
    ].includes(roleCandidate)
      ? (roleCandidate as UserRole)
      : 'client';

    const newSessionToken = generateSessionToken({
      userId: user.id,
      email: user.email,
      role,
    }, body.rememberMe || false);

    // Create response with new token
    const response = createSuccessResponse({
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        role,
      },
    });

    // Set new session cookie
    setSessionCookie(response, newSessionToken, body.rememberMe || false);

    return response;
  } catch (error: any) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return createErrorResponse(
      'Failed to refresh token',
      'REFRESH_FAILED',
      500
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}


