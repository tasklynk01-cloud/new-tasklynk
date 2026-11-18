import { db } from '@/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function addAccountNameToUsers() {
  try {
    // Check if column already exists
    const tableInfo = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_name'`);
    const hasAccountName = tableInfo.rows.length > 0;

    if (hasAccountName) {
    } else {
      await db.execute(sql`ALTER TABLE users ADD COLUMN account_name TEXT`);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

addAccountNameToUsers();

