import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config();

const turso = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function fixMemosTable() {
  console.log('\n🔧 FIXING MEMOS TABLE\n');
  console.log('=' .repeat(70));
  
  try {
    console.log('\n📋 Current memos table structure:');
    const tableInfo = await turso.execute('PRAGMA table_info(memos)');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    
    const hasColumn = tableInfo.rows.some(row => row.name === 'requires_acknowledgement');
    
    if (hasColumn) {
      console.log('\n✅ requires_acknowledgement column already exists!');
      return;
    }
    
    console.log('\n📝 Adding requires_acknowledgement column...');
    
    await turso.execute(`
      ALTER TABLE memos 
      ADD COLUMN requires_acknowledgement INTEGER DEFAULT 1 NOT NULL
    `);
    
    console.log('✅ Column added successfully!');
    
    console.log('\n📋 Updated memos table structure:');
    const updatedTableInfo = await turso.execute('PRAGMA table_info(memos)');
    updatedTableInfo.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ MEMOS TABLE FIXED SUCCESSFULLY!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    turso.close();
  }
}

fixMemosTable()
  .then(() => {
    console.log('✅ Migration completed!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
