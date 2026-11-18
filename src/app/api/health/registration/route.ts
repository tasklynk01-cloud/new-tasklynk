import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pendingRegistrations, users } from '@/db/schema';

/**
 * Health Check Endpoint for Registration System
 * Tests database connectivity and environment configuration
 * 
 * GET /api/health/registration
 */
export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    database: { connected: false, error: null as string | null },
    tables: { pendingRegistrations: false, users: false },
    environment: {
      databaseUrl: !!process.env.DATABASE_URL,
      jwtSecret: !!process.env.JWT_SECRET,
      email: {
        resendApiKey: !!process.env.RESEND_API_KEY,
        fromEmail: !!process.env.FROM_EMAIL,
      },
    },
  };

  try {
    // Test database connection
    try {
      // Check pending_registrations table
      const pendingCount = await db.select().from(pendingRegistrations).limit(1);
      checks.tables.pendingRegistrations = true;
      
      // Check users table
      const usersCount = await db.select().from(users).limit(1);
      checks.tables.users = true;
      
      checks.database.connected = true;
    } catch (dbError: any) {
      checks.database.error = dbError?.message || 'Unknown database error';
      
      // Check if it's a missing table error
      if (dbError?.message?.includes('no such table')) {
        checks.database.error = 'Tables missing - run: npm run db:push';
      }
    }

    // Determine overall status
    const emailConfigured = checks.environment.email.resendApiKey;

    const allChecksPass = checks.database.connected &&
                         checks.tables.pendingRegistrations &&
                         checks.tables.users &&
                         checks.environment.databaseUrl &&
                         checks.environment.jwtSecret;

    checks.status = allChecksPass ? 'healthy' : 'unhealthy';

    return NextResponse.json({
      ...checks,
      warnings: [
        !emailConfigured && 'Resend not configured (RESEND_API_KEY missing) - email verification will fail',
        !checks.database.connected && 'Database connection failed',
        !checks.tables.pendingRegistrations && 'pending_registrations table missing',
        !checks.tables.users && 'users table missing',
        !checks.environment.jwtSecret && 'JWT_SECRET not set',
      ].filter(Boolean),
    }, { 
      status: allChecksPass ? 200 : 503,
    });

  } catch (error: any) {
    return NextResponse.json({
      ...checks,
      status: 'error',
      error: error?.message || 'Unknown error',
    }, { status: 500 });
  }
}

