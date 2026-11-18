import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { users, managerInvitations } from '@/db/schema';
import bcrypt from 'bcryptjs';

async function diagnoseManagerRegistration() {
  try {

    // 1. Check users table structure
    const tableInfo = await db.all(sql`PRAGMA table_info(users)`);

    // 2. Check if role_id column exists and roles table
    try {
      const roles = await db.all(sql`SELECT * FROM roles`);
    } catch (e) {
    }

    // 3. Check CHECK constraints on users table
    const schema = await db.all(sql`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`);

    // 4. Try a test insert with minimal fields
    const testEmail = `test-manager-${Date.now()}@test.com`;
    const testPassword = await bcrypt.hash('test123', 10);
    const testDisplayId = `MNG${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const now = new Date().toISOString();

    try {
      await db.run(sql`
        INSERT INTO users (
          display_id, email, password, name, role,
          approved, email_verified, status,
          created_at
        ) VALUES (
          ${testDisplayId}, ${testEmail}, ${testPassword}, 'Test Manager', 'manager',
          1, 1, 'approved',
          ${now}
        )
      `);

      // Clean up test user
      await db.run(sql`DELETE FROM users WHERE email = ${testEmail}`);
    } catch (insertError: any) {
    }

    // 5. Check manager_invitations table
    const invitations = await db.all(sql`SELECT * FROM manager_invitations LIMIT 5`);

  } catch (error) {
    console.error('Diagnosis error:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseManagerRegistration();

