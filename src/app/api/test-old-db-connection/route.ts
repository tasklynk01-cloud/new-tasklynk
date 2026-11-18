import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Test connection with user count query
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM users`);

    const userCount = result.rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      connectionStatus: 'connected',
      query: 'SELECT COUNT(*) as count FROM users',
      result: {
        userCount
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Database connection test error:', error);

    return NextResponse.json({
      success: false,
      connectionStatus: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorDetails: {
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

