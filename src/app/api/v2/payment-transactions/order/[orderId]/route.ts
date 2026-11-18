import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentTransactions, users, jobs } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq, desc } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

// GET /api/v2/payment-transactions/order/[orderId] - Get all transactions for an order
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Validate authentication - admin and managers can view
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { orderId } = await context.params;
    const jobId = parseInt(orderId);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Fetch all transactions for this order with user details
    const results = await db
      .select({
        transaction: paymentTransactions,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(paymentTransactions)
      .leftJoin(users, eq(paymentTransactions.userId, users.id))
      .where(eq(paymentTransactions.jobId, jobId))
      .orderBy(desc(paymentTransactions.createdAt));

    // Get order details
    const [order] = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        title: jobs.title,
        amount: jobs.amount,
        status: jobs.status,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      transactions: results.map(r => ({
        ...r.transaction,
        user: r.user,
      })),
      summary: {
        total: results.length,
        totalAmount: results.reduce((sum, r) => sum + r.transaction.amount, 0),
        byType: results.reduce((acc, r) => {
          const type = r.transaction.transactionType;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      }
    });
  } catch (error) {
    console.error('Error fetching order transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order transactions' },
      { status: 500 }
    );
  }
}
