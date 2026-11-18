import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function verifyManagerCreation() {
  try {

    // Check users with role='manager'
    const managers = await db.all(sql`
      SELECT id, display_id, email, name, role, role_id, status, approved, created_at
      FROM users
      WHERE role = 'manager'
      ORDER BY created_at DESC
      LIMIT 5
    `);


    // Check managers table structure
    const tableInfo = await db.all(sql`PRAGMA table_info(managers)`);

    // Check managers table records
    const managerProfiles = await db.all(sql`SELECT * FROM managers ORDER BY created_at DESC LIMIT 5`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyManagerCreation();

