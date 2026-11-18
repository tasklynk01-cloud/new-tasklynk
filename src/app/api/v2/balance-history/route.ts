import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userBalanceHistory, users } from '@/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/balance-history
 * Retrieves balance history for a user
 * 
 * Query params:
 * - userId: (optional) User ID - admins/managers can view other users
 * - changeType: (optional) Filter by change type
 * - startDate: (optional) Filter from date
 * - endDate: (optional) Filter to date
 * - page: (optional) Page number, default 1
 * - limit: (optional) Items per page, default 20
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['freelancer', 'manager', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const changeType = searchParams.get('changeType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Determine which user's history to fetch
    let targetUserId: number;
    const requesterRole = authCheck.user.role;
    const isAdminOrManager = requesterRole === 'admin' || requesterRole === 'manager';

    if (requestedUserId && isAdminOrManager) {
      // Admin/Manager can view any user's history
      targetUserId = parseInt(requestedUserId);
      if (Number.isNaN(targetUserId)) {
        return NextResponse.json({ error: 'Invalid userId parameter' }, { status: 400 });
      }
    } else {
      // Regular users can only view their own history
      targetUserId = authCheck.user.id;
    }

    // Build where conditions
    const conditions = [eq(userBalanceHistory.userId, targetUserId)];

    if (changeType && changeType !== 'all') {
      conditions.push(eq(userBalanceHistory.changeType, changeType));
    }

    if (startDate) {
      conditions.push(gte(userBalanceHistory.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(userBalanceHistory.createdAt, endDate));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBalanceHistory)
      .where(and(...conditions))
      .execute();

    const totalCount = countResult[0]?.count || 0;

    // Get history with related data
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
        // Join for changedBy user name
        changedByName: users.name,
      })
      .from(userBalanceHistory)
      .leftJoin(users, eq(userBalanceHistory.changedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(userBalanceHistory.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    // Get current balance for the user
    const userResult = await db
      .select({ balance: users.balance, name: users.name })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)
      .execute();

    const currentBalance = userResult[0]?.balance || 0;
    const userName = userResult[0]?.name || 'Unknown';

    // Format the response
    const formattedHistory = history.map((h) => ({
      ...h,
      formattedAmount: h.changeAmount >= 0
        ? `+KSh ${Math.abs(h.changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `-KSh ${Math.abs(h.changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      changeTypeLabel: getChangeTypeLabel(h.changeType),
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: targetUserId,
        name: userName,
        currentBalance,
      },
      history: formattedHistory,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        changeType,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error('Balance history GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance history' },
      { status: 500 }
    );
  }
}

// Helper function to get human-readable change type labels
function getChangeTypeLabel(changeType: string): string {
  const labels: Record<string, string> = {
    'order_completion': 'Order Completed',
    'settlement': 'Settlement Paid',
    'fine': 'Fine Applied',
    'additional_payment': 'Additional Payment',
    'revision_deduction': 'Revision Deduction',
    'revision_restoration': 'Revision Restored',
    'manual_adjustment': 'Manual Adjustment',
    'payout': 'Payout Processed',
    'refund': 'Refund',
    'bonus': 'Bonus',
  };
  return labels[changeType] || changeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

