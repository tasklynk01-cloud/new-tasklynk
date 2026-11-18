import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payoutRequests, adminAuditLogs, writerBalances } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST - Process approved payout request
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
    const { notes, transactionReference } = body;
    const payoutId = parseInt(id);

    if (isNaN(payoutId)) {
      return NextResponse.json({ error: 'Invalid payout ID' }, { status: 400 });
    }

    // Verify payout request exists and is approved
    const existing = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, payoutId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    const payout = existing[0];
    if (payout.status !== 'approved') {
      return NextResponse.json(
        { error: `Cannot process payout with status: ${payout.status}. Must be 'approved' first.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const txnRef = transactionReference || `TXN-${Date.now()}`;
    const ipAddress =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null;
    const userAgent = request.headers.get('user-agent') || null;

    // STEP 1: Update writer balance FIRST before status change (critical for consistency)
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
          pendingBalance: newPendingBalance,
          updatedAt: now,
        })
        .where(eq(writerBalances.writerId, payout.writerId));
    } else {
      // Create balance record if it doesn't exist (should not happen in normal flow)
      await db.insert(writerBalances).values({
        writerId: payout.writerId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        updatedAt: now,
      });
    }

    // STEP 2: Update payout request status to 'completed' AFTER balance updated
    await db
      .update(payoutRequests)
      .set({
        status: 'completed',
        processedAt: now,
        processedBy: authCheck.user!.id,
        transactionReference: txnRef,
        updatedAt: now,
      })
      .where(eq(payoutRequests.id, payoutId));

    // Create audit log entry
    try {
      await db.insert(adminAuditLogs).values({
        adminId: authCheck.user!.id,
        action: 'process_payout',
        targetId: payoutId,
        targetType: 'payout',
        ipAddress,
        userAgent,
        details: {
          notes,
          transactionReference: txnRef,
          amount: payout.amount,
          method: payout.method
        },
        timestamp: now,
        createdAt: now,
      });
    } catch (auditErr) {
      console.error('Failed to create audit log:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payout processed successfully',
      payoutId: id,
      processedAt: now,
      status: 'completed',
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { error: 'Failed to process payout' },
      { status: 500 }
    );
  }
}
