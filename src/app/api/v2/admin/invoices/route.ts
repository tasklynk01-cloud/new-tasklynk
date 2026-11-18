import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, invoiceSettlements, orderSettlements, userBalanceHistory } from '@/db/schema';
import { eq, and, inArray, desc, isNull, or, notInArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';
import { getManagerScopedJobIds } from '@/lib/manager-job-scope';

// GET - Fetch invoice summaries for users (freelancers and managers)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get('userType'); // 'freelancer', 'manager', or 'all'
    const userId = searchParams.get('userId');

    // Build query conditions
    const roleConditions = userType === 'freelancer' 
      ? eq(users.role, 'freelancer')
      : userType === 'manager'
        ? eq(users.role, 'manager')
        : or(eq(users.role, 'freelancer'), eq(users.role, 'manager'));

    // Fetch users with unsettled balance
    const usersWithBalance = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      displayId: users.displayId,
      role: users.role,
      balance: users.balance,
      completedJobs: users.completedJobs,
    })
    .from(users)
    .where(and(
      roleConditions,
      eq(users.approved, true),
      userId ? eq(users.id, parseInt(userId)) : undefined
    ))
    .orderBy(desc(users.balance));

    // For each user, get their unsettled orders
    const summaries = await Promise.all(usersWithBalance.map(async (user) => {
      // Get already settled order IDs
      const settledOrders = await db.select({ jobId: orderSettlements.jobId })
        .from(orderSettlements)
        .where(eq(orderSettlements.isSettled, true));

      const settledJobIds = settledOrders.map(o => o.jobId);

      // Get unsettled completed orders for this user
      let unsettledOrders: Array<{
        id: number;
        displayId: string;
        title: string;
        amount: number;
        freelancerEarnings: number;
        managerEarnings: number;
        pages: number | null;
        slides: number | null;
        workType: string;
        completedAt: string;
      }>;
      if (user.role === 'freelancer') {
        const whereClause = settledJobIds.length > 0
          ? and(
              eq(jobs.assignedFreelancerId, user.id),
              eq(jobs.status, 'completed'),
              eq(jobs.paymentConfirmed, true),
              notInArray(jobs.id, settledJobIds)
            )
          : and(
              eq(jobs.assignedFreelancerId, user.id),
              eq(jobs.status, 'completed'),
              eq(jobs.paymentConfirmed, true)
            );

        unsettledOrders = await db.select({
          id: jobs.id,
          displayId: jobs.displayId,
          title: jobs.title,
          amount: jobs.amount,
          freelancerEarnings: jobs.freelancerEarnings,
          managerEarnings: jobs.managerEarnings,
          pages: jobs.pages,
          slides: jobs.slides,
          workType: jobs.workType,
          completedAt: jobs.updatedAt,
        })
        .from(jobs)
        .where(whereClause);
      } else {
        const managerJobIds = await getManagerScopedJobIds(user.id);

        if (managerJobIds.length === 0) {
          unsettledOrders = [];
        } else {
          const whereClause = settledJobIds.length > 0
            ? and(
                inArray(jobs.id, managerJobIds),
                eq(jobs.status, 'completed'),
                eq(jobs.paymentConfirmed, true),
                notInArray(jobs.id, settledJobIds)
              )
            : and(
                inArray(jobs.id, managerJobIds),
                eq(jobs.status, 'completed'),
                eq(jobs.paymentConfirmed, true)
              );

          unsettledOrders = await db.select({
            id: jobs.id,
            displayId: jobs.displayId,
            title: jobs.title,
            amount: jobs.amount,
            freelancerEarnings: jobs.freelancerEarnings,
            managerEarnings: jobs.managerEarnings,
            pages: jobs.pages,
            slides: jobs.slides,
            workType: jobs.workType,
            completedAt: jobs.updatedAt,
          })
          .from(jobs)
          .where(whereClause);
        }
      }

      // Calculate total unsettled amount
      const unsettledAmount = user.role === 'freelancer'
        ? unsettledOrders.reduce((sum, o) => sum + (o.freelancerEarnings || 0), 0)
        : unsettledOrders.reduce((sum, o) => sum + (o.managerEarnings || 0), 0);

      // Get settlement history
      const settlements = await db.select()
        .from(invoiceSettlements)
        .where(eq(invoiceSettlements.userId, user.id))
        .orderBy(desc(invoiceSettlements.settledAt))
        .limit(5);

      const totalSettled = settlements.reduce((sum, s) => sum + s.settlementAmount, 0);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          displayId: user.displayId,
          role: user.role,
        },
        currentBalance: user.balance,
        unsettledAmount: Math.round(unsettledAmount * 100) / 100,
        unsettledOrdersCount: unsettledOrders.length,
        unsettledOrders: unsettledOrders.map(o => ({
          id: o.id,
          displayId: o.displayId,
          title: o.title,
          amount: user.role === 'freelancer' ? o.freelancerEarnings : o.managerEarnings,
          completedAt: o.completedAt,
        })),
        totalSettledAllTime: Math.round(totalSettled * 100) / 100,
        recentSettlements: settlements,
      };
    }));

    // Calculate overall totals
    const totals = {
      totalFreelancerBalance: summaries
        .filter(s => s.user.role === 'freelancer')
        .reduce((sum, s) => sum + s.unsettledAmount, 0),
      totalManagerBalance: summaries
        .filter(s => s.user.role === 'manager')
        .reduce((sum, s) => sum + s.unsettledAmount, 0),
      totalUnsettledOrders: summaries.reduce((sum, s) => sum + s.unsettledOrdersCount, 0),
    };

    return NextResponse.json({
      summaries,
      totals,
    });

  } catch (error) {
    console.error('GET invoice summaries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Settle invoices for a user (irreversible)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { userId, orderIds, notes } = body;

    if (!userId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'userId and orderIds array are required' },
        { status: 400 }
      );
    }

    // Get user
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRecord[0];
    const isFreelancer = user.role === 'freelancer';

    // Verify orders exist and are eligible for settlement
    const ordersToSettle = await db.select()
      .from(jobs)
      .where(and(
        inArray(jobs.id, orderIds),
        eq(jobs.status, 'completed'),
        eq(jobs.paymentConfirmed, true)
      ));

    if (ordersToSettle.length !== orderIds.length) {
      return NextResponse.json(
        { error: 'Some orders are not eligible for settlement (must be completed and payment confirmed)' },
        { status: 400 }
      );
    }

    // Check none are already settled
    const alreadySettled = await db.select()
      .from(orderSettlements)
      .where(inArray(orderSettlements.jobId, orderIds));

    if (alreadySettled.length > 0) {
      return NextResponse.json(
        { error: 'Some orders have already been settled. Settlement is irreversible.' },
        { status: 400 }
      );
    }

    // Calculate total settlement amount
    const settlementAmount = isFreelancer
      ? ordersToSettle.reduce((sum, o) => sum + (o.freelancerEarnings || 0), 0)
      : ordersToSettle.reduce((sum, o) => sum + (o.managerEarnings || 0), 0);

    const now = new Date().toISOString();
    const balanceBefore = user.balance;
    const balanceAfter = 0; // Settlement clears the balance

    // Create settlement record
    const settlementResult = await db.insert(invoiceSettlements).values({
      userId,
      userType: isFreelancer ? 'freelancer' : 'manager',
      settlementAmount: Math.round(settlementAmount * 100) / 100,
      ordersSettled: orderIds.length,
      orderIds: JSON.stringify(orderIds),
      balanceBeforeSettlement: balanceBefore,
      balanceAfterSettlement: balanceAfter,
      notes: notes || null,
      settledBy: authResult.user?.id || 0,
      settledAt: now,
      createdAt: now,
    }).returning({ id: invoiceSettlements.id });

    const settlementId = settlementResult[0].id;

    // Create order settlement records for each order
    for (const order of ordersToSettle) {
      await db.insert(orderSettlements).values({
        jobId: order.id,
        settlementId: Number(settlementId),
        freelancerAmount: isFreelancer ? (order.freelancerEarnings || 0) : 0,
        managerAmount: !isFreelancer ? (order.managerEarnings || 0) : 0,
        isSettled: true,
        settledAt: now,
        createdAt: now,
      });
    }

    // Update user balance to 0
    await db.update(users)
      .set({ balance: 0, updatedAt: now })
      .where(eq(users.id, userId));

    // Record balance history
    await db.insert(userBalanceHistory).values({
      userId,
      balanceBefore,
      balanceAfter,
      changeAmount: -settlementAmount,
      changeType: 'settlement',
      referenceType: 'settlement',
      referenceId: Number(settlementId),
      notes: `Settlement of ${orderIds.length} orders. Amount: KSh ${settlementAmount.toFixed(2)}`,
      changedBy: authResult.user?.id || null,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully settled ${orderIds.length} orders for KSh ${settlementAmount.toFixed(2)}`,
      settlement: {
        id: settlementId,
        userId,
        amount: settlementAmount,
        ordersSettled: orderIds.length,
        balanceBefore,
        balanceAfter,
        settledAt: now,
      }
    });

  } catch (error) {
    console.error('POST settlement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

