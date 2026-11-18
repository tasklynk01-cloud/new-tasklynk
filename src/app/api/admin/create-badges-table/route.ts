import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {

    // 1. Badges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        criteria TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 2. User Badges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        badge_id INTEGER NOT NULL REFERENCES badges(id),
        badge_name TEXT,
        badge_icon TEXT,
        awarded_at TEXT NOT NULL,
        awarded_by INTEGER REFERENCES users(id),
        reason TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, badge_id)
      )
    `);

    // 3. Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_badges_status ON badges(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id)`);

    return NextResponse.json({
      success: true,
      message: 'Badges tables created successfully',
      tables: ['badges', 'user_badges']
    });

  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

