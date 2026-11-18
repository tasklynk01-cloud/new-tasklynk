// Test script to verify memos table exists and create if missing
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkAndCreateMemosTable() {
  try {
    console.log('Checking if memos table exists...');
    
    // Check if memos table exists
    const tableCheck = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='memos';",
      args: [],
    });

    if (tableCheck.rows.length === 0) {
      console.log('❌ Memos table does NOT exist. Creating it now...');
      
      // Create memos table
      await client.execute(`
        CREATE TABLE memos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          target_role TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'normal',
          requires_acknowledgement INTEGER NOT NULL DEFAULT 1,
          expires_at TEXT,
          created_by INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      
      console.log('✅ Memos table created successfully!');
    } else {
      console.log('✅ Memos table already exists.');
    }

    // Check if memo_reads table exists
    const readsTableCheck = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='memo_reads';",
      args: [],
    });

    if (readsTableCheck.rows.length === 0) {
      console.log('❌ Memo_reads table does NOT exist. Creating it now...');
      
      // Create memo_reads table
      await client.execute(`
        CREATE TABLE memo_reads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          memo_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          read_at TEXT NOT NULL,
          acknowledged_at TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      
      console.log('✅ Memo_reads table created successfully!');
    } else {
      console.log('✅ Memo_reads table already exists.');
    }

    // Test memo creation
    console.log('\nTesting memo creation...');
    const now = new Date().toISOString();
    
    const result = await client.execute({
      sql: `
        INSERT INTO memos (
          title, content, target_role, priority, 
          requires_acknowledgement, expires_at,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        'Test Memo',
        'This is a test memo to verify the system is working.',
        'all',
        'normal',
        1,
        null,
        1, // Assuming admin user ID is 1
        now,
        now,
      ],
    });

    console.log(`✅ Test memo created with ID: ${result.lastInsertRowid}`);

    // Cleanup - delete test memo
    await client.execute({
      sql: 'DELETE FROM memos WHERE id = ?',
      args: [result.lastInsertRowid],
    });
    
    console.log('✅ Test memo deleted successfully.');
    console.log('\n🎉 All checks passed! Memo system is ready.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

checkAndCreateMemosTable();
