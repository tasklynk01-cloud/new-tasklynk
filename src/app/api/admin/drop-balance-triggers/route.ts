import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get all triggers
    const triggersResult = await db.execute(sql`
      SELECT name, sql
      FROM sqlite_master
      WHERE type = 'trigger'
      AND (sql LIKE '%balance%' OR name LIKE '%balance%')
    `);
    const triggers = triggersResult.rows as any[];


    // Drop each trigger
    for (const trigger of triggers) {
      try {
        await db.execute(sql.raw(`DROP TRIGGER IF EXISTS ${trigger.name}`));
      } catch (error) {
        console.error(`Error dropping trigger ${trigger.name}:`, error);
      }
    }

    // Test the jobs update operation
    try {
      await db.execute(sql`
        UPDATE jobs
        SET status = 'approved', admin_approved = 1, updated_at = datetime('now')
        WHERE id = 45
      `);
    } catch (error) {
      console.error('Test update failed:', error);
      return NextResponse.json({
        error: 'Test update failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        triggersDropped: triggers.length
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Successfully dropped triggers and tested update',
      triggersDropped: triggers,
      testUpdateSuccessful: true
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      error: 'Failed to drop triggers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

