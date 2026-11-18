#!/usr/bin/env node

/**
 * FIX PAYMENTS TABLE - Make job_id nullable and add Pesapal columns
 * 
 * This script fixes the payments table to:
 * 1. Allow job_id to be NULL (for wallet top-ups)
 * 2. Add missing Pesapal columns (merchant_reference, order_tracking_id)
 * 3. Add admin_verification_code column
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('? TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN must be set in .env file');
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkColumnExists(tableName, columnName) {
  try {
    const result = await client.execute({
      sql: `PRAGMA table_info(${tableName})`,
      args: []
    });
    return result.rows.some(row => row.name === columnName);
  } catch (error) {
    console.error(`Error checking column ${columnName} in ${tableName}:`, error.message);
    return false;
  }
}

async function addColumn(tableName, columnName, columnDef) {
  try {
    await client.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    console.log(`? Added column: ${tableName}.${columnName}`);
    return true;
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log(`??  Column already exists: ${tableName}.${columnName}`);
      return true;
    }
    console.error(`? Error adding column ${columnName}:`, error.message);
    return false;
  }
}

async function fixPaymentsTable() {
  console.log('?? Fixing payments table for Pesapal integration...\n');

  // Test connection first
  console.log('?? Testing database connection...');
  try {
    await client.execute('SELECT 1');
    console.log('? Database connection successful!\n');
  } catch (error) {
    console.error('? Database connection failed:', error.message);
    process.exit(1);
  }

  // Check current payments table structure
  console.log('?? Checking current payments table structure...');
  const tableInfo = await client.execute('PRAGMA table_info(payments)');
  console.log('Current columns:');
  tableInfo.rows.forEach(row => {
    console.log(`   - ${row.name} (${row.type})${row.notnull ? ' NOT NULL' : ''}${row.pk ? ' PRIMARY KEY' : ''}`);
  });
  console.log('');

  // Since SQLite doesn't support ALTER COLUMN, we need to recreate the table
  // to make job_id nullable. Let's check if it's already nullable first.
  const jobIdColumn = tableInfo.rows.find(row => row.name === 'job_id');
  
  if (jobIdColumn && jobIdColumn.notnull === 1) {
    console.log('??  job_id is currently NOT NULL. Need to recreate table to make it nullable.');
    console.log('   This requires migrating data. Creating new table structure...\n');

    try {
      // Step 1: Create new table with correct structure
      await client.execute(`
        CREATE TABLE IF NOT EXISTS payments_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
          client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          amount REAL NOT NULL,
          payment_method TEXT NOT NULL DEFAULT 'mpesa',
          status TEXT NOT NULL DEFAULT 'pending',
          mpesa_code TEXT,
          admin_verification_code TEXT,
          phone_number TEXT,
          mpesa_checkout_request_id TEXT,
          mpesa_merchant_request_id TEXT,
          mpesa_receipt_number TEXT,
          mpesa_transaction_date TEXT,
          mpesa_result_desc TEXT,
          paystack_reference TEXT,
          merchant_reference TEXT,
          order_tracking_id TEXT,
          confirmed_by_admin INTEGER NOT NULL DEFAULT 0,
          confirmed_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      console.log('? Created payments_new table with nullable job_id');

      // Step 2: Copy data from old table
      await client.execute(`
        INSERT INTO payments_new (
          id, job_id, client_id, freelancer_id, amount, payment_method, status,
          mpesa_code, phone_number, mpesa_checkout_request_id, mpesa_merchant_request_id,
          mpesa_receipt_number, mpesa_transaction_date, mpesa_result_desc,
          paystack_reference, confirmed_by_admin, confirmed_at, created_at, updated_at
        )
        SELECT 
          id, job_id, client_id, freelancer_id, amount, payment_method, status,
          mpesa_code, phone_number, mpesa_checkout_request_id, mpesa_merchant_request_id,
          mpesa_receipt_number, mpesa_transaction_date, mpesa_result_desc,
          paystack_reference, confirmed_by_admin, confirmed_at, created_at, updated_at
        FROM payments
      `);
      console.log('? Copied data to payments_new');

      // Step 3: Drop old table
      await client.execute('DROP TABLE payments');
      console.log('? Dropped old payments table');

      // Step 4: Rename new table
      await client.execute('ALTER TABLE payments_new RENAME TO payments');
      console.log('? Renamed payments_new to payments');

      console.log('\n?? Successfully migrated payments table with nullable job_id!');
    } catch (error) {
      console.error('? Error during table migration:', error.message);
      console.error('   You may need to manually fix the table.');
      process.exit(1);
    }
  } else {
    console.log('? job_id is already nullable or doesn\'t exist yet.');
    
    // Just add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'merchant_reference', def: 'TEXT' },
      { name: 'order_tracking_id', def: 'TEXT' },
      { name: 'admin_verification_code', def: 'TEXT' },
    ];

    for (const col of columnsToAdd) {
      const exists = await checkColumnExists('payments', col.name);
      if (!exists) {
        await addColumn('payments', col.name, col.def);
      } else {
        console.log(`??  Column already exists: payments.${col.name}`);
      }
    }
  }

  // Verify final structure
  console.log('\n?? Final payments table structure:');
  const finalInfo = await client.execute('PRAGMA table_info(payments)');
  finalInfo.rows.forEach(row => {
    const nullableText = row.notnull ? 'NOT NULL' : 'NULLABLE';
    console.log(`   - ${row.name} (${row.type}) ${nullableText}`);
  });

  console.log('\n? Payments table fix complete!\n');
}

// Run the fix
fixPaymentsTable()
  .then(() => {
    console.log('? Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('? Script failed:', error);
    process.exit(1);
  });
