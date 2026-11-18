import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth-tokens'; // Updated import
import { loginRateLimiter, applyRateLimit } from '@/lib/rate-limit';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';

// Map role_id to role names (based on ROLE_ID_MAP: 1=admin, 2=client, 3=manager, 4=freelancer, 5=editor, 6=account_owner)
const ROLE_NAMES: Record<number, string> = {
  1: 'admin',
  2: 'client',
  3: 'manager',
  4: 'freelancer',
  5: 'editor',
  6: 'account_owner',
};

// Normalize various status variants coming from DB/migrations
function normalizeStatus(raw: unknown): 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'blacklisted' {
  const s = String(raw || '').trim().toLowerCase();
  if (['approved', 'active'].includes(s)) return s as 'approved' | 'active';
  if (['pending', 'awaiting_approval', 'awaiting-approval', 'unverified', 'new', 'inactive', 'not_approved'].includes(s)) return 'pending';
  if (s === 'rejected') return 'rejected';
  if (s === 'suspended') return 'suspended';
  if (s === 'blacklisted') return 'blacklisted';
  // Default to pending for unknown/empty
  return 'pending';
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 'MISSING_CREDENTIALS', 400);
    }

    // 🔒 RATE LIMITING: Prevent brute force attacks.
    // Scoped per-account (email) rather than per-IP so testing/using different
    // accounts (client, admin, manager, editor, freelancer) from the same
    // machine doesn't lock everyone out because of one account's failures.
    const rateLimitResponse = await applyRateLimit(request, loginRateLimiter, email);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const userResult = await withRetry(
      async () => {
        return await db.execute(sql`SELECT * FROM users WHERE email = ${email.trim().toLowerCase()}`);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    if (userResult.rows.length === 0) {
      return createErrorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const user: any = userResult.rows[0];
    const userStatus = normalizeStatus(user.status);

    if (userStatus === 'rejected') {
      return createErrorResponse(
        'Your account has been rejected. Please contact support for more information.',
        'ACCOUNT_REJECTED',
        403
      );
    }

    if (userStatus === 'blacklisted') {
      return createErrorResponse(
        'Your account has been blacklisted. Please contact support.',
        'ACCOUNT_BLACKLISTED',
        403
      );
    }

    if (userStatus === 'suspended') {
      return createErrorResponse(
        'Your account is currently suspended. Please contact support.',
        'ACCOUNT_SUSPENDED',
        403
      );
    }

    const isPasswordValid = await bcrypt.compare(password, String(user.password));
    
    if (!isPasswordValid) {
      console.log('[Login] Password verification FAILED');
      return createErrorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Successful auth — clear this account's failed-attempt bucket
    loginRateLimiter.resetForRequest(request, email);

    const roleName = user.role || ROLE_NAMES[user.role_id as number] || 'client';

    const response = createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        role: roleName,
      },
      message: 'Login successful',
    });

    // Set secure httpOnly cookie using the new function
    setAuthCookie(response, { id: user.id, email: user.email, role: roleName }, rememberMe);

    const now = new Date().toISOString();
    await withRetry(
      async () => {
        return await db.execute(sql`UPDATE users SET last_login_at = ${now}, login_count = login_count + 1 WHERE id = ${user.id}`);
      },
      { maxRetries: 2, initialDelay: 500 }
    );

    console.log('[Login] Session created successfully for user:', user.id, 'with role:', roleName);
    return response;
  } catch (error: any) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

export async function OPTIONS() {
  return handleOptions();
}

