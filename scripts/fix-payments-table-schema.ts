import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function fixPaymentsTableSchema() {
  console.log('🔧 Fixing payments table schema...\n');

  try {
    // Get current table info
    console.log('📊 Checking current payments table structure...');
    const tableInfo = await db.all(sql`PRAGMA table_info(payments)`);
    console.log('Current columns:', tableInfo.map((col: any) => col.name).join(', '));

    const existingColumns = new Set(tableInfo.map((col: any) => col.name));
    const requiredColumns = [
      'id',
      'job_id',
      'client_id',
      'freelancer_id',
      'amount',
      'payment_method',
      'status',
      'mpesa_code',
      'admin_verification_code',
      'phone_number',
      'mpesa_checkout_request_id',
      'mpesa_merchant_request_id',
      'mpesa_receipt_number',
      'mpesa_transaction_date',
      'mpesa_result_desc',
      'paystack_reference',
      'paystack_access_code',
      'merchant_reference',
      'order_tracking_id',
      'confirmed_by_admin',
      'confirmed_at',
      'created_at',
      'updated_at'
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.has(col));

    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist!');
      return;
    }

    console.log('\n⚠️  Missing columns:', missingColumns.join(', '));
    console.log('\n🔧 Adding missing columns...\n');

    // Define column additions
    const columnDefinitions: Record<string, string> = {
      'job_id': 'ALTER TABLE payments ADD COLUMN job_id INTEGER REFERENCES users(id) ON DELETE CASCADE',
      'client_id': 'ALTER TABLE payments ADD COLUMN client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFAULT 0',
      'freelancer_id': 'ALTER TABLE payments ADD COLUMN freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL',
      'amount': 'ALTER TABLE payments ADD COLUMN amount REAL NOT NULL DEFAULT 0',
      'payment_method': 'ALTER TABLE payments ADD COLUMN payment_method TEXT NOT NULL DEFAULT "mpesa"',
      'status': 'ALTER TABLE payments ADD COLUMN status TEXT NOT NULL DEFAULT "pending"',
      'mpesa_code': 'ALTER TABLE payments ADD COLUMN mpesa_code TEXT',
      'admin_verification_code': 'ALTER TABLE payments ADD COLUMN admin_verification_code TEXT',
      'phone_number': 'ALTER TABLE payments ADD COLUMN phone_number TEXT',
      'mpesa_checkout_request_id': 'ALTER TABLE payments ADD COLUMN mpesa_checkout_request_id TEXT',
      'mpesa_merchant_request_id': 'ALTER TABLE payments ADD COLUMN mpesa_merchant_request_id TEXT',
      'mpesa_receipt_number': 'ALTER TABLE payments ADD COLUMN mpesa_receipt_number TEXT',
      'mpesa_transaction_date': 'ALTER TABLE payments ADD COLUMN mpesa_transaction_date TEXT',
      'mpesa_result_desc': 'ALTER TABLE payments ADD COLUMN mpesa_result_desc TEXT',
      'paystack_reference': 'ALTER TABLE payments ADD COLUMN paystack_reference TEXT',
      'paystack_access_code': 'ALTER TABLE payments ADD COLUMN paystack_access_code TEXT',
      'merchant_reference': 'ALTER TABLE payments ADD COLUMN merchant_reference TEXT',
      'order_tracking_id': 'ALTER TABLE payments ADD COLUMN order_tracking_id TEXT',
      'confirmed_by_admin': 'ALTER TABLE payments ADD COLUMN confirmed_by_admin INTEGER NOT NULL DEFAULT 0',
      'confirmed_at': 'ALTER TABLE payments ADD COLUMN confirmed_at TEXT',
      'created_at': 'ALTER TABLE payments ADD COLUMN created_at TEXT NOT NULL DEFAULT ""',
      'updated_at': 'ALTER TABLE payments ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""'
    };

    // Add each missing column
    for (const column of missingColumns) {
      if (columnDefinitions[column]) {
        console.log(`  Adding column: ${column}`);
        try {
          await db.run(sql.raw(columnDefinitions[column]));
          console.log(`  ✅ Added: ${column}`);
        } catch (error: any) {
          console.error(`  ❌ Failed to add ${column}:`, error.message);
        }
      }
    }

    // Verify all columns were added
    const updatedTableInfo = await db.all(sql`PRAGMA table_info(payments)`);
    const updatedColumns = new Set(updatedTableInfo.map((col: any) => col.name));
    const stillMissing = requiredColumns.filter(col => !updatedColumns.has(col));

    if (stillMissing.length === 0) {
      console.log('\n✅ All columns successfully added!');
    } else {
      console.log('\n⚠️  Still missing columns:', stillMissing.join(', '));
    }

    console.log('\n📊 Final payments table structure:');
    console.log(updatedTableInfo.map((col: any) => `  ${col.name} (${col.type})`).join('\n'));

  } catch (error) {
    console.error('❌ Error fixing payments table:', error);
    throw error;
  }
}

fixPaymentsTableSchema()
  .then(() => {
    console.log('\n🎉 Payments table schema fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to fix payments table:', error);
    process.exit(1);
  });
