import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Check current table structure
    const tableInfo = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'payments'`);

    const columnsToAdd = [
      { name: 'job_id', definition: 'INTEGER NOT NULL' },
      { name: 'client_id', definition: 'INTEGER NOT NULL' },
      { name: 'freelancer_id', definition: 'INTEGER' },
    ];

    const results: string[] = [];
    const errors: string[] = [];

    for (const column of columnsToAdd) {
      const hasColumn = tableInfo.rows.some((row: any) => (row.column_name || row.name) === column.name);

      if (hasColumn) {
        results.push(`ℹ️  Column already exists: ${column.name}`);
        continue;
      }

      try {
        // For NOT NULL columns, we need to add with a default value first
        let query = `ALTER TABLE payments ADD COLUMN ${column.name} ${column.definition.replace('NOT NULL', '')}`;
        await db.execute(sql.raw(query));

        results.push(`✅ Added column: ${column.name}`);
      } catch (error: any) {
        errors.push(`❌ Failed to add ${column.name}: ${error.message}`);
        console.error(`❌ Failed to add ${column.name}:`, error);
      }
    }

    // Test the migration
    const testQuery = await db.execute(sql`SELECT * FROM payments LIMIT 1`);

    return NextResponse.json({
      success: true,
      message: 'Payments table migration completed',
      results,
      errors,
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

