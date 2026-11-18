import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {

    // 1. Writer Tiers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS writer_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        min_rating REAL NOT NULL,
        min_jobs INTEGER NOT NULL,
        min_success_rate REAL NOT NULL,
        benefits TEXT,
        color TEXT,
        icon TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 2. Conversations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER REFERENCES jobs(id),
        participant1_id INTEGER NOT NULL REFERENCES users(id),
        participant2_id INTEGER NOT NULL REFERENCES users(id),
        last_message_at TEXT,
        last_message_sender_id INTEGER REFERENCES users(id),
        last_message_preview TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 3. Freelancer Profiles table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS freelancer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        bio TEXT,
        skills TEXT,
        certifications TEXT,
        portfolio TEXT,
        hourly_rate REAL,
        languages TEXT,
        timezone TEXT,
        availability TEXT DEFAULT 'part-time',
        response_time INTEGER,
        total_clients INTEGER DEFAULT 0,
        repeat_client_rate REAL DEFAULT 0,
        jobs_completed INTEGER DEFAULT 0,
        is_profile_complete INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 4. Client Profiles table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS client_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        company_name TEXT,
        industry TEXT,
        website TEXT,
        tax_id TEXT,
        business_registration TEXT,
        billing_address TEXT,
        shipping_address TEXT,
        preferred_payment_method TEXT,
        automate_payments INTEGER DEFAULT 0,
        total_jobs_posted INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        recurring_client_discount REAL DEFAULT 0,
        is_profile_complete INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 5. Seed writer tiers
    const now = new Date().toISOString();
    
    const tiers = [
      { name: 'Beginner', minRating: 0, minJobs: 0, minSuccessRate: 0, color: '#9E9E9E', icon: '🌱', benefits: JSON.stringify(['Access to basic orders', 'Community support']) },
      { name: 'Intermediate', minRating: 4.0, minJobs: 10, minSuccessRate: 0.8, color: '#2196F3', icon: '📈', benefits: JSON.stringify(['Priority support', 'Access to standard orders', 'Profile badge']) },
      { name: 'Advanced', minRating: 4.3, minJobs: 30, minSuccessRate: 0.85, color: '#4CAF50', icon: '🎯', benefits: JSON.stringify(['Premium orders access', 'Featured profile', 'Fast payouts']) },
      { name: 'Expert', minRating: 4.6, minJobs: 75, minSuccessRate: 0.9, color: '#FF9800', icon: '⚡', benefits: JSON.stringify(['VIP support', 'Exclusive orders', 'Instant payouts', '5% bonus on earnings']) },
      { name: 'Master', minRating: 4.8, minJobs: 150, minSuccessRate: 0.95, color: '#FFD700', icon: '👑', benefits: JSON.stringify(['Premium VIP support', 'First pick on all orders', 'Instant payouts', '10% bonus on earnings', 'Featured on homepage']) }
    ];

    for (const tier of tiers) {
      await db.execute(sql`
        INSERT OR IGNORE INTO writer_tiers (
          name,
          min_rating,
          min_jobs,
          min_success_rate,
          color,
          icon,
          benefits,
          created_at,
          updated_at
        )
        VALUES (
          ${tier.name},
          ${tier.minRating},
          ${tier.minJobs},
          ${tier.minSuccessRate},
          ${tier.color},
          ${tier.icon},
          ${tier.benefits},
          ${now},
          ${now}
        )
      `);
    }

    // 6. Create indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id)`);

    return NextResponse.json({
      success: true,
      message: 'All tables created and seeded successfully',
      tables: ['writer_tiers', 'conversations', 'freelancer_profiles', 'client_profiles'],
      tiersSeeded: tiers.length
    });

  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

