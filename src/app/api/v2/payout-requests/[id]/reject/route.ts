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
    // ?? SECURITY: Require admin role
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
    const { rejectionReason } = body;

    // Use authenticated admin instead of passed adminId
    const adminId = adminUser.id;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
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

    if (payout.status !== 'pending' && payout.status !== 'approved') {
      return NextResponse.json(
        { error: `Payout request is already ${payout.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // If payout was approved, return amount from pending -> available
    if (payout.status === 'approved') {
      await db.transaction(async (tx) => {
        const [balanceRow] = await tx
          .select()
          .from(balances)
          .where(eq(balances.userId, payout.writerId))
          .limit(1);

        if (balanceRow) {
          await tx
            .update(balances)
            .set({
              pendingBalance: Math.max(0, (balanceRow.pendingBalance || 0) - payout.amount),
              availableBalance: (balanceRow.availableBalance || 0) + payout.amount,
              updatedAt: now,
            })
            .where(eq(balances.userId, payout.writerId));
        }
      });
    }

    // Update payout request status
    const [updatedPayout] = await db
      .update(payoutRequests)
      .set({
        status: 'rejected',
        processedAt: now,
        processedBy: adminId,
        rejectionReason,
        updatedAt: now,
      })
      .where(eq(payoutRequests.id, payoutId))
      .returning();

    // ?? AUDIT: Log payout rejection
    await logAdminActionWithRequest(
      request,
      adminUser.id,
      AdminActions.REJECT_PAYOUT,
      payoutId,
      AuditTargetTypes.PAYOUT,
      {
        writerId: payout.writerId,
        amount: payout.amount,
        method: payout.method,
        rejectionReason,
      }
    );

    // Create notification for writer
    await db.insert(notifications).values({
      userId: payout.writerId,
      type: 'payout_rejected',
      title: 'Payout Request Rejected',
      message: `Your payout request for KSh ${payout.amount.toFixed(2)} has been rejected. Reason: ${rejectionReason}`,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      payoutRequest: updatedPayout,
      message: 'Payout request rejected',
    });
  } catch (error) {
    console.error('Error rejecting payout request:', error);
    return NextResponse.json(
      { error: 'Failed to reject payout request' },
      { status: 500 }
    );
  }
}
