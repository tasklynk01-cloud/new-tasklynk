import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments, jobs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/admin/clients/[id]/payments
 * Get all payments for a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate admin
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const clientId = parseInt(resolvedParams.id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    // Get all payments for this client with order details
    const clientPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        createdAt: payments.createdAt,
        confirmedAt: payments.confirmedAt,
        jobId: payments.jobId,
        orderTitle: jobs.title,
      })
      .from(payments)
      .leftJoin(jobs, eq(payments.jobId, jobs.id))
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt));

    return NextResponse.json({
      success: true,
      payments: clientPayments,
      totalPayments: clientPayments.length,
      totalAmount: clientPayments.reduce((sum, payment) => sum + payment.amount, 0),
      completedAmount: clientPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0),
    });

  } catch (error) {
    console.error('Failed to get client payments:', error);
    return NextResponse.json(
      { error: 'Failed to get client payments' },
      { status: 500 }
    );
  }
}
