import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, orderAmountAdjustments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner']);
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
    
    const [job] = await db.select({ id: jobs.id, clientId: jobs.clientId })
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
    
    const adjustments = await db.select({
      id: orderAmountAdjustments.id,
      jobId: orderAmountAdjustments.jobId,
      changedBy: orderAmountAdjustments.changedBy,
      changeType: orderAmountAdjustments.changeType,
      amount: orderAmountAdjustments.amount,
      previousTotal: orderAmountAdjustments.previousTotal,
      newTotal: orderAmountAdjustments.newTotal,
      reason: orderAmountAdjustments.reason,
      status: orderAmountAdjustments.status,
      approvedBy: orderAmountAdjustments.approvedBy,
      approvedAt: orderAmountAdjustments.approvedAt,
      rejectedAt: orderAmountAdjustments.rejectedAt,
      rejectionReason: orderAmountAdjustments.rejectionReason,
      appliedAt: orderAmountAdjustments.appliedAt,
      createdAt: orderAmountAdjustments.createdAt
    })
    .from(orderAmountAdjustments)
    .where(eq(orderAmountAdjustments.jobId, jobId))
    .orderBy(desc(orderAmountAdjustments.createdAt));
    
    return NextResponse.json({
      success: true,
      data: adjustments
    });
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;
    
    const { id } = await params;
    const jobId = parseInt(id);
    const body = await request.json();
    
    const { changeType, amount, reason } = body;
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }
    
    if (!changeType || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'changeType and amount are required' },
        { status: 400 }
      );
    }
    
    const validChangeTypes = ['manager_additional', 'client_topup', 'client_bonus', 'cpp_adjustment', 'correction'];
    if (!validChangeTypes.includes(changeType)) {
      return NextResponse.json(
        { success: false, error: `Invalid changeType. Must be one of: ${validChangeTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    if (changeType === 'manager_additional' && !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only managers can request additional amounts' },
        { status: 403 }
      );
    }
    
    if (['client_topup', 'client_bonus'].includes(changeType) && !['client', 'account_owner', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only clients can create topups or bonuses' },
        { status: 403 }
      );
    }
    
    const [job] = await db.select({
      id: jobs.id,
      clientId: jobs.clientId,
      clientCpp: jobs.clientCpp,
      amount: jobs.amount,
      statusTotalAmount: jobs.statusTotalAmount,
      pages: jobs.pages,
      status: jobs.status,
      clientBonus: jobs.clientBonus
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
    
    const currentTotal = job.statusTotalAmount || job.amount || 0;
    const newTotal = currentTotal + amount;
    
    const now = new Date().toISOString();
    const status = changeType === 'manager_additional' ? 'pending' : 'approved';
    const changedBy = user.id;
    
    const [adjustment] = await db.insert(orderAmountAdjustments)
      .values({
        jobId,
        changedBy,
        changeType,
        amount,
        previousTotal: currentTotal,
        newTotal,
        reason: reason || null,
        status,
        createdAt: now,
        appliedAt: status === 'approved' ? now : null,
        approvedBy: status === 'approved' ? changedBy : null,
        approvedAt: status === 'approved' ? now : null
      })
      .returning();
    
    if (status === 'approved') {
      await db.update(jobs)
        .set({
          statusTotalAmount: newTotal,
          lastAmountUpdateAt: now,
          updatedAt: now
        })
        .where(eq(jobs.id, jobId));
      
      if (changeType === 'client_bonus') {
        await db.update(jobs)
          .set({ clientBonus: (job.clientBonus || 0) + amount })
          .where(eq(jobs.id, jobId));
      }
    } else if (changeType === 'manager_additional') {
      await db.update(jobs)
        .set({
          managerAdditional: amount,
          managerAdditionalStatus: 'pending',
          managerAdditionalNote: reason || null,
          updatedAt: now
        })
        .where(eq(jobs.id, jobId));
    }
    
    return NextResponse.json({
      success: true,
      data: adjustment,
      message: status === 'pending' 
        ? 'Adjustment request submitted, awaiting client approval'
        : 'Adjustment applied successfully'
    });
  } catch (error) {
    console.error('Error creating adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create adjustment' },
      { status: 500 }
    );
  }
}
