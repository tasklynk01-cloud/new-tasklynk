import 'dotenv/config';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to users table...\n');

  try {
    // Get current table structure
    const tableInfo = await db.all(sql`PRAGMA table_info(users)`);
    const columnNames = tableInfo.map((col: any) => col.name);
    
    const columnsToAdd = [
      { name: 'two_factor_enabled', type: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'two_factor_secret', type: 'TEXT' },
      { name: 'two_factor_backup_codes', type: 'TEXT' },
      { name: 'two_factor_verified_at', type: 'TEXT' }
    ];
    
    console.log('Checking for missing columns...\n');
    
    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.name)) {
        console.log(`❌ Missing: ${column.name}`);
        console.log(`   Adding column...`);
        await db.run(sql.raw(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`));
        console.log(`   ✅ Added ${column.name}\n`);
      } else {
        console.log(`✅ Already exists: ${column.name}\n`);
      }
    }
    
    console.log('✅ All columns checked and added as needed!');
    
    // Verify final structure
    console.log('\n📋 Verifying final table structure...');
    const finalTableInfo = await db.all(sql`PRAGMA table_info(users)`);
    console.log(`Total columns: ${finalTableInfo.length}`);
    
    const twoFAColumns = finalTableInfo.filter((col: any) => 
      col.name.startsWith('two_factor')
    );
    
    console.log('\n🔐 Two-factor authentication columns:');
    twoFAColumns.forEach((col: any) => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addMissingColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
