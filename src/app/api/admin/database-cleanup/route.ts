import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

/**
 * POST /api/admin/database-cleanup
 * Admin-only endpoint to clean up deprecated database tables
 * 
 * DEPRECATED TABLES (identified in MISSING_FRONTEND_FEATURES_AUDIT.md Section 7):
 * 1. managerInvitations → Migrate to invitations, then DROP (still in active use - skip)
 * 2. jobStatusLogs → Migrate to orderHistory, then DROP (still in active use - skip)
 * 3. jobAttachments → Already migrated to orderFiles, DROP (still in active use - skip)
 * 4. jobMessages → Assess usage, possibly migrate to orderChatMessages (skip)
 * 5. revisions → Migrate to orderRevisions, then DROP (still in active use - skip)
 * 6. freelancerOnlineStatus → Use users.presenceStatus, DROP ✅ (migrated)
 * 7. managerOnlineStatus → Use users.presenceStatus, DROP ✅ (migrated)
 * 8. clientOnlineStatus → Use users.presenceStatus, DROP ✅ (migrated)
 * 
 * This endpoint safely drops only the online status tables since they've been migrated
 * to use users.presenceStatus field in all API endpoints.
 */

interface CleanupResult {
  tableName: string;
  action: 'dropped' | 'skipped' | 'error';
  message: string;
  recordsAffected?: number;
}

export async function POST(request: NextRequest) {
  // Verify admin role
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { action = 'preview', tables = [] } = body;

    // Valid actions: 'preview' (default), 'migrate', 'drop'
    if (!['preview', 'migrate', 'drop'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Use: preview, migrate, or drop'
      }, { status: 400 });
    }

    const results: CleanupResult[] = [];

    // Define deprecated tables that are SAFE to drop (APIs already migrated)
    const safeToDropTables = [
      'freelancer_online_status',
      'manager_online_status', 
      'client_online_status',
    ];

    // Tables that are still in active use - DO NOT DROP
    const activeUseTables = [
      'manager_invitations',  // Still used by invite system
      'job_status_logs',      // Still used by status change logging
      'job_attachments',      // Still used by file upload system
      'job_messages',         // Still used by messaging system
      'revisions',            // Still used by revision system
    ];

    if (action === 'preview') {
      // Preview what would be cleaned up
      for (const tableName of safeToDropTables) {
        try {
          const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
          const count = (countResult as any).rows?.[0]?.count || 0;
          results.push({
            tableName,
            action: 'skipped',
            message: `SAFE TO DROP: ${count} records will be lost (data already migrated to users.presenceStatus)`,
            recordsAffected: count,
          });
        } catch (e: any) {
          results.push({
            tableName,
            action: 'error',
            message: `Table may not exist: ${e.message}`,
          });
        }
      }

      for (const tableName of activeUseTables) {
        try {
          const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
          const count = (countResult as any).rows?.[0]?.count || 0;
          results.push({
            tableName,
            action: 'skipped',
            message: `STILL IN USE: ${count} records (API endpoints still using this table)`,
            recordsAffected: count,
          });
        } catch (e: any) {
          results.push({
            tableName,
            action: 'error',
            message: `Table may not exist: ${e.message}`,
          });
        }
      }

      return NextResponse.json({
        success: true,
        action: 'preview',
        message: 'Preview of database cleanup. Use action="drop" to execute.',
        safeToDropCount: safeToDropTables.length,
        stillInUseCount: activeUseTables.length,
        results,
      });
    }

    if (action === 'drop') {
      // Only drop safe tables that have been migrated
      const tablesToDrop = tables.length > 0 
        ? tables.filter((t: string) => safeToDropTables.includes(t))
        : safeToDropTables;

      for (const tableName of tablesToDrop) {
        try {
          // Get record count before drop
          const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
          const count = (countResult as any).rows?.[0]?.count || 0;

          // Drop the table
          await db.execute(sql.raw(`DROP TABLE IF EXISTS ${tableName}`));

          results.push({
            tableName,
            action: 'dropped',
            message: `Successfully dropped table`,
            recordsAffected: count,
          });
        } catch (e: any) {
          results.push({
            tableName,
            action: 'error',
            message: `Failed to drop: ${e.message}`,
          });
        }
      }

      return NextResponse.json({
        success: true,
        action: 'drop',
        message: 'Database cleanup completed',
        tablesDropped: results.filter(r => r.action === 'dropped').length,
        results,
      });
    }

    if (action === 'migrate') {
      // Migrate data from deprecated tables to primary tables before drop
      // This is a placeholder for future migration logic
      return NextResponse.json({
        success: false,
        action: 'migrate',
        message: 'Migration not yet implemented. The online status tables have already been migrated via API endpoint updates.',
        results: [],
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Database cleanup error:', error);
    return NextResponse.json({
      error: 'Failed to perform database cleanup',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/database-cleanup
 * Get current status of deprecated tables
 */
export async function GET(request: NextRequest) {
  // Verify admin role
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const deprecatedTables = [
      { name: 'freelancer_online_status', status: 'MIGRATED', recommendation: 'Safe to drop' },
      { name: 'manager_online_status', status: 'MIGRATED', recommendation: 'Safe to drop' },
      { name: 'client_online_status', status: 'MIGRATED', recommendation: 'Safe to drop' },
      { name: 'manager_invitations', status: 'ACTIVE', recommendation: 'Still in use by invite system' },
      { name: 'job_status_logs', status: 'ACTIVE', recommendation: 'Still in use - migrate to orderHistory' },
      { name: 'job_attachments', status: 'ACTIVE', recommendation: 'Still in use - migrate to orderFiles' },
      { name: 'job_messages', status: 'ACTIVE', recommendation: 'Assess usage vs orderChatMessages' },
      { name: 'revisions', status: 'LEGACY', recommendation: 'Migrate to orderRevisions' },
    ];

    const tableStats = [];

    for (const table of deprecatedTables) {
      try {
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table.name}`));
        const count = (countResult as any).rows?.[0]?.count || 0;
        tableStats.push({
          ...table,
          recordCount: count,
          exists: true,
        });
      } catch {
        tableStats.push({
          ...table,
          recordCount: 0,
          exists: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      deprecatedTables: tableStats,
      summary: {
        safeToDropNow: tableStats.filter(t => t.status === 'MIGRATED' && t.exists).length,
        stillInUse: tableStats.filter(t => t.status === 'ACTIVE').length,
        needsMigration: tableStats.filter(t => t.status === 'LEGACY').length,
      },
    });

  } catch (error: any) {
    console.error('Error getting cleanup status:', error);
    return NextResponse.json({
      error: 'Failed to get cleanup status',
      details: error.message,
    }, { status: 500 });
  }
}

