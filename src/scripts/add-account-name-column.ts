import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function addAccountNameColumn() {
  try {
    
    // Check if column already exists
    const tableInfo = await db.run(sql`PRAGMA table_info(pending_registrations)`);
    
    // Add the account_name column if it doesn't exist
    await db.run(sql`
      ALTER TABLE pending_registrations 
      ADD COLUMN account_name TEXT
    `);
    
    
    // Verify the change
    const updatedTableInfo = await db.run(sql`PRAGMA table_info(pending_registrations)`);
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate column name')) {
    } else {
      console.error('❌ Error adding column:', error);
      throw error;
    }
  }
}

addAccountNameColumn()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

