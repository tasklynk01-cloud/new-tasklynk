import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-tokens';
import { verifySessionToken, type SessionPayload } from '@/lib/session';

/**
 * Admin Authentication Helper
 * Validates admin role for secure API endpoints using JWT tokens
 * 
 * 🔧 UPDATED: Now supports both Bearer tokens AND auth_session cookies
 * This allows the client-side flow (which uses httpOnly cookies) to work
 * alongside explicit API calls with Authorization headers.
 */

export interface AuthResult {
  success?: boolean;
  error?: string;
  status?: number;
  user?: any;
}

/**
 * Extract bearer token from request headers
 */
function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Extract auth_session cookie from request
 * Works with both NextRequest and standard Request objects
 */
function extractSessionCookie(request: Request): string | null {
  // Try to get cookie from headers (works for all Request types)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('auth_session=')) {
        return cookie.substring('auth_session='.length);
      }
    }
  }
  return null;
}

/**
 * Validate JWT token and get user from database
 * 🔒 SECURITY: Now uses proper JWT verification instead of user ID
 */
async function validateToken(token: string): Promise<any | null> {
  try {
    // First verify JWT signature and expiration
    const payload = verifyToken(token);
    
    if (!payload) {
      return null; // Invalid or expired token
    }
    
    // Then fetch user from database using JWT payload
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);
    
    return user || null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Validate session cookie token and get user from database
 */
async function validateSessionCookie(cookieToken: string): Promise<any | null> {
  try {
    // Verify session token from cookie
    const session: SessionPayload | null = verifySessionToken(cookieToken);
    
    if (!session) {
      return null; // Invalid or expired session
    }
    
    // Fetch user from database using session userId
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    
    return user || null;
  } catch (error) {
    console.error('Session cookie validation error:', error);
    return null;
  }
}

/**
 * Get authenticated user from request
 * Tries Bearer token first, then falls back to auth_session cookie
 * 
 * @param request - The incoming request
 * @returns User object if authenticated, null otherwise
 */
export async function getAuthenticatedUser(request: Request): Promise<any | null> {
  try {
    // Try Bearer token first (explicit API calls)
    const bearerToken = extractToken(request);
    if (bearerToken) {
      const user = await validateToken(bearerToken);
      if (user) {
        // Validate that user has a role
        if (!user.role) {
          console.error('[Auth] WARNING: User authenticated but has no role set:', user.id);
        }
        
        return user;
      }
    }
    
    // Fall back to auth_session cookie (browser requests)
    const sessionCookie = extractSessionCookie(request);
    if (sessionCookie) {
      const user = await validateSessionCookie(sessionCookie);
      if (user) {
        // Validate that user has a role
        if (!user.role) {
          console.error('[Auth] WARNING: User authenticated but has no role set:', user.id);
        }
        
        return user;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('[getAuthenticatedUser] ERROR - Authentication process failed:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      timestamp: new Date().toISOString()
    });
    
    // Return null on authentication errors to avoid breaking the request
    return null;
  }
}

/**
 * Get authenticated user from request with AuthResult format
 * Convenient wrapper for API endpoints that need standardized response
 * 
 * @param request - The incoming request
 * @returns AuthResult with success/error and user data
 */
export async function getAuthenticatedUserResult(request: Request): Promise<AuthResult> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized: Authentication required',
      status: 401
    };
  }
  
  return {
    success: true,
    user
  };
}

/**
 * Require admin role for API endpoint
 * Returns error object if unauthorized, or success with user object
 * 
 * CRITICAL: Admin accounts do NOT need approval checks - they are auto-approved
 * 🔧 UPDATED: Now supports both Bearer tokens AND auth_session cookies
 */
export async function requireAdminRole(request: Request): Promise<AuthResult> {
  // Get user from either Bearer token or auth_session cookie
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      error: 'Unauthorized: Authentication required',
      status: 401
    };
  }
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return {
      error: 'Forbidden: Admin role required',
      status: 403
    };
  }
  
  // 🔴 CRITICAL FIX: Admin accounts do NOT need approval checks
  // Admins are auto-approved and should always have access
  // Only check suspension status for admins
  
  if (user.status === 'suspended') {
    return {
      error: 'Forbidden: Admin account is suspended',
      status: 403
    };
  }
  
  if (user.status === 'blacklisted') {
    return {
      error: 'Forbidden: Admin account is blacklisted',
      status: 403
    };
  }
  
  // All checks passed
  return {
    success: true,
    user
  };
}

/**
 * Require specific role for API endpoint
 * Useful for endpoints that allow multiple roles (e.g., admin or manager)
 * 🔧 UPDATED: Now supports both Bearer tokens AND auth_session cookies
 */
export async function requireRole(request: Request, allowedRoles: string[]): Promise<AuthResult> {
  try {
    // Get user from either Bearer token or auth_session cookie
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return {
        error: 'Unauthorized: Authentication required',
        status: 401
      };
    }
    
    // Debug logging to help identify role issues
    const userRole = user.role;
    
    // Handle null/undefined role
    if (!userRole) {
      console.error('[requireRole] ERROR: User has no role set:', {
        userId: user.id,
        userEmail: user.email,
        userObject: user
      });
      return {
        error: `Forbidden: Your account has no role assigned. Please contact support. User ID: ${user.id}`,
        status: 403
      };
    }
    
    const normalizedUserRole = String(userRole).toLowerCase().trim();
    const normalizedAllowedRoles = allowedRoles.map(r => String(r).toLowerCase().trim());
    
    // Check if user role matches (case-insensitive comparison)
    // Also handle role aliases (e.g., account_owner can access client endpoints)
    const roleAliases: Record<string, string[]> = {
      'account_owner': ['client', 'account_owner'],
      'client': ['client', 'account_owner'],
    };
    
    const aliases = roleAliases[normalizedUserRole] || [normalizedUserRole];
    const hasMatch = aliases.some(alias => normalizedAllowedRoles.includes(alias));
    
    if (!hasMatch) {
      return {
        error: `Forbidden: One of these roles required: ${allowedRoles.join(', ')}. Your current role: "${userRole}". Please contact support if you believe this is an error.`,
        status: 403
      };
    }
    
    // 🔴 CRITICAL FIX: Admins do NOT need approval checks
    if (user.role !== 'admin') {
      if (!user.approved) {
        return {
          error: 'Forbidden: Account not approved',
          status: 403
        };
      }
    }
    
    if (user.status === 'suspended') {
      return {
        error: 'Forbidden: Account is suspended',
        status: 403
      };
    }
    
    if (user.status === 'blacklisted') {
      return {
        error: 'Forbidden: Account is blacklisted',
        status: 403
      };
    }
    
    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('[requireRole] CRITICAL ERROR - Authentication function failed:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      allowedRoles,
      timestamp: new Date().toISOString()
    });
    
    // Return 500 error if authentication system itself fails
    return {
      error: 'Internal server error: Authentication system failure',
      status: 500
    };
  }
}

/**
 * Require specific role for API endpoint WITHOUT approval check
 * Useful for file uploads where users need to upload even before approval
 * 🔧 UPDATED: Now supports both Bearer tokens AND auth_session cookies
 */
export async function requireRoleWithoutApproval(request: Request, allowedRoles: string[]): Promise<AuthResult> {
  // Get user from either Bearer token or auth_session cookie
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      error: 'Unauthorized: Authentication required',
      status: 401
    };
  }
  
  if (!allowedRoles.includes(user.role)) {
    return {
      error: `Forbidden: One of these roles required: ${allowedRoles.join(', ')}`,
      status: 403
    };
  }
  
  // Only check for suspension/blacklist, not approval
  if (user.status === 'suspended') {
    return {
      error: 'Forbidden: Account is suspended',
      status: 403
    };
  }
  
  if (user.status === 'blacklisted') {
    return {
      error: 'Forbidden: Account is blacklisted',
      status: 403
    };
  }
  
  return {
    success: true,
    user
  };
}

/**
 * Extract user from request (for authenticated endpoints)
 * Returns null if not authenticated
 * 🔧 UPDATED: Now supports both Bearer tokens AND auth_session cookies
 */
export async function getUserFromRequest(request: Request): Promise<any | null> {
  return await getAuthenticatedUser(request);
}

