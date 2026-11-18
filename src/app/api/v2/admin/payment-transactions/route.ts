import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { paymentTransactions, users, jobs, payments } from '@/db/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

// GET - Fetch payment transactions with filtering
export async function GET(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');
    const transactionType = searchParams.get('transactionType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build conditions
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(paymentTransactions.userId, parseInt(userId)));
    }
    if (jobId) {
      conditions.push(eq(paymentTransactions.jobId, parseInt(jobId)));
    }
    if (transactionType) {
      conditions.push(eq(paymentTransactions.transactionType, transactionType));
    }
    if (status) {
      conditions.push(eq(paymentTransactions.status, status));
    }
    if (startDate) {
      conditions.push(gte(paymentTransactions.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(paymentTransactions.createdAt, endDate));
    }

    // Query with joins
    const transactions = await db
      .select({
        id: paymentTransactions.id,
        paymentId: paymentTransactions.paymentId,
        jobId: paymentTransactions.jobId,
        jobDisplayId: jobs.displayId,
        transactionType: paymentTransactions.transactionType,
        userId: paymentTransactions.userId,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        amount: paymentTransactions.amount,
        balanceBefore: paymentTransactions.balanceBefore,
        balanceAfter: paymentTransactions.balanceAfter,
        status: paymentTransactions.status,
        reason: paymentTransactions.reason,
        createdAt: paymentTransactions.createdAt,
      })
      .from(paymentTransactions)
      .leftJoin(users, eq(paymentTransactions.userId, users.id))
      .leftJoin(jobs, eq(paymentTransactions.jobId, jobs.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get summary stats
    const statsResult = await db
      .select({
        totalTransactions: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(abs(${paymentTransactions.amount}))`,
        totalCredits: sql<number>`sum(case when ${paymentTransactions.amount} > 0 then ${paymentTransactions.amount} else 0 end)`,
        totalDebits: sql<number>`sum(case when ${paymentTransactions.amount} < 0 then abs(${paymentTransactions.amount}) else 0 end)`,
      })
      .from(paymentTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get transaction types for filters
    const typesResult = await db
      .selectDistinct({ type: paymentTransactions.transactionType })
      .from(paymentTransactions);

    // Get statuses for filters
    const statusesResult = await db
      .selectDistinct({ status: paymentTransactions.status })
      .from(paymentTransactions);

    return NextResponse.json({
      transactions,
      total: countResult[0]?.count || 0,
      stats: {
        totalTransactions: statsResult[0]?.totalTransactions || 0,
        totalAmount: statsResult[0]?.totalAmount || 0,
        totalCredits: statsResult[0]?.totalCredits || 0,
        totalDebits: statsResult[0]?.totalDebits || 0,
      },
      limit,
      offset,
      filters: {
        transactionTypes: typesResult.map(r => r.type),
        statuses: statusesResult.map(r => r.status),
      }
    });
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch payment transactions' }, { status: 500 });
  }
}

