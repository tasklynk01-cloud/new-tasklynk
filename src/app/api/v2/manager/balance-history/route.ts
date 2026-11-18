import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userBalanceHistory, users, jobs } from '@/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/manager/balance-history
 * Get balance history for the authenticated manager
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['manager', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const changeType = searchParams.get('changeType');
    const userId = searchParams.get('userId'); // For admin to view any manager's history

    // Determine which user's history to fetch
    const targetUserId = authCheck.user?.role === 'admin' && userId 
      ? parseInt(userId) 
      : authCheck.user?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(userBalanceHistory.userId, targetUserId)];

    if (startDate) {
      conditions.push(gte(userBalanceHistory.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(userBalanceHistory.createdAt, endDate));
    }
    if (changeType) {
      conditions.push(eq(userBalanceHistory.changeType, changeType));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBalanceHistory)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count) || 0;

    // Get history records
    const history = await db
      .select({
        id: userBalanceHistory.id,
        userId: userBalanceHistory.userId,
        balanceBefore: userBalanceHistory.balanceBefore,
        balanceAfter: userBalanceHistory.balanceAfter,
        changeAmount: userBalanceHistory.changeAmount,
        changeType: userBalanceHistory.changeType,
        referenceType: userBalanceHistory.referenceType,
        referenceId: userBalanceHistory.referenceId,
        notes: userBalanceHistory.notes,
        changedBy: userBalanceHistory.changedBy,
        createdAt: userBalanceHistory.createdAt,
      })
      .from(userBalanceHistory)
      .where(and(...conditions))
      .orderBy(desc(userBalanceHistory.createdAt))
      .limit(limit)
      .offset(offset);

    // Enrich with reference details (e.g., order info if referenceType is 'order')
    const enrichedHistory = await Promise.all(
      history.map(async (record) => {
        let referenceDetails = null;

        if (record.referenceType === 'order' && record.referenceId) {
          const job = await db
            .select({
              id: jobs.id,
              displayId: jobs.displayId,
              orderNumber: jobs.orderNumber,
              title: jobs.title,
            })
            .from(jobs)
            .where(eq(jobs.id, record.referenceId))
            .limit(1);

          if (job[0]) {
            referenceDetails = {
              type: 'order',
              id: job[0].id,
              displayId: job[0].displayId || job[0].orderNumber,
              title: job[0].title,
            };
          }
        }

        // Get changedBy user name
        let changedByUser = null;
        if (record.changedBy) {
          const user = await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(eq(users.id, record.changedBy))
            .limit(1);
          changedByUser = user[0] || null;
        }

        return {
          ...record,
          referenceDetails,
          changedByUser,
        };
      })
    );

    // Get summary stats
    const stats = await db
      .select({
        totalCredits: sql<number>`sum(case when ${userBalanceHistory.changeAmount} > 0 then ${userBalanceHistory.changeAmount} else 0 end)`,
        totalDebits: sql<number>`sum(case when ${userBalanceHistory.changeAmount} < 0 then abs(${userBalanceHistory.changeAmount}) else 0 end)`,
        transactionCount: sql<number>`count(*)`,
      })
      .from(userBalanceHistory)
      .where(eq(userBalanceHistory.userId, targetUserId));

    // Get current balance
    const currentUser = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    return NextResponse.json({
      history: enrichedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        currentBalance: currentUser[0]?.balance || 0,
        totalCredits: Number(stats[0]?.totalCredits) || 0,
        totalDebits: Number(stats[0]?.totalDebits) || 0,
        transactionCount: Number(stats[0]?.transactionCount) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching balance history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance history' },
      { status: 500 }
    );
  }
}

