import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all triggers
    const triggersResult = await db.execute(sql`
      SELECT trigger_name as name, event_object_table as tbl_name, action_statement as sql
      FROM information_schema.triggers
    `);


    return NextResponse.json({
      success: true,
      triggers: triggersResult.rows,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error checking triggers:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check triggers',
    }, { status: 500 });
  }
}

