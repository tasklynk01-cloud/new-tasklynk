import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, balances, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminUser = authCheck.user!;
    const payoutId = parseInt(params.id);
    const adminId = adminUser.id;

    // Get payout request
    const [payout] = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, payoutId))
      .limit(1);

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      );
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: `Payout request is already ${payout.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Atomic balance + payout update
    let previousAvailable = 0;
    let newAvailable = 0;
    const updatedPayout = await db.transaction(async (tx) => {
      const [existingBalance] = await tx
        .select()
        .from(balances)
        .where(eq(balances.userId, payout.writerId))
        .limit(1);

      if (!existingBalance) {
        await tx.insert(balances).values({
          userId: payout.writerId,
          availableBalance: 0,
          pendingBalance: 0,
          reservedBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      const [balanceRow] = await tx
        .select()
        .from(balances)
        .where(eq(balances.userId, payout.writerId))
        .limit(1);

      if (!balanceRow) {
        throw new Error('Balance record not found');
      }

      if ((balanceRow.availableBalance || 0) < payout.amount) {
        return null;
      }

      previousAvailable = balanceRow.availableBalance || 0;
      newAvailable = previousAvailable - payout.amount;

      await tx
        .update(balances)
        .set({
          availableBalance: newAvailable,
          pendingBalance: (balanceRow.pendingBalance || 0) + payout.amount,
          updatedAt: now,
        })
        .where(eq(balances.userId, payout.writerId));

      const [payoutRow] = await tx
        .update(payoutRequests)
        .set({
          status: 'approved',
          processedAt: now,
          processedBy: adminId,
          updatedAt: now,
        })
        .where(eq(payoutRequests.id, payoutId))
        .returning();

      return payoutRow;
    });

    if (!updatedPayout) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: KSh ${previousAvailable.toFixed(2)}` },
        { status: 400 }
      );
    }

    // 📝 AUDIT: Log payout approval
    await logAdminActionWithRequest(
      request,
      adminUser.id,
      AdminActions.APPROVE_PAYOUT,
      payoutId,
      AuditTargetTypes.PAYOUT,
      {
        writerId: payout.writerId,
        amount: payout.amount,
        method: payout.method,
        previousBalance: previousAvailable,
        newBalance: newAvailable,
      }
    );

    // Create notification for writer
    await db.insert(notifications).values({
      userId: payout.writerId,
      type: 'payout_approved',
      title: 'Payout Request Approved',
      message: `Your payout request for KSh ${payout.amount.toFixed(2)} has been approved. Payment will be processed shortly.`,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      payoutRequest: updatedPayout,
      message: 'Payout request approved successfully',
    });
  } catch (error) {
    console.error('Error approving payout request:', error);
    return NextResponse.json(
      { error: 'Failed to approve payout request' },
      { status: 500 }
    );
  }
}