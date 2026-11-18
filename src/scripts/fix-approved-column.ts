import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function fixApprovedColumn() {
  try {
    
    // Try to add the approved column
    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN approved INTEGER NOT NULL DEFAULT 0;`);
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
      } else {
        throw error;
      }
    }

    // Verify the column exists by checking table info
    const tableInfo = await db.all(sql`PRAGMA table_info(users);`);
    const hasApproved = tableInfo.some((col: any) => col.name === 'approved');
    
    if (hasApproved) {
      
      // Update all managers to be approved
      const result = await db.run(sql`
        UPDATE users 
        SET approved = 1 
        WHERE role = 'manager' AND approved = 0;
      `);
    } else {
      console.error('❌ Failed to add approved column');
    }

    tableInfo.forEach((col: any) => {
    });

  } catch (error: any) {
    console.error('❌ Error fixing approved column:', error.message);
    throw error;
  }
}

fixApprovedColumn()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

