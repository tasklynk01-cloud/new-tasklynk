import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, orderAdditionalPayments, userBalanceHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// GET - Fetch additional payments for orders
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const recipientId = searchParams.get('recipientId');

    let whereClause = undefined;
    if (jobId) {
      whereClause = eq(orderAdditionalPayments.jobId, parseInt(jobId));
    } else if (recipientId) {
      whereClause = eq(orderAdditionalPayments.recipientId, parseInt(recipientId));
    }

    const additionalPayments = await db.select()
      .from(orderAdditionalPayments)
      .where(whereClause)
      .orderBy(desc(orderAdditionalPayments.addedAt));

    return NextResponse.json({
      additionalPayments,
      count: additionalPayments.length,
    });

  } catch (error) {
    console.error('GET additional payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add additional payment to an order for a freelancer
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { jobId, additionalAmount, reason } = body;

    if (!jobId || !additionalAmount || !reason) {
      return NextResponse.json(
        { error: 'jobId, additionalAmount, and reason are required' },
        { status: 400 }
      );
    }

    if (additionalAmount <= 0) {
      return NextResponse.json(
        { error: 'additionalAmount must be a positive number' },
        { status: 400 }
      );
    }

    // Get job
    const jobRecord = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (jobRecord.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobRecord[0];

    if (!job.assignedFreelancerId) {
      return NextResponse.json({ error: 'Job has no assigned freelancer' }, { status: 400 });
    }

    // Get freelancer
    const freelancerRecord = await db.select()
      .from(users)
      .where(eq(users.id, job.assignedFreelancerId))
      .limit(1);

    if (freelancerRecord.length === 0) {
      return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    const freelancer = freelancerRecord[0];
    const now = new Date().toISOString();

    const originalAmount = job.freelancerEarnings || 0;
    const newTotalAmount = originalAmount + additionalAmount;

    // Create additional payment record
    const paymentResult = await db.insert(orderAdditionalPayments).values({
      jobId,
      recipientId: freelancer.id,
      additionalAmount: Math.round(additionalAmount * 100) / 100,
      reason,
      originalAmount,
      newTotalAmount: Math.round(newTotalAmount * 100) / 100,
      addedBy: authResult.user?.id || 0,
      addedAt: now,
      createdAt: now,
    }).returning({ id: orderAdditionalPayments.id });

    // Update job freelancer earnings
    await db.update(jobs)
      .set({
        freelancerEarnings: newTotalAmount,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Update freelancer balance if job is completed and paid
    if (job.status === 'completed' && job.paymentConfirmed) {
      const balanceBefore = freelancer.balance;
      const balanceAfter = balanceBefore + additionalAmount;

      await db.update(users)
        .set({ balance: balanceAfter, updatedAt: now })
        .where(eq(users.id, freelancer.id));

      // Record balance history
      await db.insert(userBalanceHistory).values({
        userId: freelancer.id,
        balanceBefore,
        balanceAfter,
        changeAmount: additionalAmount,
        changeType: 'additional_payment',
        referenceType: 'additional_payment',
        referenceId: Number(paymentResult[0].id),
        notes: `Additional payment for order ${job.displayId}: ${reason}`,
        changedBy: authResult.user?.id || null,
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Additional payment of KSh ${additionalAmount.toFixed(2)} added to order ${job.displayId}`,
      additionalPayment: {
        id: paymentResult[0].id,
        jobId,
        recipientId: freelancer.id,
        additionalAmount,
        reason,
        originalAmount,
        newTotalAmount,
        addedAt: now,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST additional payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

