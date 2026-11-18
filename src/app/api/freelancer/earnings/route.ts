import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/freelancer/earnings
 * Get freelancer earnings history and statistics
 * 
 * Auth: Requires freelancer role OR admin/manager viewing freelancer data
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Authenticate user - allow freelancer, admin, manager
    const authCheck = await requireRole(request, ['freelancer', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const authenticatedUser = authCheck.user;

    // Ensure freelancers can only view their own data
    if (authenticatedUser.role === 'freelancer' && authenticatedUser.id !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot view other freelancer data' },
        { status: 403 }
      );
    }

    // Get user's payments
    const userPayments = await db
      .select({
        id: payments.id,
        jobId: payments.jobId,
        amount: payments.amount,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.freelancerId, parseInt(userId)));

    let totalEarned = 0;
    let pendingAmount = 0;
    let completedJobs = 0;

    const earnings = await Promise.all(
      userPayments.map(async (payment) => {
        const amount = Number(payment.amount || 0);

        const jobTitle = payment.jobId
          ? (
              await db
                .select({ title: jobs.title })
                .from(jobs)
                .where(eq(jobs.id, payment.jobId))
                .limit(1)
            )[0]?.title
          : null;
        
        if (payment.status === 'completed' || payment.status === 'paid') {
          totalEarned += amount;
          completedJobs += 1;
        } else if (payment.status === 'pending') {
          pendingAmount += amount;
        }

        return {
          id: payment.id,
          jobId: payment.jobId,
          jobTitle: jobTitle || (payment.jobId ? 'Unknown Job' : 'N/A'),
          amount,
          status: payment.status || 'pending',
          completedAt: payment.createdAt,
          createdAt: payment.createdAt,
        };
      })
    );

    return NextResponse.json({
      earnings: earnings.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      totalEarned: totalEarned.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      completedJobs,
    });
  } catch (error) {
    console.error('Failed to fetch earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

