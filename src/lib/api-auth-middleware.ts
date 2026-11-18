/**
 * API Authentication Middleware
 * 
 * Enhanced authentication middleware that works with the existing
 * admin-auth system and provides standardized error responses.
 */

import { NextRequest } from 'next/server';
import { requireRole, requireAdminRole, getUserFromRequest } from '@/lib/admin-auth';
import { createErrorResponse } from '@/lib/api-helpers';
import { logAuthError } from '@/lib/error-logger';

export interface AuthMiddlewareOptions {
  roles?: string[];
  requireAdmin?: boolean;
  requireApproval?: boolean;
  allowPublic?: boolean;
}

export interface AuthMiddlewareResult {
  success: boolean;
  user?: any;
  error?: string;
  status?: number;
}

/**
 * Enhanced authentication middleware
 * 
 * @param request - Next.js request object
 * @param options - Authentication options
 * @returns Auth result with user or error
 */
export async function authenticateRequest(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  const { roles, requireAdmin = false, requireApproval = true, allowPublic = false } = options;

  // Allow public access if explicitly set
  if (allowPublic) {
    return { success: true };
  }

  try {
    // Use existing auth system
    if (requireAdmin) {
      const result = await requireAdminRole(request);
      if (result.error) {
        logAuthError(new Error(result.error), {
          url: request.url,
          method: request.method,
        });
        return {
          success: false,
          error: result.error,
          status: result.status || 401,
        };
      }
      return {
        success: true,
        user: result.user,
      };
    }

    if (roles && roles.length > 0) {
      const result = await requireRole(request, roles);
      if (result.error) {
        logAuthError(new Error(result.error), {
          url: request.url,
          method: request.method,
        });
        return {
          success: false,
          error: result.error,
          status: result.status || 401,
        };
      }
      return {
        success: true,
        user: result.user,
      };
    }

    // Just check if user is authenticated (any role)
    const user = await getUserFromRequest(request);
    if (!user) {
      logAuthError(new Error('Unauthorized'), {
        url: request.url,
        method: request.method,
      });
      return {
        success: false,
        error: 'Unauthorized: Authentication required',
        status: 401,
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    logAuthError(error, {
      url: request.url,
      method: request.method,
    });
    return {
      success: false,
      error: 'Authentication failed',
      status: 500,
    };
  }
}

/**
 * Create authentication middleware wrapper
 * Returns a function that can be used in API routes
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  return async (request: NextRequest): Promise<AuthMiddlewareResult> => {
    return authenticateRequest(request, options);
  };
}

/**
 * Quick helper for protected routes requiring specific roles
 */
export async function requireAuth(
  request: NextRequest,
  roles?: string[]
): Promise<{ user: any } | { error: string; status: number }> {
  const result = await authenticateRequest(request, { roles });
  
  if (!result.success) {
    return {
      error: result.error || 'Unauthorized',
      status: result.status || 401,
    };
  }

  return { user: result.user! };
}


