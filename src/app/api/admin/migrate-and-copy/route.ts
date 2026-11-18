import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export const preferredRegion = ["iad1"]; // runtime hint only

function getEnv(name: string, required = true) {
  const v = process.env[name];
  if (required && !v) throw new Error(`Missing env: ${name}`);
  return v as string;
}

function splitSqlStatements(sqlStr: string): string[] {
  // Remove line and block comments
  const withoutComments = sqlStr
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/--.*$/gm, ""); // line comments

  // Split on semicolons not inside quotes
  const parts = withoutComments
    .split(/;(?=(?:[^'\"]|'[^']*'|\"[^\"]*\")*$)/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts;
}

async function runMigrations(destDb: typeof db) {
  const drizzleDir = path.join(process.cwd(), "drizzle");
  const files = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied: { file: string; statements: number }[] = [];
  for (const file of files) {
    const full = path.join(drizzleDir, file);
    const fileSql = fs.readFileSync(full, "utf8");

    const statements = splitSqlStatements(fileSql);
    for (const stmt of statements) {
      if (!stmt) continue;
      try {
        await destDb.execute(sql.raw(stmt));
      } catch (e: any) {
        const msg = String(e?.message || e);
        const ignorable = [
          "already exists",
          "duplicate column",
          "duplicate key",
          "SQLITE_CONSTRAINT",
        ].some((k) => msg.toLowerCase().includes(k));
        if (!ignorable) {
          throw new Error(`Migration failed in ${file}: ${msg}`);
        }
      }
    }
    applied.push({ file, statements: statements.length });
  }
  return applied;
}

async function getVerificationData(destDb: typeof db) {
  const verification: any = {
    adminAccounts: [],
    userStatusDistribution: {},
    jobStatusDistribution: {},
    sampleUsers: [],
    sampleJobs: []
  };

  // Check admin accounts
  const adminEmails = [
    'topwriteessays@gmail.com',
    'm.d.techpoint25@gmail.com',
    'maguna956@gmail.com',
    'tasklynk01@gmail.com',
    'maxwellotieno11@gmail.com',
    'ashleydothy3162@gmail.com'
  ];

  for (const email of adminEmails) {
    try {
      const result = await destDb.execute(sql`SELECT email, name, role, approved FROM users WHERE email = ${email}`);

      if (result.rows.length > 0) {
        verification.adminAccounts.push(result.rows[0]);
      }
    } catch (error) {
      console.error(`Error checking admin ${email}:`, error);
    }
  }

  // User status distribution
  try {
    const approvedResult = await destDb.execute(sql`SELECT COUNT(*) as count FROM users WHERE approved = 1`);
    const pendingResult = await destDb.execute(sql`SELECT COUNT(*) as count FROM users WHERE approved = 0`);

    verification.userStatusDistribution = {
      approved: (approvedResult.rows[0] as any).count,
      pending: (pendingResult.rows[0] as any).count
    };
  } catch (error) {
    console.error('Error getting user status:', error);
  }

  // Job status distribution
  try {
    const statuses = ['pending', 'approved', 'assigned', 'in_progress', 'editing', 'delivered', 'revision', 'revision_pending', 'completed', 'cancelled'];

    for (const st of statuses) {
      const result = await destDb.execute(sql`SELECT COUNT(*) as count FROM jobs WHERE status = ${st}`);
      verification.jobStatusDistribution[st] = (result.rows[0] as any).count;
    }
  } catch (error) {
    console.error('Error getting job status:', error);
  }

  // Sample users
  try {
    const usersResult = await destDb.execute(sql`SELECT id, email, name, role, approved, created_at FROM users LIMIT 3`);
    verification.sampleUsers = usersResult.rows;
  } catch (error) {
    console.error('Error getting sample users:', error);
  }

  // Sample jobs
  try {
    const jobsResult = await destDb.execute(sql`SELECT id, display_id, title, status, amount, created_at FROM jobs LIMIT 3`);
    verification.sampleJobs = jobsResult.rows;
  } catch (error) {
    console.error('Error getting sample jobs:', error);
  }

  return verification;
}

export async function POST() {
  try {
    // 1) Run migrations on destination (one statement at a time)
    const appliedMigrations = await runMigrations(db);

    // 2) Get verification data
    const verification = await getVerificationData(db);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      appliedMigrations,
      verification,
      summary: {
        migrationsApplied: appliedMigrations.length,
      }
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

