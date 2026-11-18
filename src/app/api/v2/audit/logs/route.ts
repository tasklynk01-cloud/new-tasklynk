import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminAuditLogs, users } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { desc, eq, gte, lte, and, or, like, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Admin/Manager only access
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  
  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
  const offset = (page - 1) * limit;

  // Filters
  const adminId = searchParams.get('adminId');
  const action = searchParams.get('action');
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const search = searchParams.get('search');

  try {
    // Build where conditions
    const whereConditions = [];

    if (adminId) {
      whereConditions.push(eq(adminAuditLogs.adminId, parseInt(adminId)));
    }

    if (action) {
      whereConditions.push(eq(adminAuditLogs.action, action));
    }

    if (targetType) {
      whereConditions.push(eq(adminAuditLogs.targetType, targetType));
    }

    if (targetId) {
      whereConditions.push(eq(adminAuditLogs.targetId, parseInt(targetId)));
    }

    if (dateFrom) {
      whereConditions.push(gte(adminAuditLogs.createdAt, dateFrom));
    }

    if (dateTo) {
      whereConditions.push(lte(adminAuditLogs.createdAt, dateTo));
    }

    if (search) {
      whereConditions.push(
        or(
          like(adminAuditLogs.action, `%${search}%`),
          like(adminAuditLogs.details, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(adminAuditLogs)
      .where(whereClause);

    const total = totalResult.count;

    // Get audit logs with admin user details
    const logs = await db
      .select({
        id: adminAuditLogs.id,
        adminId: adminAuditLogs.adminId,
        adminName: users.name,
        adminEmail: users.email,
        action: adminAuditLogs.action,
        targetId: adminAuditLogs.targetId,
        targetType: adminAuditLogs.targetType,
        details: adminAuditLogs.details,
        ipAddress: adminAuditLogs.ipAddress,
        userAgent: adminAuditLogs.userAgent,
        timestamp: adminAuditLogs.timestamp,
        createdAt: adminAuditLogs.createdAt
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
      .where(whereClause)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON details field
    const formattedLogs = logs.map(log => ({
      ...log,
      details: log.details || null
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrevious
      },
      filters: {
        adminId,
        action,
        targetType,
        targetId,
        dateFrom,
        dateTo,
        search
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Admin only access for log deletion
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const daysToKeep = parseInt(searchParams.get('daysToKeep') || '90');
  const action = searchParams.get('action');

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    // Build where conditions
    const whereConditions = [lte(adminAuditLogs.createdAt, cutoffString)];
    
    if (action) {
      whereConditions.push(eq(adminAuditLogs.action, action));
    }

    // Delete old audit logs
    await db
      .delete(adminAuditLogs)
      .where(and(...whereConditions));

    return NextResponse.json({
      message: `Deleted audit logs older than ${daysToKeep} days`,
      cutoffDate: cutoffString,
      action: action || 'all'
    });

  } catch (error) {
    console.error('Error deleting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete audit logs' },
      { status: 500 }
    );
  }
}

