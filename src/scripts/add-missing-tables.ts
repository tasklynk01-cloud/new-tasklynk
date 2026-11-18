import { db } from '@/db';

async function addMissingTablesAndFields() {

  try {
    // 1. Create invitations table
    await db.run(`
      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        used INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_by_admin_id INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create writer_balances table
    await db.run(`
      CREATE TABLE IF NOT EXISTS writer_balances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        writer_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        available_balance REAL NOT NULL DEFAULT 0,
        pending_balance REAL NOT NULL DEFAULT 0,
        total_earned REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create order_history table
    await db.run(`
      CREATE TABLE IF NOT EXISTS order_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        action TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT,
        actor_id INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Add manager_id column to jobs table if not exists
    try {
      await db.run(`ALTER TABLE jobs ADD COLUMN manager_id INTEGER REFERENCES users(id)`);
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
      } else {
        throw error;
      }
    }

    // 5. Add role column to manager_invitations table if not exists
    try {
      await db.run(`ALTER TABLE manager_invitations ADD COLUMN role TEXT DEFAULT 'manager'`);
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
      } else {
        throw error;
      }
    }

    // 6. Add status column to manager_invitations table if not exists
    try {
      await db.run(`ALTER TABLE manager_invitations ADD COLUMN status TEXT DEFAULT 'pending'`);
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
      } else {
        throw error;
      }
    }

    // 7. Create indexes for better performance
    
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_writer_balances_writer_id ON writer_balances(writer_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_order_history_job_id ON order_history(job_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_manager_id ON jobs(manager_id)`);
    


  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
addMissingTablesAndFields()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

