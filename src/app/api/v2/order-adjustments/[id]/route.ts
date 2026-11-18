import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderAmountAdjustments, jobs } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq } from 'drizzle-orm';

// PATCH /api/v2/order-adjustments/[id] - Approve, reject, or apply adjustment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const adjustmentId = parseInt(id);
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject', 'apply'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve", "reject", or "apply"' },
        { status: 400 }
      );
    }

    // Get current adjustment
    const [adjustment] = await db
      .select()
      .from(orderAmountAdjustments)
      .where(eq(orderAmountAdjustments.id, adjustmentId))
      .limit(1);

    if (!adjustment) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      if (adjustment.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending adjustments can be approved' },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(orderAmountAdjustments)
        .set({
          status: 'approved',
          approvedBy: authCheck.user?.id || null,
          approvedAt: now,
        })
        .where(eq(orderAmountAdjustments.id, adjustmentId))
        .returning();

      return NextResponse.json({
        success: true,
        adjustment: updated,
        message: 'Adjustment approved successfully',
      });
    }

    if (action === 'reject') {
      if (adjustment.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending adjustments can be rejected' },
          { status: 400 }
        );
      }

      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(orderAmountAdjustments)
        .set({
          status: 'rejected',
          rejectedAt: now,
          rejectionReason,
        })
        .where(eq(orderAmountAdjustments.id, adjustmentId))
        .returning();

      return NextResponse.json({
        success: true,
        adjustment: updated,
        message: 'Adjustment rejected',
      });
    }

    if (action === 'apply') {
      if (adjustment.status !== 'approved') {
        return NextResponse.json(
          { error: 'Only approved adjustments can be applied' },
          { status: 400 }
        );
      }

      // Get current job
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, adjustment.jobId!))
        .limit(1);

      if (!job) {
        return NextResponse.json(
          { error: 'Associated job not found' },
          { status: 404 }
        );
      }

      // Apply the adjustment to the job amount
      const currentAmount = job.amount || 0;
      const newAmount = currentAmount + (adjustment.amount || 0);

      await db
        .update(jobs)
        .set({
          amount: newAmount,
          updatedAt: now,
        })
        .where(eq(jobs.id, adjustment.jobId!));

      // Mark adjustment as applied
      const [updated] = await db
        .update(orderAmountAdjustments)
        .set({
          status: 'applied',
          appliedAt: now,
        })
        .where(eq(orderAmountAdjustments.id, adjustmentId))
        .returning();

      return NextResponse.json({
        success: true,
        adjustment: updated,
        jobUpdate: {
          previousAmount: currentAmount,
          newAmount,
          adjustmentApplied: adjustment.amount,
        },
        message: 'Adjustment applied to order successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating order adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to update order adjustment' },
      { status: 500 }
    );
  }
}

// GET /api/v2/order-adjustments/[id] - Get single adjustment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const adjustmentId = parseInt(id);

    const [adjustment] = await db
      .select()
      .from(orderAmountAdjustments)
      .where(eq(orderAmountAdjustments.id, adjustmentId))
      .limit(1);

    if (!adjustment) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      adjustment,
    });
  } catch (error) {
    console.error('Error fetching order adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order adjustment' },
      { status: 500 }
    );
  }
}
