import 'dotenv/config';
import { createClient } from '@libsql/client';

async function main() {
  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Database credentials missing in environment');
  }

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    const result = await client.execute({ sql: 'PRAGMA table_info(users);' });
    const columnNames = result.rows?.map((row) => row[1]) ?? [];
    console.log('[DB] users columns:', columnNames);
  } finally {
    await client.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
