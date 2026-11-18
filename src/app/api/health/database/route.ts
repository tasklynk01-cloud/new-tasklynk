/**
 * Database Health Check Endpoint
 * 
 * GET /api/health/database
 * 
 * Returns database connection status and metrics.
 * Useful for monitoring and uptime checks.
 */

import { NextResponse } from 'next/server';
import { db, getDbHealthStatus } from '@/db';
import { users } from '@/db/schema';
import { withRetry } from '@/lib/db-retry';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers';

export async function GET() {
  const startTime = Date.now();
  let connectionStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
  let latency: number | null = null;
  let error: string | null = null;

  try {
    // Test database connection with a simple query
    await withRetry(
      async () => {
        await db.select().from(users).limit(1);
      },
      {
        maxRetries: 2,
        initialDelay: 500,
      }
    );

    latency = Date.now() - startTime;
    connectionStatus = latency < 1000 ? 'healthy' : 'degraded';

    // Get connection pool status
    const poolStatus = getDbHealthStatus();

    return createSuccessResponse({
      status: connectionStatus,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
      database: {
        type: 'Database (Supabase Postgres)',
        urlConfigured: !!process.env.DATABASE_URL,
      },
      connectionPool: {
        totalConnections: poolStatus.totalConnections,
        idleConnections: poolStatus.idleConnections,
        waitingClients: poolStatus.waitingClients,
      },
    });
  } catch (err: any) {
    latency = Date.now() - startTime;
    error = err?.message || 'Unknown error';
    connectionStatus = 'unhealthy';

    return createErrorResponse(
      'Database health check failed',
      'DATABASE_UNHEALTHY',
      503,
      {
        latency: `${latency}ms`,
        error,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  const { handleOptions } = await import('@/lib/api-helpers');
  return handleOptions();
}


