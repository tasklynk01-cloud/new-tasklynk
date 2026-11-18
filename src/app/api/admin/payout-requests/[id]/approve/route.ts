import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payoutRequests, adminAuditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST - Approve payout request
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
    const { notes } = body;
    const payoutId = parseInt(id);

    if (isNaN(payoutId)) {
      return NextResponse.json({ error: 'Invalid payout ID' }, { status: 400 });
    }

    // Verify payout request exists and is pending
    const existing = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, payoutId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    if (existing[0].status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot approve payout with status: ${existing[0].status}` },
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

    // Update payout request status to 'approved'
    await db
      .update(payoutRequests)
      .set({
        status: 'approved',
        updatedAt: now,
      })
      .where(eq(payoutRequests.id, payoutId));

    // Create audit log entry
    try {
      await db.insert(adminAuditLogs).values({
        adminId: authCheck.user!.id,
        action: 'approve_payout',
        targetId: payoutId,
        targetType: 'payout',
        ipAddress,
        userAgent,
        details: { notes, previousStatus: 'pending' },
        timestamp: now,
        createdAt: now,
      });
    } catch (auditErr) {
      console.error('Failed to create audit log:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payout request approved',
      payoutId: id,
      approvedAt: now,
    });
  } catch (error) {
    console.error('Error approving payout request:', error);
    return NextResponse.json(
      { error: 'Failed to approve payout request' },
      { status: 500 }
    );
  }
}
