import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentTransactions, users, jobs } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq, desc } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// GET /api/v2/payment-transactions/user/[userId] - Get all transactions for a user (balance history)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Validate authentication - admin can view any user, users can view their own
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { userId } = await context.params;
    const targetUserId = parseInt(userId);

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check permissions - users can only view their own transactions unless admin
    if (authCheck.user.role !== 'admin' && authCheck.user.id !== targetUserId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this user\'s transactions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch user details
    const [targetUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        balance: users.balance,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch transactions with job details
    const results = await db
      .select({
        transaction: paymentTransactions,
        job: {
          id: jobs.id,
          displayId: jobs.displayId,
          title: jobs.title,
        },
      })
      .from(paymentTransactions)
      .leftJoin(jobs, eq(paymentTransactions.jobId, jobs.id))
      .where(eq(paymentTransactions.userId, targetUserId))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalTransactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, targetUserId));

    // Calculate summary statistics
    const summary = {
      currentBalance: targetUser.balance || 0,
      totalTransactions: totalTransactions.length,
      totalCredits: totalTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
      totalDebits: Math.abs(
        totalTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0)
      ),
      byType: totalTransactions.reduce((acc, t) => {
        acc[t.transactionType] = (acc[t.transactionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      success: true,
      user: targetUser,
      transactions: results.map(r => ({
        ...r.transaction,
        job: r.job,
      })),
      summary,
      pagination: {
        total: totalTransactions.length,
        limit,
        offset,
        hasMore: offset + limit < totalTransactions.length,
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user transactions' },
      { status: 500 }
    );
  }
}
