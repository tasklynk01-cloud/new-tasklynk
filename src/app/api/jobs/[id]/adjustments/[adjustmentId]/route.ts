import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, orderAmountAdjustments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; adjustmentId: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;
    
    const { id, adjustmentId } = await params;
    const jobId = parseInt(id);
    const adjId = parseInt(adjustmentId);
    
    if (isNaN(jobId) || isNaN(adjId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
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
    
    const [adjustment] = await db.select()
      .from(orderAmountAdjustments)
      .where(
        and(
          eq(orderAmountAdjustments.id, adjId),
          eq(orderAmountAdjustments.jobId, jobId)
        )
      )
      .limit(1);
    
    if (!adjustment) {
      return NextResponse.json(
        { success: false, error: 'Adjustment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    console.error('Error fetching adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch adjustment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; adjustmentId: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;
    
    const { id, adjustmentId } = await params;
    const jobId = parseInt(id);
    const adjId = parseInt(adjustmentId);
    const body = await request.json();
    
    const { action, rejectionReason } = body;
    
    if (isNaN(jobId) || isNaN(adjId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    const [adjustment] = await db.select()
      .from(orderAmountAdjustments)
      .where(
        and(
          eq(orderAmountAdjustments.id, adjId),
          eq(orderAmountAdjustments.jobId, jobId)
        )
      )
      .limit(1);
    
    if (!adjustment) {
      return NextResponse.json(
        { success: false, error: 'Adjustment not found' },
        { status: 404 }
      );
    }
    
    if (adjustment.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Adjustment already ${adjustment.status}` },
        { status: 400 }
      );
    }
    
    const [job] = await db.select({
      id: jobs.id,
      clientId: jobs.clientId,
      statusTotalAmount: jobs.statusTotalAmount,
      amount: jobs.amount
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
    
    if (adjustment.changeType === 'manager_additional') {
      if (!['client', 'account_owner', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Only the client or admin can approve/reject manager additional requests' },
          { status: 403 }
        );
      }
      if ((user.role === 'client' || user.role === 'account_owner') && job.clientId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }
    
    const now = new Date().toISOString();
    const approvedBy = user.id;
    
    if (action === 'approve') {
      const currentTotal = job.statusTotalAmount || job.amount || 0;
      const newTotal = currentTotal + adjustment.amount;
      
      await db.update(orderAmountAdjustments)
        .set({
          status: 'approved',
          approvedBy,
          approvedAt: now,
          appliedAt: now,
          newTotal: newTotal
        })
        .where(eq(orderAmountAdjustments.id, adjId));
      
      await db.update(jobs)
        .set({
          statusTotalAmount: newTotal,
          lastAmountUpdateAt: now,
          updatedAt: now
        })
        .where(eq(jobs.id, jobId));
      
      if (adjustment.changeType === 'manager_additional') {
        await db.update(jobs)
          .set({
            managerAdditionalStatus: 'approved'
          })
          .where(eq(jobs.id, jobId));
      }
      
      return NextResponse.json({
        success: true,
        message: 'Adjustment approved and applied',
        data: {
          adjustmentId: adjId,
          previousTotal: currentTotal,
          newTotal,
          status: 'approved'
        }
      });
    } else {
      await db.update(orderAmountAdjustments)
        .set({
          status: 'rejected',
          rejectedAt: now,
          rejectionReason: rejectionReason || null
        })
        .where(eq(orderAmountAdjustments.id, adjId));
      
      if (adjustment.changeType === 'manager_additional') {
        await db.update(jobs)
          .set({
            managerAdditionalStatus: 'rejected',
            managerAdditional: 0,
            updatedAt: now
          })
          .where(eq(jobs.id, jobId));
      }
      
      return NextResponse.json({
        success: true,
        message: 'Adjustment rejected',
        data: {
          adjustmentId: adjId,
          status: 'rejected',
          rejectionReason
        }
      });
    }
  } catch (error) {
    console.error('Error processing adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process adjustment' },
      { status: 500 }
    );
  }
}
