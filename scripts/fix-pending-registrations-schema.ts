import 'dotenv/config';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function fixPendingRegistrationsSchema() {
  console.log('🔧 Fixing pending_registrations table schema...\n');

  try {
    // 1. Check current table structure
    console.log('1️⃣ Checking current table structure...');
    const tableInfo = await db.all(sql`PRAGMA table_info(pending_registrations)`);
    console.log('Current columns:', tableInfo.map((col: any) => col.name).join(', '));
    
    const hasDomainId = tableInfo.some((col: any) => col.name === 'domain_id');
    const hasSubjectIds = tableInfo.some((col: any) => col.name === 'subject_ids');
    
    console.log('   Has domain_id column:', hasDomainId);
    console.log('   Has subject_ids column:', hasSubjectIds);
    
    // 2. If columns exist, we need to remove them (they should NOT be in this table)
    if (hasDomainId || hasSubjectIds) {
      console.log('\n2️⃣ Dropping invalid columns...');
      
      // SQLite doesn't support DROP COLUMN directly, so we need to:
      // a) Create new table without those columns
      // b) Copy data
      // c) Drop old table
      // d) Rename new table
      
      console.log('   Creating new table structure...');
      await db.run(sql`
        CREATE TABLE pending_registrations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          phone TEXT NOT NULL,
          account_name TEXT,
          verification_code TEXT NOT NULL,
          code_expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);
      
      console.log('   Copying data to new table...');
      await db.run(sql`
        INSERT INTO pending_registrations_new 
          (id, email, password, name, role, phone, account_name, verification_code, code_expires_at, created_at)
        SELECT 
          id, email, password, name, role, phone, account_name, verification_code, code_expires_at, created_at
        FROM pending_registrations
      `);
      
      console.log('   Dropping old table...');
      await db.run(sql`DROP TABLE pending_registrations`);
      
      console.log('   Renaming new table...');
      await db.run(sql`ALTER TABLE pending_registrations_new RENAME TO pending_registrations`);
      
      console.log('✅ Schema fixed! Invalid columns removed.');
    } else {
      console.log('✅ Schema is correct - no invalid columns found.');
    }
    
    // 3. Verify the fix
    console.log('\n3️⃣ Verifying fixed structure...');
    const newTableInfo = await db.all(sql`PRAGMA table_info(pending_registrations)`);
    console.log('New columns:', newTableInfo.map((col: any) => col.name).join(', '));
    
    // 4. Check current pending registrations
    console.log('\n4️⃣ Checking pending registrations...');
    const pending = await db.all(sql`SELECT * FROM pending_registrations`);
    console.log(`Found ${pending.length} pending registration(s)`);
    
    if (pending.length > 0) {
      console.log('\nPending registrations:');
      pending.forEach((reg: any) => {
        console.log(`   - ${reg.email} (${reg.role}) - Code: ${reg.verification_code} - Expires: ${reg.code_expires_at}`);
      });
    }
    
    console.log('\n✅ Schema fix complete!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    throw error;
  }
}

fixPendingRegistrationsSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
