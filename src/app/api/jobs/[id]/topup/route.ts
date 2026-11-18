import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, orderAmountAdjustments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;
    
    const { id } = await params;
    const jobId = parseInt(id);
    const body = await request.json();
    
    const { amount, reason } = body;
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }
    
    const [job] = await db.select({
      id: jobs.id,
      clientId: jobs.clientId,
      clientCpp: jobs.clientCpp,
      amount: jobs.amount,
      statusTotalAmount: jobs.statusTotalAmount,
      pages: jobs.pages,
      status: jobs.status
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }
    
    if ((user.role === 'client' || user.role === 'account_owner') && job.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only top up your own orders' },
        { status: 403 }
      );
    }
    
    const currentTotal = job.statusTotalAmount || job.amount || 0;
    const newTotal = currentTotal + amount;
    
    const newCpp = job.pages && job.pages > 0 
      ? Math.round((newTotal / job.pages) * 100) / 100
      : job.clientCpp || 0;
    
    const now = new Date().toISOString();
    const clientId = user.id;
    
    const [adjustment] = await db.insert(orderAmountAdjustments)
      .values({
        jobId,
        changedBy: clientId,
        changeType: 'client_topup',
        amount,
        previousTotal: currentTotal,
        newTotal,
        reason: reason || 'Client topup',
        status: 'approved',
        approvedBy: clientId,
        approvedAt: now,
        appliedAt: now,
        createdAt: now
      })
      .returning();
    
    await db.update(jobs)
      .set({
        statusTotalAmount: newTotal,
        clientCpp: newCpp,
        clientCppConfirmed: true,
        lastAmountUpdateAt: now,
        updatedAt: now
      })
      .where(eq(jobs.id, jobId));
    
    return NextResponse.json({
      success: true,
      message: 'Topup applied successfully',
      data: {
        adjustmentId: adjustment.id,
        previousTotal: currentTotal,
        newTotal,
        previousCpp: job.clientCpp,
        newCpp,
        amountAdded: amount
      }
    });
  } catch (error) {
    console.error('Error processing topup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process topup' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;
    
    const { id } = await params;
    const jobId = parseInt(id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }
    
    const [job] = await db.select({
      id: jobs.id,
      clientId: jobs.clientId,
      clientCpp: jobs.clientCpp,
      amount: jobs.amount,
      statusTotalAmount: jobs.statusTotalAmount,
      pages: jobs.pages,
      status: jobs.status
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);
    
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }
    
    if ((user.role === 'client' || user.role === 'account_owner') && job.clientId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const currentCpp = job.clientCpp || 0;
    const currentTotal = job.statusTotalAmount || job.amount || 0;
    const pages = job.pages || 1;
    
    const suggestions = [];
    
    if (currentCpp < 240) {
      const minAmount = 240 * pages;
      const topupNeeded = Math.max(0, minAmount - currentTotal);
      if (topupNeeded > 0) {
        suggestions.push({
          targetCpp: 240,
          amount: topupNeeded,
          description: 'Reach minimum CPP (240 KSh)'
        });
      }
    }
    
    const cppIncrements = [20, 50, 100];
    for (const increment of cppIncrements) {
      const targetCpp = currentCpp + increment;
      const targetTotal = targetCpp * pages;
      const topupAmount = Math.max(0, targetTotal - currentTotal);
      if (topupAmount > 0) {
        suggestions.push({
          targetCpp,
          amount: topupAmount,
          description: `Increase CPP by ${increment} KSh`
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        currentCpp,
        currentTotal,
        pages,
        suggestions
      }
    });
  } catch (error) {
    console.error('Error fetching topup suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch topup suggestions' },
      { status: 500 }
    );
  }
}
