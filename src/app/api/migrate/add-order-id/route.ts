import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Step 1: Add order_id column
    try {
      await db.execute(sql`ALTER TABLE jobs ADD COLUMN order_id TEXT`);
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
      } else {
        throw error;
      }
    }

    // Step 2: Update all existing rows to set order_id = display_id
    const updateResult = await db.execute(sql`
      UPDATE jobs
      SET order_id = display_id
      WHERE order_id IS NULL OR order_id = ''
    `);

    // Step 3: Verify the changes
    const verifyResult = await db.execute(sql`
      SELECT COUNT(*) as total,
             COUNT(order_id) as with_order_id,
             COUNT(CASE WHEN order_id IS NULL OR order_id = '' THEN 1 END) as without_order_id
      FROM jobs
    `);

    const stats = verifyResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        totalJobs: stats.total,
        jobsWithOrderId: stats.with_order_id,
        jobsWithoutOrderId: stats.without_order_id,
      },
      rowsUpdated: (updateResult as any).rowCount || 0,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

