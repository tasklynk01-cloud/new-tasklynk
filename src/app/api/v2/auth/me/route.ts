import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildSessionUserData } from '@/lib/session-user-data';
import { createErrorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = getRequestSession(request);

    if (!session) {
      return createErrorResponse('No active session', 'UNAUTHORIZED', 401);
    }

    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userResults.length === 0) {
      return createErrorResponse('User not found', 'NOT_FOUND', 404);
    }

    const user = userResults[0];
    const sessionData = await buildSessionUserData(user, session.role);

    return NextResponse.json({
      success: true,
      user: sessionData,
    });
  } catch (error) {
    console.error('[V2 Me] Error:', error);
    return createErrorResponse('Failed to fetch user', 'INTERNAL_SERVER_ERROR', 500);
  }
}
