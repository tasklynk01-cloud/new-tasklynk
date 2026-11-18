// Re-export the centralized database client
export { db, executeWithRetry, getDbHealthStatus } from '@/db';
export type { Database } from '@/db';

// Legacy compatibility: getDatabasePool returns a simple wrapper
export function getDatabasePool() {
  return {
    executeWithConnection: async <T>(operation: (db: any) => Promise<T>) => {
      const { db } = await import('@/db');
      return operation(db);
    },
    getStats: () => ({
      totalConnections: 1,
      activeConnections: 0,
      waitingRequests: 0,
    }),
    closeAll: async () => {},
  };
}

// Legacy re-exports
export { db as database } from '@/db';
