import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function checkUsersTable() {
  console.log('=== Checking Users Table Structure ===\n');
  
  try {
    // Get table info
    const result = await db.all(sql`PRAGMA table_info(users)`);
    
    console.log('Current users table columns:');
    console.log('='.repeat(80));
    
    result.forEach((col: any) => {
      console.log(`${col.name.padEnd(30)} | ${col.type.padEnd(15)} | ${col.notnull ? 'NOT NULL' : 'NULL'.padEnd(8)} | Default: ${col.dflt_value || 'none'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`Total columns: ${result.length}`);
    
    // Check for critical fields
    const columnNames = result.map((col: any) => col.name);
    const criticalFields = [
      'payment_terms',
      'client_tier',
      'client_priority',
      'assigned_manager_id',
      'approved',
      'status',
      'balance',
      'earned',
      'account_id',
      'account_name',
      'role',
      'role_id',
    ];
    
    console.log('\n=== Critical Fields Check ===');
    criticalFields.forEach(field => {
      const exists = columnNames.includes(field);
      console.log(`${field.padEnd(30)} : ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    // Get sample user to see actual data
    console.log('\n=== Sample User Data (First Client) ===');
    const sampleUser = await db.all(sql`
      SELECT id, email, name, role, payment_terms, client_tier, client_priority, 
             approved, status, balance, earned, account_id
      FROM users 
      WHERE role = 'client' 
      LIMIT 1
    `);
    
    if (sampleUser.length > 0) {
      console.log(JSON.stringify(sampleUser[0], null, 2));
    } else {
      console.log('No client users found');
    }
    
  } catch (error) {
    console.error('Error checking users table:', error);
  }
}

checkUsersTable()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
