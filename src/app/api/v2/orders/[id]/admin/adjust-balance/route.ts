import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { balances, jobs, payments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * POST /api/v2/orders/[id]/admin/adjust-balance
 * 
 * Admin utility to manually adjust user balances (pending/reserved/available).
 * Used for correcting errors, handling partial payments, or resolving disputes.
 * 
 * Safety Features:
 * - Only admin role allowed
 * - Requires detailed reason (audit trail)
 * - Cannot create negative balances
 * - Logs all adjustments to audit_logs
 * - Supports partial payment scenarios
 * 
 * Auth: Admin only
 * 
 * Body:
 * {
 *   userId: number,              // User whose balance to adjust
 *   userRole: 'freelancer' | 'manager',
 *   adjustmentType: 'partial_payment' | 'correction' | 'dispute_resolution' | 'overpayment_refund',
 *   amount: number,              // Amount to adjust (positive or negative)
 *   targetBalance: 'pending' | 'reserved' | 'available',
 *   reason: string,              // Required: detailed explanation
 *   linkedPaymentId?: number     // Optional: link to payment record
 * }
 * 
 * Response:
 * {
 *   adjustment: {
 *     userId: number,
 *     oldBalance: { pending, reserved, available },
 *     newBalance: { pending, reserved, available },
 *     amount: number,
 *     reason: string
 *   }
 * }
 */

type AdjustmentType = 'partial_payment' | 'correction' | 'dispute_resolution' | 'overpayment_refund' | 'manual_credit' | 'manual_debit';
type BalanceType = 'pending' | 'reserved' | 'available';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const admin = authCheck.user!;

  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const {
      userId,
      userRole,
      adjustmentType,
      amount,
      targetBalance,
      reason,
      linkedPaymentId,
    } = body;

    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Validation
    if (!userId || !userRole || !adjustmentType || amount === undefined || !targetBalance || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userRole, adjustmentType, amount, targetBalance, reason' },
        { status: 400 }
      );
    }

    if (!['freelancer', 'manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Invalid userRole. Must be freelancer or manager' }, { status: 400 });
    }

    if (!['pending', 'reserved', 'available'].includes(targetBalance)) {
      return NextResponse.json({ error: 'Invalid targetBalance. Must be pending, reserved, or available' }, { status: 400 });
    }

    if (reason.trim().length < 20) {
      return NextResponse.json(
        { error: 'Reason must be at least 20 characters for audit trail' },
        { status: 400 }
      );
    }

    const adjustmentAmount = Number(amount);
    if (Number.isNaN(adjustmentAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Verify order exists
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user is associated with order
    const isFreelancer = userRole === 'freelancer' && order.assignedFreelancerId === userId;
    const isManager = userRole === 'manager' && order.managerId === userId;

    if (!isFreelancer && !isManager) {
      return NextResponse.json(
        { error: `User ${userId} (${userRole}) is not associated with order ${orderId}` },
        { status: 400 }
      );
    }

    // Fetch current balance
    const [currentBalance] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .limit(1);

    if (!currentBalance) {
      return NextResponse.json(
        { error: `No balance record found for user ${userId}. Create one first.` },
        { status: 404 }
      );
    }

    const oldPending = currentBalance.pendingBalance || 0;
    const oldReserved = currentBalance.reservedBalance || 0;
    const oldAvailable = currentBalance.availableBalance || 0;

    // Calculate new balance (prevent negative)
    let newPending = oldPending;
    let newReserved = oldReserved;
    let newAvailable = oldAvailable;

    if (targetBalance === 'pending') {
      newPending = oldPending + adjustmentAmount;
    } else if (targetBalance === 'reserved') {
      newReserved = oldReserved + adjustmentAmount;
    } else if (targetBalance === 'available') {
      newAvailable = oldAvailable + adjustmentAmount;
    }

    // Safety check: prevent negative balances
    if (newPending < 0 || newReserved < 0 || newAvailable < 0) {
      return NextResponse.json(
        {
          error: 'Adjustment would result in negative balance',
          currentBalance: { pending: oldPending, reserved: oldReserved, available: oldAvailable },
          attemptedAdjustment: { amount: adjustmentAmount, target: targetBalance },
          resultingBalance: { pending: newPending, reserved: newReserved, available: newAvailable },
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Perform atomic balance update
    await db
      .update(balances)
      .set({
        pendingBalance: newPending,
        reservedBalance: newReserved,
        availableBalance: newAvailable,
        updatedAt: now,
      })
      .where(eq(balances.userId, userId));

    // Log to audit_logs
    const auditNote = `Balance adjustment: ${userRole} ${userId} (order ${orderId}). Type: ${adjustmentType}. ${targetBalance} balance ${adjustmentAmount >= 0 ? '+' : ''}${adjustmentAmount} KSh. Reason: ${reason}${linkedPaymentId ? ` (Payment ID: ${linkedPaymentId})` : ''}`;

    await db.execute(sql`
      INSERT INTO audit_logs (order_id, action, actor_id, actor_role, note, metadata, timestamp, created_at)
      VALUES (
        ${orderId},
        ${'manual_balance_adjustment'},
        ${admin.id},
        ${'admin'},
        ${auditNote},
        ${JSON.stringify({
          userId,
          userRole,
          adjustmentType,
          amount: adjustmentAmount,
          targetBalance,
          oldBalance: { pending: oldPending, reserved: oldReserved, available: oldAvailable },
          newBalance: { pending: newPending, reserved: newReserved, available: newAvailable },
          linkedPaymentId,
        })},
        ${now},
        ${now}
      )
    `);

    return NextResponse.json({
      success: true,
      adjustment: {
        userId,
        userRole,
        orderId,
        adjustmentType,
        oldBalance: {
          pending: oldPending,
          reserved: oldReserved,
          available: oldAvailable,
          total: oldPending + oldReserved + oldAvailable,
        },
        newBalance: {
          pending: newPending,
          reserved: newReserved,
          available: newAvailable,
          total: newPending + newReserved + newAvailable,
        },
        amount: adjustmentAmount,
        targetBalance,
        reason,
        adminId: admin.id,
        timestamp: now,
      },
      message: `Balance adjusted successfully. ${targetBalance} balance ${adjustmentAmount >= 0 ? 'increased' : 'decreased'} by KSh ${Math.abs(adjustmentAmount)}`,
    });
  } catch (error: any) {
    console.error('Error adjusting balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust balance' },
      { status: 500 }
    );
  }
}
