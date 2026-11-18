import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Check if role column exists
    const tableInfo = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role'`);

    const hasRoleColumn = tableInfo.rows.length > 0;

    if (hasRoleColumn) {
      return NextResponse.json({
        success: true,
        message: 'Role column already exists',
        alreadyExists: true,
      }, { status: 200 });
    }

    // Add role column
    await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'client'`));

    // Test the migration by querying
    const testQuery = await db.execute(sql`SELECT id, name, role FROM users LIMIT 5`);

    return NextResponse.json({
      success: true,
      message: 'Role column added successfully',
      testResults: testQuery.rows,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration failed',
      details: error.toString(),
    }, { status: 500 });
  }
}

