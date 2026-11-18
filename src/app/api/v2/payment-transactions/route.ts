import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentTransactions, users, jobs, payments } from '@/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/payment-transactions
 * Retrieves payment transaction log for admins
 * 
 * Query params:
 * - jobId: (optional) Filter by job ID
 * - userId: (optional) Filter by user ID
 * - transactionType: (optional) Filter by type
 * - status: (optional) Filter by status
 * - startDate: (optional) Filter from date
 * - endDate: (optional) Filter to date
 * - page: (optional) Page number, default 1
 * - limit: (optional) Items per page, default 50
 */
export async function GET(request: NextRequest) {
  // Admin only access
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');
    const transactionType = searchParams.get('transactionType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (jobId) {
      conditions.push(eq(paymentTransactions.jobId, parseInt(jobId)));
    }

    if (userId) {
      conditions.push(eq(paymentTransactions.userId, parseInt(userId)));
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(whereClause)
      .execute();

    const totalCount = countResult[0]?.count || 0;

    // Get transactions with related data
    const transactions = await db
      .select({
        id: paymentTransactions.id,
        paymentId: paymentTransactions.paymentId,
        jobId: paymentTransactions.jobId,
        transactionType: paymentTransactions.transactionType,
        userId: paymentTransactions.userId,
        amount: paymentTransactions.amount,
        balanceBefore: paymentTransactions.balanceBefore,
        balanceAfter: paymentTransactions.balanceAfter,
        status: paymentTransactions.status,
        reason: paymentTransactions.reason,
        createdAt: paymentTransactions.createdAt,
        // User info
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        // Job info
        jobTitle: jobs.title,
        jobDisplayId: jobs.displayId,
      })
      .from(paymentTransactions)
      .leftJoin(users, eq(paymentTransactions.userId, users.id))
      .leftJoin(jobs, eq(paymentTransactions.jobId, jobs.id))
      .where(whereClause)
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    // Get summary stats
    const totalPayments = transactions.filter(t => t.transactionType === 'payment').length;
    const totalRollbacks = transactions.filter(t => t.transactionType === 'rollback').length;
    const totalWriterCredits = transactions.filter(t => t.transactionType === 'writer_credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalManagerCredits = transactions.filter(t => t.transactionType === 'manager_credit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Format response
    const formattedTransactions = transactions.map(t => ({
      ...t,
      typeLabel: getTransactionTypeLabel(t.transactionType),
      statusLabel: getStatusLabel(t.status),
    }));

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      summary: {
        totalPayments,
        totalRollbacks,
        totalWriterCredits,
        totalManagerCredits,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        jobId,
        userId,
        transactionType,
        status,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error('Payment transactions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment transactions' },
      { status: 500 }
    );
  }
}

function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'payment': 'Client Payment',
    'writer_credit': 'Writer Credit',
    'manager_credit': 'Manager Credit',
    'admin_commission': 'Admin Commission',
    'rollback': 'Rollback',
    'refund': 'Refund',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'completed': 'Completed',
    'pending': 'Pending',
    'failed': 'Failed',
    'rolled_back': 'Rolled Back',
  };
  return labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

