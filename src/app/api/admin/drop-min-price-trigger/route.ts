import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    
    // First, list all triggers on the jobs table
    const triggersResult = await db.execute(sql`
      SELECT name, sql FROM sqlite_master
      WHERE type = 'trigger' AND tbl_name = 'jobs'
    `);
    const triggers = triggersResult.rows as any[];


    // Drop each trigger found
    for (const trigger of triggers) {
      await db.execute(sql.raw(`DROP TRIGGER IF EXISTS ${trigger.name}`));
    }
    
    
    return NextResponse.json({ 
      success: true,
      message: 'All pricing triggers have been dropped successfully',
      droppedTriggers: triggers
    });
  } catch (error) {
    console.error('Error dropping triggers:', error);
    return NextResponse.json({ 
      error: 'Failed to drop triggers: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // List all triggers on the jobs table
    const triggersResult = await db.execute(sql`
      SELECT name, sql FROM sqlite_master
      WHERE type = 'trigger' AND tbl_name = 'jobs'
    `);
    const triggers = triggersResult.rows;

    return NextResponse.json({
      triggers
    });
  } catch (error) {
    console.error('Error listing triggers:', error);
    return NextResponse.json({ 
      error: 'Failed to list triggers: ' + (error as Error).message 
    }, { status: 500 });
  }
}

