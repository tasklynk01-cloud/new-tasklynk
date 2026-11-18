import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env file with override
dotenv.config({ override: true });

// Trim environment variables to handle any trailing whitespace from .env files
// Strip query params (e.g. ?sslmode=require) - drizzle-kit's CLI tooling doesn't
// honor sslmode itself and fails with SELF_SIGNED_CERT_IN_CHAIN against
// Supabase's pooler; ssl is configured explicitly below instead, matching what
// src/db/index.ts already does for the app's own runtime connection.
const databaseUrl = (process.env.DATABASE_URL || '').trim().split('?')[0];

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
    ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  },
});

export default dbConfig;
