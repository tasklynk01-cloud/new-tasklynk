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
    const body = await request.json();
    const { transactionReference } = body;

    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

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

    if (payout.status !== 'approved') {
      return NextResponse.json(
        { error: `Payout must be approved before processing. Current status: ${payout.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Atomic balance + payout update
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

      if ((balanceRow.pendingBalance || 0) < payout.amount) {
        throw new Error('Insufficient pending balance for settlement');
      }

      await tx
        .update(balances)
        .set({
          pendingBalance: Math.max(0, (balanceRow.pendingBalance || 0) - payout.amount),
          totalWithdrawn: (balanceRow.totalWithdrawn || 0) + payout.amount,
          updatedAt: now,
        })
        .where(eq(balances.userId, payout.writerId));

      const [payoutRow] = await tx
        .update(payoutRequests)
        .set({
          status: 'processed',
          transactionReference,
          updatedAt: now,
        })
        .where(eq(payoutRequests.id, payoutId))
        .returning();

      return payoutRow;
    });

    if (!updatedPayout) {
      return NextResponse.json(
        { error: 'Failed to process payout' },
        { status: 500 }
      );
    }

    // 📝 AUDIT: Log payout processing
    await logAdminActionWithRequest(
      request,
      adminUser.id,
      AdminActions.PROCESS_PAYOUT,
      payoutId,
      AuditTargetTypes.PAYOUT,
      {
        writerId: payout.writerId,
        amount: payout.amount,
        transactionReference,
        method: payout.method,
      }
    );

    // Create notification for writer
    await db.insert(notifications).values({
      userId: payout.writerId,
      type: 'payout_processed',
      title: 'Payment Sent',
      message: `Your payout of KSh ${payout.amount.toFixed(2)} has been processed. Transaction reference: ${transactionReference}`,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      payoutRequest: updatedPayout,
      message: 'Payout processed successfully',
    });
  } catch (error) {
    console.error('Error processing payout request:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}