import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, invoiceSettlements, balances, users } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

/**
 * GET /api/v2/admin/financial-summary
 * 
 * Get financial summary for admin dashboard
 * - Pending payouts (awaiting settlement)
 * - Settled this month
 * - Platform profit (this month + all time)
 * - Orders this month
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get pending payouts (users with reserved balance > 0)
    const pendingBalances = await db
      .select({
        reservedBalance: balances.reservedBalance,
        role: sql<string | null>`${users.role}`,
      })
      .from(balances)
      .leftJoin(users, eq(balances.userId, users.id))
      .where(sql`${balances.reservedBalance} > 0`);

    const pendingPayouts = {
      freelancers: 0,
      managers: 0,
      total: 0,
      userCount: pendingBalances.length,
    };

    for (const balance of pendingBalances) {
      const amount = Number(balance.reservedBalance) || 0;
      pendingPayouts.total += amount;

      if (balance.role === 'freelancer') {
        pendingPayouts.freelancers += amount;
      } else if (balance.role === 'manager') {
        pendingPayouts.managers += amount;
      }
    }

    // Get settlements this month
    const settlementsThisMonth = await db
      .select({
        settlementAmount: invoiceSettlements.settlementAmount,
      })
      .from(invoiceSettlements)
      .where(gte(invoiceSettlements.settledAt, firstDayOfMonth));

    const settledThisMonth = settlementsThisMonth.reduce(
      (sum, s) => sum + (Number(s.settlementAmount) || 0),
      0
    );

    // Get platform profit this month
    const ordersThisMonth = await db
      .select({
        adminProfit: jobs.adminProfit,
        status: jobs.status,
      })
      .from(jobs)
      .where(
        and(
          gte(jobs.completedAt, firstDayOfMonth),
          sql`${jobs.status} IN ('paid', 'completed')`
        )
      );

    const platformProfitThisMonth = ordersThisMonth.reduce(
      (sum, o) => sum + (Number(o.adminProfit) || 0),
      0
    );

    // Get all-time platform profit
    const allCompletedOrders = await db
      .select({
        adminProfit: jobs.adminProfit,
      })
      .from(jobs)
      .where(sql`${jobs.status} IN ('paid', 'completed')`);

    const platformProfitAllTime = allCompletedOrders.reduce(
      (sum, o) => sum + (Number(o.adminProfit) || 0),
      0
    );

    // Orders this month stats
    const ordersThisMonthStats = {
      total: ordersThisMonth.length,
      paid: ordersThisMonth.filter(o => o.status === 'paid').length,
      completed: ordersThisMonth.filter(o => o.status === 'completed').length,
    };

    return NextResponse.json({
      pendingPayouts,
      settledThisMonth: Math.round(settledThisMonth * 100) / 100,
      platformProfit: {
        thisMonth: Math.round(platformProfitThisMonth * 100) / 100,
        allTime: Math.round(platformProfitAllTime * 100) / 100,
      },
      ordersThisMonth: ordersThisMonthStats,
    });
  } catch (error: any) {
    console.error('Error fetching financial summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial summary' },
      { status: 500 }
    );
  }
}

