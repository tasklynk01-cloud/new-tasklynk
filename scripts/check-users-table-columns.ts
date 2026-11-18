import 'dotenv/config';
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkUsersTableColumns() {
  console.log('🔍 Checking users table columns...\n');

  try {
    // Get table structure
    const tableInfo = await db.all(sql`PRAGMA table_info(users)`);
    
    console.log('📋 Users table columns:');
    tableInfo.forEach((col: any) => {
      console.log(`   - ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.dflt_value ? `, default: ${col.dflt_value}` : ''})`);
    });
    
    console.log(`\n✅ Total columns: ${tableInfo.length}`);
    
    // Check for specific columns that might be missing
    const columnNames = tableInfo.map((col: any) => col.name);
    
    const requiredColumns = [
      'id', 'email', 'password', 'name', 'phone', 'role', 'role_id',
      'approved', 'email_verified', 'balance', 'earned', 'total_earnings',
      'rating', 'status', 'display_id', 'created_at', 'updated_at',
      'total_earned', 'total_spent', 'completed_jobs', 'rating_average',
      'rating_count', 'badge_list', 'presence_status', 'client_tier',
      'client_priority', 'payment_terms', 'skills_completed'
    ];
    
    console.log('\n🔍 Checking required columns:');
    const missingColumns: string[] = [];
    requiredColumns.forEach(col => {
      const exists = columnNames.includes(col);
      if (!exists) {
        console.log(`   ❌ ${col} - MISSING`);
        missingColumns.push(col);
      } else {
        console.log(`   ✅ ${col}`);
      }
    });
    
    if (missingColumns.length > 0) {
      console.log('\n⚠️ Missing columns:', missingColumns.join(', '));
    } else {
      console.log('\n✅ All required columns exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkUsersTableColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
