import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { systemLogs, users } from '@/db/schema';
import { desc, eq, and, gte, lte, like, sql } from 'drizzle-orm';

// GET - Fetch system logs with filtering
export async function GET(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const type = searchParams.get('type'); // error, warn, info
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build conditions
    const conditions = [];
    
    if (type) {
      conditions.push(eq(systemLogs.type, type));
    }
    if (userId) {
      conditions.push(eq(systemLogs.userId, parseInt(userId)));
    }
    if (action) {
      conditions.push(like(systemLogs.action, `%${action}%`));
    }
    if (search) {
      conditions.push(like(systemLogs.message, `%${search}%`));
    }
    if (startDate) {
      conditions.push(gte(systemLogs.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(systemLogs.createdAt, endDate));
    }

    // Query with joins
    const logs = await db
      .select({
        id: systemLogs.id,
        type: systemLogs.type,
        message: systemLogs.message,
        userId: systemLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: systemLogs.action,
        context: systemLogs.context,
        createdAt: systemLogs.createdAt,
      })
      .from(systemLogs)
      .leftJoin(users, eq(systemLogs.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get counts by type
    const typeCounts = await db
      .select({
        type: systemLogs.type,
        count: sql<number>`count(*)`,
      })
      .from(systemLogs)
      .groupBy(systemLogs.type);

    // Get actions for filters
    const actionsResult = await db
      .selectDistinct({ action: systemLogs.action })
      .from(systemLogs)
      .where(sql`${systemLogs.action} IS NOT NULL`);

    return NextResponse.json({
      logs,
      total: countResult[0]?.count || 0,
      stats: {
        byType: typeCounts.reduce((acc, r) => {
          acc[r.type] = r.count;
          return acc;
        }, {} as Record<string, number>),
      },
      limit,
      offset,
      filters: {
        types: ['error', 'warn', 'info'],
        actions: actionsResult.map(r => r.action).filter(Boolean),
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json({ error: 'Failed to fetch system logs' }, { status: 500 });
  }
}

// POST - Create system log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, userId, action, context } = body;

    if (!type || !message) {
      return NextResponse.json({ error: 'Type and message are required' }, { status: 400 });
    }

    if (!['error', 'warn', 'info'].includes(type)) {
      return NextResponse.json({ error: 'Type must be error, warn, or info' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const [newLog] = await db.insert(systemLogs).values({
      type,
      message,
      userId: userId || null,
      action: action || null,
      context: context ? JSON.stringify(context) : null,
      createdAt: now,
    }).returning();

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error('Error creating system log:', error);
    return NextResponse.json({ error: 'Failed to create system log' }, { status: 500 });
  }
}

