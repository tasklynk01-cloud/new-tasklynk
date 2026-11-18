// Database Migration Script - User Assignments & Invoicing System
// Run with: npx tsx create-user-assignment-tables.ts

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function createTables() {
  console.log('🔄 Starting database migration for User Assignments & Invoicing System...\n');

  try {
    // 1. Manager-Freelancer Assignments (Many-to-Many)
    console.log('Creating manager_freelancers table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS manager_freelancers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        assigned_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(manager_id, freelancer_id)
      );
    `);
    console.log('✅ manager_freelancers table created');

    // 2. Manager-Client Assignments (Many-to-Many)
    console.log('Creating manager_clients table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS manager_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        assigned_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(manager_id, client_id)
      );
    `);
    console.log('✅ manager_clients table created');

    // 3. Invoice Settlements
    console.log('Creating invoice_settlements table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS invoice_settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_type TEXT NOT NULL,
        settlement_amount REAL NOT NULL,
        orders_settled INTEGER NOT NULL,
        order_ids TEXT NOT NULL,
        balance_before_settlement REAL NOT NULL,
        balance_after_settlement REAL NOT NULL DEFAULT 0,
        notes TEXT,
        settled_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        settled_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log('✅ invoice_settlements table created');

    // 4. Order Settlements
    console.log('Creating order_settlements table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
        settlement_id INTEGER NOT NULL REFERENCES invoice_settlements(id) ON DELETE CASCADE,
        freelancer_amount REAL NOT NULL,
        manager_amount REAL NOT NULL DEFAULT 0,
        is_settled INTEGER NOT NULL DEFAULT 1,
        settled_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log('✅ order_settlements table created');

    // 5. User Fines
    console.log('Creating user_fines table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_fines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_type TEXT NOT NULL,
        job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
        fine_amount REAL NOT NULL,
        fine_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        balance_before_fine REAL NOT NULL,
        balance_after_fine REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'applied',
        issued_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        issued_at TEXT NOT NULL,
        reversed_at TEXT,
        reversed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        reversal_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    console.log('✅ user_fines table created');

    // 6. Order Additional Payments
    console.log('Creating order_additional_payments table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_additional_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        additional_amount REAL NOT NULL,
        reason TEXT NOT NULL,
        original_amount REAL NOT NULL,
        new_total_amount REAL NOT NULL,
        added_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        added_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log('✅ order_additional_payments table created');

    // 7. User Balance History
    console.log('Creating user_balance_history table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_balance_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        balance_before REAL NOT NULL,
        balance_after REAL NOT NULL,
        change_amount REAL NOT NULL,
        change_type TEXT NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        notes TEXT,
        changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log('✅ user_balance_history table created');

    // Create indexes for performance
    console.log('\nCreating indexes...');
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_manager_freelancers_manager ON manager_freelancers(manager_id);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_manager_freelancers_freelancer ON manager_freelancers(freelancer_id);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_manager_clients_manager ON manager_clients(manager_id);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_manager_clients_client ON manager_clients(client_id);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_invoice_settlements_user ON invoice_settlements(user_id);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_order_settlements_job ON order_settlements(job_id);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_fines_user ON user_fines(user_id);
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_balance_history_user ON user_balance_history(user_id);
    `);
    
    console.log('✅ Indexes created');

    console.log('\n🎉 All tables created successfully!');
    console.log('\n📋 Summary of new tables:');
    console.log('   1. manager_freelancers - Many-to-many assignments between managers and freelancers');
    console.log('   2. manager_clients - Many-to-many assignments between managers and clients');
    console.log('   3. invoice_settlements - Track when admin settles/pays out balances');
    console.log('   4. order_settlements - Track which orders have been settled (irreversible)');
    console.log('   5. user_fines - Fines issued to freelancers/managers');
    console.log('   6. order_additional_payments - Extra payments added to orders');
    console.log('   7. user_balance_history - Audit trail for all balance changes');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.close();
  }
}

// Migrate existing assignments from legacy assignedManagerId field to new tables
async function migrateExistingAssignments() {
  console.log('\n🔄 Migrating existing assignments from legacy field...');

  const migrateClient = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    // Get all users with assignedManagerId set
    const usersWithManager = await migrateClient.execute(`
      SELECT id, assigned_manager_id, role FROM users WHERE assigned_manager_id IS NOT NULL
    `);

    let freelancerMigrated = 0;
    let clientMigrated = 0;
    const now = new Date().toISOString();

    for (const row of usersWithManager.rows) {
      const userId = row.id as number;
      const managerId = row.assigned_manager_id as number;
      const role = row.role as string;

      if (role === 'freelancer') {
        // Check if already exists
        const existing = await migrateClient.execute({
          sql: `SELECT id FROM manager_freelancers WHERE manager_id = ? AND freelancer_id = ?`,
          args: [managerId, userId]
        });

        if (existing.rows.length === 0) {
          await migrateClient.execute({
            sql: `INSERT INTO manager_freelancers (manager_id, freelancer_id, status, assigned_at, created_at, updated_at)
                  VALUES (?, ?, 'active', ?, ?, ?)`,
            args: [managerId, userId, now, now, now]
          });
          freelancerMigrated++;
        }
      } else if (role === 'client' || role === 'account_owner') {
        // Check if already exists
        const existing = await migrateClient.execute({
          sql: `SELECT id FROM manager_clients WHERE manager_id = ? AND client_id = ?`,
          args: [managerId, userId]
        });

        if (existing.rows.length === 0) {
          await migrateClient.execute({
            sql: `INSERT INTO manager_clients (manager_id, client_id, status, assigned_at, created_at, updated_at)
                  VALUES (?, ?, 'active', ?, ?, ?)`,
            args: [managerId, userId, now, now, now]
          });
          clientMigrated++;
        }
      }
    }

    console.log(`✅ Migrated ${freelancerMigrated} freelancer assignments`);
    console.log(`✅ Migrated ${clientMigrated} client assignments`);

  } catch (error) {
    console.error('❌ Error migrating assignments:', error);
  } finally {
    migrateClient.close();
  }
}

async function main() {
  await createTables();
  await migrateExistingAssignments();
}

main().catch(console.error);
