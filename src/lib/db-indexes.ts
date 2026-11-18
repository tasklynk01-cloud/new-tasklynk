/**
 * Database Indexes and Query Optimization
 * 
 * Gap #16: Optimize database queries and add indexes
 * 
 * This file contains SQL migration scripts to add indexes for frequently queried columns.
 * Run these migrations to improve query performance.
 */

/**
 * Recommended database indexes for optimal performance
 * 
 * These indexes should be added to improve query performance on frequently accessed columns.
 */
export const RECOMMENDED_INDEXES = [
  // Users table indexes
  {
    name: 'idx_users_email',
    table: 'users',
    columns: ['email'],
    unique: true,
    description: 'Index on email for fast login lookups',
  },
  {
    name: 'idx_users_role',
    table: 'users',
    columns: ['role'],
    description: 'Index on role for role-based queries',
  },
  {
    name: 'idx_users_status',
    table: 'users',
    columns: ['status'],
    description: 'Index on status for filtering active users',
  },
  {
    name: 'idx_users_approved',
    table: 'users',
    columns: ['approved'],
    description: 'Index on approved for filtering approved users',
  },
  {
    name: 'idx_users_role_status',
    table: 'users',
    columns: ['role', 'status'],
    description: 'Composite index for role and status queries',
  },
  {
    name: 'idx_users_manager',
    table: 'users',
    columns: ['assigned_manager_id'],
    description: 'Index for manager assignment lookups',
  },
  
  // Jobs table indexes
  {
    name: 'idx_jobs_client',
    table: 'jobs',
    columns: ['client_id'],
    description: 'Index on client_id for client order queries',
  },
  {
    name: 'idx_jobs_freelancer',
    table: 'jobs',
    columns: ['assigned_freelancer_id'],
    description: 'Index on assigned_freelancer_id for freelancer queries',
  },
  {
    name: 'idx_jobs_manager',
    table: 'jobs',
    columns: ['manager_id'],
    description: 'Index on manager_id for manager order queries',
  },
  {
    name: 'idx_jobs_status',
    table: 'jobs',
    columns: ['status'],
    description: 'Index on status for status-based filtering',
  },
  {
    name: 'idx_jobs_created',
    table: 'jobs',
    columns: ['created_at'],
    description: 'Index on created_at for chronological queries',
  },
  {
    name: 'idx_jobs_deadline',
    table: 'jobs',
    columns: ['deadline'],
    description: 'Index on deadline for deadline-based queries',
  },
  {
    name: 'idx_jobs_client_status',
    table: 'jobs',
    columns: ['client_id', 'status'],
    description: 'Composite index for client orders by status',
  },
  {
    name: 'idx_jobs_freelancer_status',
    table: 'jobs',
    columns: ['assigned_freelancer_id', 'status'],
    description: 'Composite index for freelancer orders by status',
  },
  {
    name: 'idx_jobs_manager_status',
    table: 'jobs',
    columns: ['manager_id', 'status'],
    description: 'Composite index for manager orders by status',
  },
  
  // Payments table indexes
  {
    name: 'idx_payments_job',
    table: 'payments',
    columns: ['job_id'],
    description: 'Index on job_id for payment lookups',
  },
  {
    name: 'idx_payments_client',
    table: 'payments',
    columns: ['client_id'],
    description: 'Index on client_id for client payment queries',
  },
  {
    name: 'idx_payments_freelancer',
    table: 'payments',
    columns: ['freelancer_id'],
    description: 'Index on freelancer_id for freelancer payment queries',
  },
  {
    name: 'idx_payments_status',
    table: 'payments',
    columns: ['status'],
    description: 'Index on status for payment status filtering',
  },
  {
    name: 'idx_payments_created',
    table: 'payments',
    columns: ['created_at'],
    description: 'Index on created_at for payment history queries',
  },
  
  // Messages table indexes
  {
    name: 'idx_job_messages_job',
    table: 'job_messages',
    columns: ['job_id'],
    description: 'Index on job_id for message queries',
  },
  {
    name: 'idx_job_messages_sender',
    table: 'job_messages',
    columns: ['sender_id'],
    description: 'Index on sender_id for sender message queries',
  },
  {
    name: 'idx_job_messages_created',
    table: 'job_messages',
    columns: ['created_at'],
    description: 'Index on created_at for chronological message queries',
  },
  
  // Notifications table indexes
  {
    name: 'idx_notifications_user',
    table: 'notifications',
    columns: ['user_id'],
    description: 'Index on user_id for user notification queries',
  },
  {
    name: 'idx_notifications_read',
    table: 'notifications',
    columns: ['read'],
    description: 'Index on read for unread notification queries',
  },
  {
    name: 'idx_notifications_created',
    table: 'notifications',
    columns: ['created_at'],
    description: 'Index on created_at for chronological notification queries',
  },
  {
    name: 'idx_notifications_user_read',
    table: 'notifications',
    columns: ['user_id', 'read'],
    description: 'Composite index for user unread notifications',
  },
  
  // Manager assignments indexes
  {
    name: 'idx_manager_freelancers_manager',
    table: 'manager_freelancers',
    columns: ['manager_id'],
    description: 'Index on manager_id for manager-freelancer queries',
  },
  {
    name: 'idx_manager_freelancers_freelancer',
    table: 'manager_freelancers',
    columns: ['freelancer_id'],
    description: 'Index on freelancer_id for freelancer-manager queries',
  },
  {
    name: 'idx_manager_freelancers_status',
    table: 'manager_freelancers',
    columns: ['status'],
    description: 'Index on status for active assignment queries',
  },
  {
    name: 'idx_manager_clients_manager',
    table: 'manager_clients',
    columns: ['manager_id'],
    description: 'Index on manager_id for manager-client queries',
  },
  {
    name: 'idx_manager_clients_client',
    table: 'manager_clients',
    columns: ['client_id'],
    description: 'Index on client_id for client-manager queries',
  },
  {
    name: 'idx_manager_clients_status',
    table: 'manager_clients',
    columns: ['status'],
    description: 'Index on status for active assignment queries',
  },
];

/**
 * Generate SQL migration script for indexes
 */
export function generateIndexMigration(): string {
  const statements = RECOMMENDED_INDEXES.map(index => {
    const unique = index.unique ? 'UNIQUE' : '';
    const columns = index.columns.join(', ');
    return `CREATE ${unique} INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${columns}); -- ${index.description}`;
  });
  
  return statements.join('\n');
}

/**
 * Query optimization tips
 */
export const QUERY_OPTIMIZATION_TIPS = {
  // Use select() with specific columns instead of select all
  useSpecificColumns: 'Always specify columns in select() instead of selecting all',
  
  // Use limit() for pagination
  useLimit: 'Always use limit() and offset() for paginated queries',
  
  // Avoid N+1 queries
  avoidNPlusOne: 'Use eager loading or batch queries instead of loops',
  
  // Use indexes
  useIndexes: 'Ensure queries use indexed columns in WHERE clauses',
  
  // Batch operations
  useBatch: 'Use db.batch() for multiple related operations',
  
  // Connection pooling
  usePooling: 'Use connection pooling for better performance',
};


