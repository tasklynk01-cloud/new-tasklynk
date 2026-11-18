/**
 * Standardized Session Management
 * 
 * Gap #12: Unified session management approach across all API routes
 * 
 * This module provides a consistent way to handle sessions across the application,
 * replacing ad-hoc session checks with a standardized approach.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getRequestSession, 
  getServerSession,
  verifySessionToken,
  generateSessionToken,
  setSessionCookie,
  clearSessionCookie,
  type SessionPayload,
  type SessionData,
  type UserRole,
  hasRequiredRole,
} from '@/lib/session';
import { createErrorResponse } from '@/lib/api-helpers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry } from '@/lib/db-retry';
import { buildSessionUserData } from '@/lib/session-user-data';

/**
 * Standardized session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  session?: SessionPayload;
  user?: SessionData;
  error?: string;
  statusCode?: number;
}

/**
 * Standardized session middleware
 * 
 * Use this in API routes to validate sessions consistently
 */
export async function validateSession(
  request: NextRequest,
  options?: {
    requireAuth?: boolean;
    requiredRoles?: UserRole | UserRole[];
    refreshIfNeeded?: boolean;
  }
): Promise<SessionValidationResult> {
  const {
    requireAuth = true,
    requiredRoles,
    refreshIfNeeded = false,
  } = options || {};

  try {
    // Get session from request
    const session = getRequestSession(request);

    if (!session) {
      if (!requireAuth) {
        return { valid: true }; // No auth required, session optional
      }
      return {
        valid: false,
        error: 'Authentication required',
        statusCode: 401,
      };
    }

    // Fetch user data from database
    const [user] = await withRetry(
      async () => {
        return await db
          .select()
          .from(users)
          .where(eq(users.id, session.userId))
          .limit(1);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    if (!user) {
      return {
        valid: false,
        error: 'User not found',
        statusCode: 404,
      };
    }

    // Check user status
    const status = String(user.status || '').toLowerCase();
    if (['rejected', 'blacklisted', 'suspended'].includes(status)) {
      return {
        valid: false,
        error: `Account is ${status}`,
        statusCode: 403,
      };
    }

    // Check if user is approved (if required)
    if (requireAuth && !user.approved && status !== 'approved' && status !== 'active') {
      return {
        valid: false,
        error: 'Account pending approval',
        statusCode: 403,
      };
    }

    // Check role requirements
    if (requiredRoles) {
      const userRole = session.role;
      if (!hasRequiredRole(userRole, requiredRoles)) {
        return {
          valid: false,
          error: 'Insufficient permissions',
          statusCode: 403,
        };
      }
    }

    // Prepare session data
    const sessionData = await buildSessionUserData(user, session.role);

    return {
      valid: true,
      session,
      user: sessionData,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Session validation failed',
      statusCode: 500,
    };
  }
}

/**
 * Create a standardized authenticated route handler
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const validation = await validateSession(request, { requiredRoles: ['admin'] });
 *   if (!validation.valid) {
 *     return createErrorResponse(validation.error!, 'UNAUTHORIZED', validation.statusCode || 401);
 *   }
 *   // Use validation.user and validation.session
 * }
 * ```
 */
export function createAuthenticatedHandler(
  handler: (request: NextRequest, session: SessionPayload, user: SessionData) => Promise<NextResponse>,
  options?: {
    requiredRoles?: UserRole | UserRole[];
    requireAuth?: boolean;
  }
) {
  return async (request: NextRequest) => {
    const validation = await validateSession(request, options);
    
    if (!validation.valid || !validation.session || !validation.user) {
      return createErrorResponse(
        validation.error || 'Authentication required',
        'UNAUTHORIZED',
        validation.statusCode || 401
      );
    }

    return handler(request, validation.session, validation.user);
  };
}

/**
 * Standardized session refresh
 */
export async function refreshSessionIfNeeded(
  request: NextRequest,
  session: SessionPayload
): Promise<{ token?: string; needsRefresh: boolean }> {
  const { shouldRefreshToken, generateSessionToken } = await import('@/lib/session');
  
  if (shouldRefreshToken(session)) {
    const newToken = generateSessionToken(
      {
        userId: session.userId,
        email: session.email,
        role: session.role,
      },
      false
    );
    
    return { token: newToken, needsRefresh: true };
  }
  
  return { needsRefresh: false };
}

/**
 * Standardized logout handler
 */
export function createLogoutResponse(): NextResponse {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
  
  clearSessionCookie(response);
  
  return response;
}

/**
 * Get current session data (standardized)
 */
export async function getCurrentSession(request: NextRequest): Promise<SessionValidationResult> {
  return validateSession(request, { requireAuth: true });
}


