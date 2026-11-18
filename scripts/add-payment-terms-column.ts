import 'dotenv/config';
import { createClient } from '@libsql/client';

async function ensurePaymentTermsColumn() {
  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Missing Turso database credentials in environment');
  }

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const tableInfo = await client.execute({ sql: 'PRAGMA table_info(users);' });
    const hasColumn = tableInfo.rows?.some((row) => {
      const columnName = row[1] as string | undefined;
      return columnName === 'payment_terms';
    });

    if (hasColumn) {
      console.log('[DB] Column payment_terms already exists.');
      return;
    }

    console.log('[DB] Adding payment_terms column to users table...');
    await client.execute({ sql: "ALTER TABLE users ADD COLUMN payment_terms TEXT DEFAULT 'pod';" });
    await client.execute({ sql: "UPDATE users SET payment_terms = 'pod' WHERE payment_terms IS NULL;" });
    console.log('[DB] payment_terms column added and backfilled successfully.');
  } finally {
    await client.close();
  }
}

ensurePaymentTermsColumn().catch((error) => {
  console.error('[DB] Failed to add payment_terms column:', error);
  process.exitCode = 1;
});
