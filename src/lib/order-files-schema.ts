import { db } from '@/db';
import { sql } from 'drizzle-orm';

let schemaReady = false;
let schemaPromise: Promise<void> | null = null;

async function createOrderFilesTable() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS order_files (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `));
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_order_files_order ON order_files(order_id)`);
}

async function addMissingColumns(existingColumns: Set<string>) {
  if (!existingColumns.has('uploaded_by_role')) {
    await db.execute(sql.raw(`ALTER TABLE order_files ADD COLUMN uploaded_by_role TEXT`));
  }

  if (!existingColumns.has('file_classification')) {
    await db.execute(sql.raw(`ALTER TABLE order_files ADD COLUMN file_classification TEXT NOT NULL DEFAULT 'other'`));
  }

  if (!existingColumns.has('notes')) {
    await db.execute(sql.raw(`ALTER TABLE order_files ADD COLUMN notes TEXT`));
  }

  if (!existingColumns.has('version_number')) {
    await db.execute(sql.raw(`ALTER TABLE order_files ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1`));
  }

  if (!existingColumns.has('created_at')) {
    await db.execute(sql.raw(`ALTER TABLE order_files ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`));
  }
}

async function ensureInternal() {
  const tableExists = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'order_files'`);

  if (tableExists.rows.length === 0) {
    await createOrderFilesTable();
    schemaReady = true;
    return;
  }

  const info = await db.execute(sql`SELECT column_name as name FROM information_schema.columns WHERE table_name = 'order_files'`);
  const columnNames = new Set(
    info.rows
      .map((row: any) => {
        if (row && typeof row === 'object' && 'name' in row) {
          return String(row.name);
        }
        return '';
      })
      .filter(Boolean)
  );

  await addMissingColumns(columnNames);
  schemaReady = true;
}

export async function ensureOrderFilesSchema(): Promise<void> {
  if (schemaReady) {
    return;
  }

  if (!schemaPromise) {
    schemaPromise = ensureInternal().catch((error) => {
      console.error('[order-files-schema] Failed to ensure schema:', error);
      schemaReady = false;
    }).finally(() => {
      schemaPromise = null;
    });
  }

  await schemaPromise;
}
