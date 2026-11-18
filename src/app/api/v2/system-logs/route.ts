import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { systemLogs, users } from '@/db/schema';
import { eq, and, desc, like, or, sql, gte, lte } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/system-logs
 * Get system logs with filtering and pagination (admin only)
 * Query params:
 * - type: Filter by log type (error, warn, info)
 * - action: Filter by action
 * - userId: Filter by user
 * - search: Search in message
 * - dateFrom, dateTo: Date range filter
 * - page, limit: Pagination
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (type) {
      whereConditions.push(eq(systemLogs.type, type));
    }
    if (action) {
      whereConditions.push(eq(systemLogs.action, action));
    }
    if (userId) {
      whereConditions.push(eq(systemLogs.userId, parseInt(userId)));
    }
    if (search) {
      whereConditions.push(
        or(
          like(systemLogs.message, `%${search}%`),
          like(systemLogs.action, `%${search}%`),
          like(systemLogs.context, `%${search}%`)
        )
      );
    }
    if (dateFrom) {
      whereConditions.push(gte(systemLogs.createdAt, dateFrom));
    }
    if (dateTo) {
      whereConditions.push(lte(systemLogs.createdAt, dateTo));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemLogs)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get logs with user info
    const logs = await db
      .select({
        id: systemLogs.id,
        type: systemLogs.type,
        message: systemLogs.message,
        userId: systemLogs.userId,
        action: systemLogs.action,
        context: systemLogs.context,
        createdAt: systemLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(systemLogs)
      .leftJoin(users, eq(systemLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get stats
    const statsResult = await db
      .select({
        type: systemLogs.type,
        count: sql<number>`count(*)`,
      })
      .from(systemLogs)
      .groupBy(systemLogs.type);

    const stats = {
      total,
      errors: 0,
      warnings: 0,
      info: 0,
    };

    for (const stat of statsResult) {
      if (stat.type === 'error') stats.errors = stat.count;
      else if (stat.type === 'warn') stats.warnings = stat.count;
      else if (stat.type === 'info') stats.info = stat.count;
    }

    // Get unique actions for filter dropdown
    const actionsResult = await db
      .selectDistinct({ action: systemLogs.action })
      .from(systemLogs)
      .where(sql`${systemLogs.action} IS NOT NULL`);

    const actions = actionsResult.map(a => a.action).filter(Boolean);

    return NextResponse.json({
      logs,
      stats,
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/system-logs
 * Create a new system log entry
 * Body: { type, message, userId?, action?, context? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, userId, action, context } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }

    if (!['error', 'warn', 'info'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be error, warn, or info' },
        { status: 400 }
      );
    }

    const [log] = await db.insert(systemLogs).values({
      type,
      message,
      userId: userId || null,
      action: action || null,
      context: context ? JSON.stringify(context) : null,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({
      message: 'Log created successfully',
      log,
    });
  } catch (error: any) {
    console.error('Error creating system log:', error);
    return NextResponse.json(
      { error: 'Failed to create system log' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/system-logs
 * Clear old logs (admin only)
 * Query params:
 * - olderThan: Delete logs older than this date (ISO string)
 * - type: Only delete logs of this type
 */
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');
    const type = searchParams.get('type');

    if (!olderThan) {
      return NextResponse.json(
        { error: 'olderThan date is required' },
        { status: 400 }
      );
    }

    const whereConditions = [lte(systemLogs.createdAt, olderThan)];
    if (type) {
      whereConditions.push(eq(systemLogs.type, type));
    }

    const result = await db
      .delete(systemLogs)
      .where(and(...whereConditions));

    return NextResponse.json({
      message: 'Logs cleared successfully',
      deletedCount: result.rowCount || 0,
    });
  } catch (error: any) {
    console.error('Error clearing system logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear system logs' },
      { status: 500 }
    );
  }
}

