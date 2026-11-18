import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function addAccountNameToUsers() {
  try {
    
    // Try to add the column
    await db.run(sql`ALTER TABLE users ADD COLUMN account_name TEXT;`);
    
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

addAccountNameToUsers();

