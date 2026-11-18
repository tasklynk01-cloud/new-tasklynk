import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderAmountAdjustments, users, jobs } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq, desc, and, sql, or } from 'drizzle-orm';

// GET /api/v2/order-adjustments - Get all order adjustments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const changeType = searchParams.get('changeType');
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Authentication check
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const conditions = [];
    
    if (status) {
      conditions.push(eq(orderAmountAdjustments.status, status));
    }
    
    if (changeType) {
      conditions.push(eq(orderAmountAdjustments.changeType, changeType));
    }
    
    if (jobId) {
      conditions.push(eq(orderAmountAdjustments.jobId, parseInt(jobId)));
    }

    // Build query
    const adjustments = await db
      .select({
        id: orderAmountAdjustments.id,
        jobId: orderAmountAdjustments.jobId,
        changedBy: orderAmountAdjustments.changedBy,
        changeType: orderAmountAdjustments.changeType,
        amount: orderAmountAdjustments.amount,
        previousTotal: orderAmountAdjustments.previousTotal,
        newTotal: orderAmountAdjustments.newTotal,
        reason: orderAmountAdjustments.reason,
        status: orderAmountAdjustments.status,
        approvedBy: orderAmountAdjustments.approvedBy,
        approvedAt: orderAmountAdjustments.approvedAt,
        rejectedAt: orderAmountAdjustments.rejectedAt,
        rejectionReason: orderAmountAdjustments.rejectionReason,
        appliedAt: orderAmountAdjustments.appliedAt,
        createdAt: orderAmountAdjustments.createdAt,
        // Job info
        jobTitle: jobs.title,
        jobDisplayId: jobs.displayId,
        // Requester info
        changedByName: users.name,
      })
      .from(orderAmountAdjustments)
      .leftJoin(jobs, eq(orderAmountAdjustments.jobId, jobs.id))
      .leftJoin(users, eq(orderAmountAdjustments.changedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orderAmountAdjustments.createdAt))
      .limit(limit)
      .offset(offset);

    // Get approver names
    const approverIds = [...new Set(adjustments.filter(a => a.approvedBy).map(a => a.approvedBy!))];
    const approvers = approverIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(sql`${users.id} IN ${approverIds}`)
      : [];
    const approverMap = Object.fromEntries(approvers.map(u => [u.id, u.name]));

    // Add approver names
    const result = adjustments.map(a => ({
      ...a,
      approvedByName: a.approvedBy ? approverMap[a.approvedBy] || null : null,
    }));

    // Get counts by status
    const statusCounts = await db
      .select({
        status: orderAmountAdjustments.status,
        count: sql<number>`count(*)`,
      })
      .from(orderAmountAdjustments)
      .groupBy(orderAmountAdjustments.status);

    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      applied: 0,
      total: 0,
    };

    statusCounts.forEach(sc => {
      if (sc.status in counts) {
        (counts as any)[sc.status] = sc.count;
      }
      counts.total += sc.count;
    });

    return NextResponse.json({
      success: true,
      adjustments: result,
      counts,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching order adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order adjustments' },
      { status: 500 }
    );
  }
}

// POST /api/v2/order-adjustments - Create new adjustment request
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { jobId, changeType, amount, reason } = body;

    if (!jobId || !changeType || amount === undefined || !reason) {
      return NextResponse.json(
        { error: 'jobId, changeType, amount, and reason are required' },
        { status: 400 }
      );
    }

    // Get current job total
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const previousTotal = job.amount || 0;
    const newTotal = previousTotal + amount;

    const [adjustment] = await db
      .insert(orderAmountAdjustments)
      .values({
        jobId,
        changedBy: authCheck.user?.id || null,
        changeType,
        amount,
        previousTotal,
        newTotal,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      adjustment,
    });
  } catch (error) {
    console.error('Error creating order adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to create order adjustment' },
      { status: 500 }
    );
  }
}

