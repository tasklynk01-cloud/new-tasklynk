import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Define all expected tables with their critical columns
const EXPECTED_TABLES: Record<string, { table: string; criticalColumns: string[] }> = {
  users: { table: 'users', criticalColumns: ['id', 'email', 'role', 'display_id', 'password'] },
  jobs: { table: 'jobs', criticalColumns: ['id', 'client_id', 'display_id', 'order_number', 'status'] },
  submissions: { table: 'submissions', criticalColumns: ['id', 'job_id', 'writer_id', 'submission_type', 'status'] },
  submission_files: { table: 'submission_files', criticalColumns: ['id', 'submission_id', 'file_url'] },
  bids: { table: 'bids', criticalColumns: ['id', 'job_id', 'freelancer_id', 'status'] },
  payments: { table: 'payments', criticalColumns: ['id', 'job_id', 'status', 'amount'] },
  manager_invitations: { table: 'manager_invitations', criticalColumns: ['id', 'email', 'token', 'status'] },
  job_attachments: { table: 'job_attachments', criticalColumns: ['id', 'job_id', 'file_url'] },
  order_files: { table: 'order_files', criticalColumns: ['id', 'order_id', 'file_url'] },
  pending_registrations: { table: 'pending_registrations', criticalColumns: ['id', 'email', 'verification_code'] },
  messages: { table: 'messages', criticalColumns: ['id', 'sender_id', 'receiver_id'] },
  email_verification_codes: { table: 'email_verification_codes', criticalColumns: ['id', 'user_id', 'code'] },
  admin_audit_logs: { table: 'admin_audit_logs', criticalColumns: ['id', 'admin_id', 'action'] },
  writers: { table: 'writers', criticalColumns: ['id', 'user_id'] },
  managers: { table: 'managers', criticalColumns: ['id', 'user_id'] },
};

// Define expected environment variables
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'RESEND_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'PAYSTACK_SECRET_KEY',
];

async function checkEnvironmentVariables() {
  const missing = [];
  const configured = [];

  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (value) {
      configured.push(varName);
    } else {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
  }
  return missing.length === 0;
}

async function checkDatabaseConnection() {
  try {
    const result = await db.execute(sql`SELECT 1 as connection_test`);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkAllTables() {
  const results: Record<string, { exists: boolean; columns: string[] }> = {};

  for (const [key, config] of Object.entries(EXPECTED_TABLES)) {
    try {
      const tableCheck = await db.execute(sql.raw(`SELECT column_name as name FROM information_schema.columns WHERE table_name = '${config.table}'`));
      const columns = tableCheck.rows.map((row: any) => row.name);
      const missingColumns = config.criticalColumns.filter(col => !columns.includes(col));

      results[key] = { exists: true, columns };

      if (missingColumns.length === 0) {
      } else {
      }
    } catch (error) {
      results[key] = { exists: false, columns: [] };
    }
  }

  const existingTables = Object.values(results).filter(r => r.exists).length;
  return existingTables === Object.keys(EXPECTED_TABLES).length;
}

async function checkDataIntegrity() {

  // Check users table
  try {
    const usersCount = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
    const total = (usersCount.rows[0] as any).total;

    // Check for different roles
    const roleCheck = await db.execute(sql`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    for (const row of roleCheck.rows) {
    }
  } catch (error) {
  }

  // Check jobs table
  try {
    const jobsCount = await db.execute(sql`SELECT COUNT(*) as total FROM jobs`);
    const total = (jobsCount.rows[0] as any).total;

    // Check job statuses
    const statusCheck = await db.execute(sql`
      SELECT status, COUNT(*) as count
      FROM jobs
      GROUP BY status
    `);
    for (const row of statusCheck.rows) {
    }
  } catch (error) {
  }

  // Check submissions
  try {
    const submissionsCount = await db.execute(sql`SELECT COUNT(*) as total FROM submissions`);
    const total = (submissionsCount.rows[0] as any).total;
  } catch (error) {
  }

  // Check payments
  try {
    const paymentsCount = await db.execute(sql`SELECT COUNT(*) as total FROM payments`);
    const total = (paymentsCount.rows[0] as any).total;

    const statusCheck = await db.execute(sql`
      SELECT status, COUNT(*) as count
      FROM payments
      GROUP BY status
    `);
    for (const row of statusCheck.rows) {
    }
  } catch (error) {
  }

  // Check manager invitations
  try {
    const invitationsCount = await db.execute(sql`SELECT COUNT(*) as total FROM manager_invitations`);
    const total = (invitationsCount.rows[0] as any).total;
  } catch (error) {
  }
}

async function checkForeignKeyRelationships() {

  try {
    // Check if submissions reference valid jobs
    const orphanedSubmissions = await db.execute(sql`
      SELECT s.id, s.job_id
      FROM submissions s
      LEFT JOIN jobs j ON s.job_id = j.id
      WHERE j.id IS NULL
      LIMIT 10
    `);
    if (orphanedSubmissions.rows.length > 0) {
    } else {
    }

    // Check if submission_files reference valid submissions
    const orphanedFiles = await db.execute(sql`
      SELECT sf.id, sf.submission_id
      FROM submission_files sf
      LEFT JOIN submissions s ON sf.submission_id = s.id
      WHERE s.id IS NULL
      LIMIT 10
    `);
    if (orphanedFiles.rows.length > 0) {
    } else {
    }

    // Check if jobs reference valid clients
    const orphanedJobs = await db.execute(sql`
      SELECT j.id, j.client_id
      FROM jobs j
      LEFT JOIN users u ON j.client_id = u.id
      WHERE u.id IS NULL
      LIMIT 10
    `);
    if (orphanedJobs.rows.length > 0) {
    } else {
    }

  } catch (error) {
  }
}

async function checkStorageConfiguration() {

  const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET?.substring(0, 5) + '***', // Mask secret
  };

  if (cloudinaryConfig.cloud_name && cloudinaryConfig.api_key) {
  } else {
  }

  // Check file attachments in database
  try {
    const attachmentsCount = await db.execute(sql`SELECT COUNT(*) as total FROM job_attachments`);
    const total = (attachmentsCount.rows[0] as any).total;
  } catch (error) {
  }
}

async function checkWorkflows() {

  // Check registration to verification flow
  try {
    const pendingCount = await db.execute(sql`SELECT COUNT(*) as total FROM pending_registrations`);
    const total = (pendingCount.rows[0] as any).total;

    const verificationCodesCount = await db.execute(sql`SELECT COUNT(*) as total FROM email_verification_codes`);
    const codeTotal = (verificationCodesCount.rows[0] as any).total;
  } catch (error) {
  }

  // Check freelancer workflow: job -> bid -> assignment -> submission
  try {
    const jobsWithAssignments = await db.execute(sql`
      SELECT COUNT(*) as assigned_jobs
      FROM jobs
      WHERE assigned_freelancer_id IS NOT NULL
    `);
    const assignedCount = (jobsWithAssignments.rows[0] as any).assigned_jobs;

    const jobsWithSubmissions = await db.execute(sql`
      SELECT COUNT(DISTINCT j.id) as jobs_with_submissions
      FROM jobs j
      JOIN submissions s ON j.id = s.job_id
    `);
    const submissionCount = (jobsWithSubmissions.rows[0] as any).jobs_with_submissions;
  } catch (error) {
  }

  // Check manager invitation workflow
  try {
    const managerInvitations = await db.execute(sql`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
      FROM manager_invitations
    `);
    const row = managerInvitations.rows[0] as any;
  } catch (error) {
  }
}

async function runAudit() {

  const envOk = await checkEnvironmentVariables();
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    process.exit(1);
  }

  await checkAllTables();
  await checkDataIntegrity();
  await checkForeignKeyRelationships();
  await checkStorageConfiguration();
  await checkWorkflows();
}

runAudit().catch(console.error);

