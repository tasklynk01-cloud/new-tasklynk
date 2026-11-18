import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminAuditLogs, users } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { sql, count, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Admin/Manager only access
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d

  try {
    // Calculate date range based on period
    let daysBack: number;
    switch (period) {
      case '1d':
        daysBack = 1;
        break;
      case '7d':
        daysBack = 7;
        break;
      case '30d':
        daysBack = 30;
        break;
      case '90d':
        daysBack = 90;
        break;
      default:
        daysBack = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateString = startDate.toISOString();

    // Get audit statistics - using adminAuditLogs table
    const [
      totalEvents,
      eventsByAction,
      eventsOverTime,
      userActivity,
      recentCriticalEvents
    ] = await Promise.all([
      // Total events count
      db
        .select({ count: count() })
        .from(adminAuditLogs)
        .where(sql`${adminAuditLogs.createdAt} >= ${startDateString}`)
        .then(result => result[0]?.count || 0),

      // Events by action
      db
        .select({
          action: adminAuditLogs.action,
          count: count()
        })
        .from(adminAuditLogs)
        .where(sql`${adminAuditLogs.createdAt} >= ${startDateString}`)
        .groupBy(adminAuditLogs.action)
        .orderBy(desc(count())),

      // Events over time (daily breakdown)
      db
        .select({
          date: sql<string>`DATE(${adminAuditLogs.createdAt})`.as('date'),
          count: count()
        })
        .from(adminAuditLogs)
        .where(sql`${adminAuditLogs.createdAt} >= ${startDateString}`)
        .groupBy(sql`DATE(${adminAuditLogs.createdAt})`)
        .orderBy(sql`DATE(${adminAuditLogs.createdAt}) ASC`),

      // User activity (top active admins)
      db
        .select({
          adminId: adminAuditLogs.adminId,
          adminEmail: users.email,
          count: count()
        })
        .from(adminAuditLogs)
        .innerJoin(users, sql`${users.id} = ${adminAuditLogs.adminId}`)
        .where(sql`${adminAuditLogs.createdAt} >= ${startDateString}`)
        .groupBy(adminAuditLogs.adminId, users.email)
        .orderBy(desc(count()))
        .limit(10),

      // Recent critical events (failed actions)
      db
        .select({
          id: adminAuditLogs.id,
          action: adminAuditLogs.action,
          details: adminAuditLogs.details,
          adminEmail: users.email,
          createdAt: adminAuditLogs.createdAt
        })
        .from(adminAuditLogs)
        .innerJoin(users, sql`${users.id} = ${adminAuditLogs.adminId}`)
        .where(sql`${adminAuditLogs.createdAt} >= ${startDateString}`)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(20)
    ]);

    // Calculate growth rates (compare with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysBack);
    const previousStartDateString = previousStartDate.toISOString();

    const [previousTotalEvents] = await db
      .select({ count: count() })
      .from(adminAuditLogs)
      .where(sql`${adminAuditLogs.createdAt} >= ${previousStartDateString} AND ${adminAuditLogs.createdAt} < ${startDateString}`)
      .then(result => [result[0]?.count || 0]);

    const activityGrowth = previousTotalEvents > 0 
      ? ((totalEvents - previousTotalEvents) / previousTotalEvents * 100) 
      : 0;

    // Format the response
    return NextResponse.json({
      summary: {
        period,
        dateRange: {
          start: startDateString,
          end: new Date().toISOString()
        },
        totalEvents,
        activityGrowth: Math.round(activityGrowth * 100) / 100,
        criticalEventsCount: recentCriticalEvents.length
      },
      eventsByAction: eventsByAction.map(e => ({
        action: e.action,
        count: e.count,
        percentage: totalEvents > 0 ? Math.round((e.count / totalEvents) * 100 * 100) / 100 : 0
      })),
      eventsOverTime: eventsOverTime.map(e => ({
        date: e.date,
        total: e.count
      })),
      userActivity: userActivity.map(u => ({
        adminId: u.adminId,
        email: u.adminEmail,
        activityCount: u.count,
        percentage: totalEvents > 0 ? Math.round((u.count / totalEvents) * 100 * 100) / 100 : 0
      })),
      recentEvents: recentCriticalEvents.map(e => ({
        id: e.id,
        action: e.action,
        details: e.details,
        adminEmail: e.adminEmail,
        timestamp: e.createdAt
      }))
    });

  } catch (error) {
    console.error('Error generating audit statistics:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit statistics' },
      { status: 500 }
    );
  }
}

