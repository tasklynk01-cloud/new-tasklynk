import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';
import * as schema from '@/db/schema';

// Load .env file if running in development or when environment variables are missing
if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
  try {
    const dotenv = require('dotenv');
    const path = require('path');
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
  } catch {
    // dotenv not available or failed to load - continue with existing env
  }
}

// Log database initialization attempt (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('[DB] Initializing Supabase PostgreSQL connection...', {
    hasUrl: !!process.env.DATABASE_URL,
    urlPrefix: (process.env.DATABASE_URL || '').trim().substring(0, 30) || 'not set',
  });
}

// Trim environment variables to handle whitespace from env files
const databaseUrl = (process.env.DATABASE_URL || '').trim();

if (!databaseUrl) {
  const errorMsg = 'DATABASE_URL must be set. Did you forget to provision a database?';
  console.error('[DB]', errorMsg);
  throw new Error(errorMsg);
}

// Strip query params (e.g. ?sslmode=require) from the connection string before
// passing it to `pg`. When both a `sslmode` query param AND an explicit `ssl`
// option are present, pg's connection-string parsing takes precedence and the
// `rejectUnauthorized: false` override below never actually applies - which
// silently produced SELF_SIGNED_CERT_IN_CHAIN failures on every query against
// Supabase's pooler (its certificate chain isn't in Node's default trust store).
const connectionStringForPool = databaseUrl.split('?')[0];

// Create connection pool
const poolConfig: PoolConfig = {
  connectionString: connectionStringForPool,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  // SSL required for Supabase
  ssl: databaseUrl.includes('supabase') ? {
    rejectUnauthorized: false,
  } : undefined,
};

const pool = new Pool(poolConfig);

// Initialize Drizzle with schema
const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

if (process.env.NODE_ENV === 'development') {
  console.log('[DB] Database client initialized successfully');
}

// Export singleton instances
export { db };
export type Database = typeof db;

/**
 * Execute a database query with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options?: { maxRetries?: number; initialDelay?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelay ?? 1000;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`[DB] Query failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Get pool status for monitoring
 */
export function getDbHealthStatus() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[DB] Closing pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[DB] Closing pool...');
  await pool.end();
  process.exit(0);
});
