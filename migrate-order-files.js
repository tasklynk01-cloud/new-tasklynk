/**
 * Database Migration Script
 * Adds uploadedByRole field to orderFiles table for tracking file source
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log('🔄 Starting database migration...\n');

    // Check if column exists
    const tableInfo = await db.execute("PRAGMA table_info(order_files)");
    const columns = tableInfo.rows.map((row: any) => row.name);
    
    if (columns.includes('uploaded_by_role')) {
      console.log('✅ Column uploaded_by_role already exists');
      return;
    }

    // Add uploaded_by_role column
    console.log('➕ Adding uploaded_by_role column to order_files table...');
    await db.execute(`
      ALTER TABLE order_files 
      ADD COLUMN uploaded_by_role TEXT
    `);
    console.log('✅ Column added successfully\n');

    // Set default values for existing records
    console.log('🔄 Setting default values for existing records...');
    await db.execute(`
      UPDATE order_files
      SET uploaded_by_role = 'client'
      WHERE uploaded_by_role IS NULL
    `);
    console.log('✅ Default values set\n');

    // Check if freelancerOrderResponses table exists
    console.log('🔍 Checking freelancerOrderResponses table...');
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.rows.map((row: any) => row.name);
    
    if (!tableNames.includes('freelancer_order_responses')) {
      console.log('📋 Creating freelancer_order_responses table...');
      await db.execute(`
        CREATE TABLE IF NOT EXISTS freelancer_order_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          freelancer_id INTEGER NOT NULL,
          job_id INTEGER NOT NULL,
          response TEXT NOT NULL,
          rejection_reason TEXT,
          response_time INTEGER,
          created_at TEXT NOT NULL,
          FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ freelancer_order_responses table created\n');
    } else {
      console.log('✅ freelancer_order_responses table already exists\n');
    }

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log('\n✅ Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
