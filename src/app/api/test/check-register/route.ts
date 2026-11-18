import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='pending_registrations'
    `);
    
    // Get table structure
    const tableInfo = await db.execute(sql`PRAGMA table_info(pending_registrations)`);
    
    // Try a simple select
    const testSelect = await db.select().from(pendingRegistrations).limit(1);
    
    return NextResponse.json({
      success: true,
      tableExists: tableCheck.rows.length > 0,
      tableInfo: tableInfo.rows,
      testSelect: testSelect,
      message: 'Table check successful'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}


