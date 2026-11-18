import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { userBalanceHistory, users } from '@/db/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

// GET - Fetch user balance history with filtering
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
    const changeType = searchParams.get('changeType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build conditions
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(userBalanceHistory.userId, parseInt(userId)));
    }
    if (changeType) {
      conditions.push(eq(userBalanceHistory.changeType, changeType));
    }
    if (startDate) {
      conditions.push(gte(userBalanceHistory.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(userBalanceHistory.createdAt, endDate));
    }

    // Create alias for changedBy user
    const changedByUser = db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .as('changedByUser');

    // Query with joins
    const history = await db
      .select({
        id: userBalanceHistory.id,
        userId: userBalanceHistory.userId,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
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
      .leftJoin(users, eq(userBalanceHistory.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(userBalanceHistory.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBalanceHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get summary stats
    const statsResult = await db
      .select({
        totalChanges: sql<number>`count(*)`,
        totalCredits: sql<number>`sum(case when ${userBalanceHistory.changeAmount} > 0 then ${userBalanceHistory.changeAmount} else 0 end)`,
        totalDebits: sql<number>`sum(case when ${userBalanceHistory.changeAmount} < 0 then abs(${userBalanceHistory.changeAmount}) else 0 end)`,
      })
      .from(userBalanceHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get change types for filters
    const typesResult = await db
      .selectDistinct({ type: userBalanceHistory.changeType })
      .from(userBalanceHistory);

    return NextResponse.json({
      history,
      total: countResult[0]?.count || 0,
      stats: {
        totalChanges: statsResult[0]?.totalChanges || 0,
        totalCredits: statsResult[0]?.totalCredits || 0,
        totalDebits: statsResult[0]?.totalDebits || 0,
      },
      limit,
      offset,
      filters: {
        changeTypes: typesResult.map(r => r.type),
      }
    });
  } catch (error) {
    console.error('Error fetching balance history:', error);
    return NextResponse.json({ error: 'Failed to fetch balance history' }, { status: 500 });
  }
}

