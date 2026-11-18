import 'dotenv/config';
import { createClient } from '@libsql/client';

const REQUIRED_COLUMNS: { name: string; ddl: string }[] = [
  { name: 'uploaded_by_role', ddl: "ALTER TABLE order_files ADD COLUMN uploaded_by_role TEXT" },
  { name: 'file_classification', ddl: "ALTER TABLE order_files ADD COLUMN file_classification TEXT NOT NULL DEFAULT 'other'" },
  { name: 'notes', ddl: "ALTER TABLE order_files ADD COLUMN notes TEXT" },
  { name: 'version_number', ddl: "ALTER TABLE order_files ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1" },
  { name: 'created_at', ddl: "ALTER TABLE order_files ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))" },
];

async function ensureOrderFilesTable() {
  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Missing Turso database credentials in environment');
  }

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('[DB] Checking order_files table...');
    const tableResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='order_files'"
    );

    if (tableResult.rows.length === 0) {
      console.log('[DB] order_files table missing. Creating...');
      await client.execute(`
        CREATE TABLE order_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          uploaded_by_role TEXT,
          file_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_classification TEXT NOT NULL DEFAULT 'other',
          notes TEXT,
          version_number INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await client.execute("CREATE INDEX IF NOT EXISTS idx_order_files_order ON order_files(order_id)");
      console.log('[DB] order_files table created successfully');
      return;
    }

    const info = await client.execute('PRAGMA table_info(order_files)');
    const columnNames = new Set(
      info.rows.map((row: any) => {
        if (row && typeof row === 'object' && 'name' in row) {
          return String(row.name);
        }
        if (Array.isArray(row) && row.length > 1) {
          return String(row[1]);
        }
        return '';
      }).filter(Boolean)
    );

    let added = 0;
    for (const column of REQUIRED_COLUMNS) {
      if (!columnNames.has(column.name)) {
        console.log(`[DB] Adding missing column ${column.name}...`);
        await client.execute(column.ddl);
        added += 1;
      } else {
        console.log(`[DB] ✓ Column ${column.name} already exists`);
      }
    }

    if (added === 0) {
      console.log('[DB] All required columns already present.');
    } else {
      console.log(`[DB] Added ${added} column(s) to order_files.`);
    }
  } finally {
    await client.close();
  }
}

ensureOrderFilesTable()
  .then(() => {
    console.log('[DB] order_files schema check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[DB] Failed to fix order_files table:', error);
    process.exit(1);
  });
