import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Drop old triggers
    await db.execute(sql`DROP TRIGGER IF EXISTS trg_jobs_min_price_ins`);
    await db.execute(sql`DROP TRIGGER IF EXISTS trg_jobs_min_price_upd`);

    // Create new triggers with correct pricing: 250 per page, 150 per slide
    await db.execute(sql.raw(`
      CREATE TRIGGER trg_jobs_min_price_ins BEFORE INSERT ON jobs
      WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
      BEGIN
        SELECT RAISE(ABORT,'MIN_PRICE');
      END
    `));

    await db.execute(sql.raw(`
      CREATE TRIGGER trg_jobs_min_price_upd BEFORE UPDATE OF amount, pages, slides ON jobs
      WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
      BEGIN
        SELECT RAISE(ABORT,'MIN_PRICE');
      END
    `));

    return NextResponse.json({
      success: true,
      message: 'Price validation triggers updated successfully',
      newRules: {
        perPage: 250,
        perSlide: 150
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating triggers:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update triggers',
    }, { status: 500 });
  }
}

