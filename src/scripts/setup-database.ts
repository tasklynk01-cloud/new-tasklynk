/**
 * Database Setup and Recovery Script
 * Run this after updating your DATABASE_URL (Supabase Postgres) credentials
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function setupDatabase() {

  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);

    // Check if users table exists
    const tableCheck = await db.execute(
      sql`SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`
    );
    
    if (tableCheck.rows.length === 0) {
      return;
    }

    // Seed admin accounts
    const adminEmails = [
      'topwriteessays@gmail.com',
      'm.d.techpoint25@gmail.com',
      'maguna956@gmail.com',
      'tasklynk01@gmail.com',
      'maxwellotieno11@gmail.com',
      'ashleydothy3162@gmail.com',
    ];

    const password = 'kemoda2025';
    const hashedPassword = await bcrypt.hash(password, 10);

    for (const email of adminEmails) {
      try {
        // Check if admin already exists
        const existing = await db.execute(
          sql`SELECT id FROM users WHERE email = ${email}`
        );

        if (existing.rows.length === 0) {
          // Extract name from email
          const name = email
            .split('@')[0]
            .split('.')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Generate display ID
          const displayId = `ADM${Date.now()}${Math.floor(Math.random() * 1000)}`;

          // Insert admin
          await db.execute(sql`
            INSERT INTO users (
              display_id, email, password, name, role, approved, 
              status, phone, balance, earned, total_earnings,
              total_earned, total_spent, completed_jobs, login_count,
              created_at, updated_at
            ) VALUES (
              ${displayId}, ${email}, ${hashedPassword}, ${name}, 'admin', 1,
              'active', '0701066845', 0, 0, 0,
              0, 0, 0, 0,
              NOW(), NOW()
            )
          `);
        } else {
        }
      } catch (error: any) {
        console.error(`❌ Failed to create ${email}:`, error.message);
      }
    }

    const admins = await db.execute(
      sql`SELECT email, name, role, approved, status FROM users WHERE role = 'admin'`
    );
    admins.rows.forEach((admin: any) => {
    });

  } catch (error: any) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Verify DATABASE_URL in .env');
    console.error('   2. Run: npm run db:push');
    console.error('   3. Try again');
  }
}

setupDatabase();

