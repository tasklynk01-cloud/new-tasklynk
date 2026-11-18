import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { withRetry } from '@/lib/db-retry';
import { createErrorResponse, createSuccessResponse, handleDatabaseError, handleOptions } from '@/lib/api-helpers';

/**
 * Database Connection Test Endpoint
 * 
 * GET /api/test/db-connection
 * 
 * Tests database connection with retry logic.
 * Use /api/health/database for production monitoring.
 */
export async function GET() {
  try {
    // Check environment variables
    const hasUrl = !!process.env.DATABASE_URL;

    if (!hasUrl) {
      return createErrorResponse(
        'Missing database credentials',
        'MISSING_DB_CREDENTIALS',
        500,
        { hasUrl }
      );
    }

    // Try a simple query with retry logic
    console.log('[DB Test] Attempting database query...');
    const result = await withRetry(
      async () => {
        return await db.select().from(users).limit(1);
      },
      {
        maxRetries: 2,
        initialDelay: 500,
      }
    );
    
    console.log('[DB Test] Query successful, rows:', result.length);
    
    return createSuccessResponse({
      message: 'Database connection working',
      userCount: result.length,
      hasUrl,
    });
  } catch (error: any) {
    console.error('[DB Test] Error:', error);
    return handleDatabaseError(error);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

