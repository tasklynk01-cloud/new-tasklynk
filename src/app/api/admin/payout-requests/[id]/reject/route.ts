import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payoutRequests, adminAuditLogs, writerBalances } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST - Reject payout request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;
    const payoutId = parseInt(id);

    if (isNaN(payoutId)) {
      return NextResponse.json({ error: 'Invalid payout ID' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Verify payout request exists and is pending or approved
    const existing = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, payoutId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    const payout = existing[0];
    if (payout.status !== 'pending' && payout.status !== 'approved') {
      return NextResponse.json(
        { error: `Cannot reject payout with status: ${payout.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const ipAddress =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null;
    const userAgent = request.headers.get('user-agent') || null;

    // STEP 1: Restore balance FIRST before status change (critical for consistency)
    const existingBalance = await db
      .select()
      .from(writerBalances)
      .where(eq(writerBalances.writerId, payout.writerId))
      .limit(1);

    if (existingBalance.length > 0) {
      const newPendingBalance = Math.max(
        0,
        (existingBalance[0].pendingBalance || 0) - payout.amount
      );
      await db
        .update(writerBalances)
        .set({
          availableBalance: (existingBalance[0].availableBalance || 0) + payout.amount,
          pendingBalance: newPendingBalance,
          updatedAt: now,
        })
        .where(eq(writerBalances.writerId, payout.writerId));
    } else {
      // Create balance record if it doesn't exist
      await db.insert(writerBalances).values({
        writerId: payout.writerId,
        availableBalance: payout.amount,
        pendingBalance: 0,
        totalEarned: 0,
        updatedAt: now,
      });
    }

    // STEP 2: Update payout request status to 'rejected' AFTER balance restored
    await db
      .update(payoutRequests)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        processedAt: now,
        processedBy: authCheck.user!.id,
        updatedAt: now,
      })
      .where(eq(payoutRequests.id, payoutId));

    // Create audit log entry
    try {
      await db.insert(adminAuditLogs).values({
        adminId: authCheck.user!.id,
        action: 'reject_payout',
        targetId: payoutId,
        targetType: 'payout',
        ipAddress,
        userAgent,
        details: { reason, previousStatus: payout.status, amount: payout.amount },
        timestamp: now,
        createdAt: now,
      });
    } catch (auditErr) {
      console.error('Failed to create audit log:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payout request rejected',
      payoutId: id,
      rejectedAt: now,
    });
  } catch (error) {
    console.error('Error rejecting payout request:', error);
    return NextResponse.json(
      { error: 'Failed to reject payout request' },
      { status: 500 }
    );
  }
}
