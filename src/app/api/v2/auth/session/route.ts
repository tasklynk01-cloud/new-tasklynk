/**
 * Session Check and Refresh API Route
 * 
 * Returns current session status and refreshes token if needed
 * 
 * 🔧 UPDATED: Now uses shared db instance instead of creating new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getRequestSession, 
  shouldRefreshToken,
  generateSessionToken,
  createSessionResponse,
  createErrorResponse,
  type SessionData
} from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildSessionUserData } from '@/lib/session-user-data';

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = getRequestSession(request);

    if (!session) {
      console.log('[Session] No active session found - cookie missing or invalid');
      return createErrorResponse('No active session', 401);
    }

    console.log('[Session] Validating session for user:', { userId: session.userId, role: session.role });

    // Fetch latest user data from database using shared db instance
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userResults.length === 0) {
      console.error('[Session] User not found in database:', session.userId);
      return createErrorResponse('User not found', 404);
    }

    const user = userResults[0];

    // Check if user is still active
    const status = String(user.status || '').toLowerCase();
    if (['rejected', 'blacklisted', 'suspended'].includes(status)) {
      console.warn('[Session] User account is not active:', { userId: user.id, status });
      return createErrorResponse('Account is no longer active', 403);
    }

    console.log('[Session] User validated successfully:', { userId: user.id, email: user.email, role: user.role });

    // Prepare session data
    const sessionData: SessionData = await buildSessionUserData(user, session.role);

    // Check if token needs refresh
    if (shouldRefreshToken(session)) {
      console.log('[Session] Token needs refresh, generating new token');
      
      // Generate new token
      const newToken = generateSessionToken(
        {
          userId: session.userId,
          email: session.email,
          role: session.role,
        },
        false // Short session for refresh
      );

      // Return with new cookie
      return createSessionResponse(sessionData, newToken, false);
    }

    // Return session without refresh - just send data, no need to set cookie again
    // Include raw cookie token so client can bridge legacy localStorage-based components
    const rawToken = request.cookies.get('auth_session')?.value;
    return NextResponse.json({
      success: true,
      user: sessionData,
      ...(rawToken ? { token: rawToken } : {}),
    });

  } catch (error) {
    console.error('[Session] Check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Session] Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return createErrorResponse('Failed to check session', 500);
  }
}

