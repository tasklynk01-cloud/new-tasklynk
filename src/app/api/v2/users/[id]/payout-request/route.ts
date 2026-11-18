import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, users, balances } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// POST /api/v2/users/[id]/payout-request - Writer requests payout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Require freelancer or manager role
    const authCheck = await requireRole(request, ['freelancer', 'manager']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const authenticatedUser = authCheck.user!;
    const { id } = await params;
    const writerId = parseInt(id);

    // 🔒 AUTHORIZATION: Users can only request payouts for themselves
    if (authenticatedUser.id !== writerId) {
      return NextResponse.json(
        { error: 'You can only request payouts for your own account' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, method, accountDetails } = body;

    if (!amount || !method || !accountDetails) {
      return NextResponse.json({ 
        error: 'Amount, method, and account details are required' 
      }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number' 
      }, { status: 400 });
    }

    if (!['mpesa', 'bank'].includes(method)) {
      return NextResponse.json({ 
        error: 'Method must be either "mpesa" or "bank"' 
      }, { status: 400 });
    }

    // 🔴 CRITICAL: Check if writer account is approved
    const [writer] = await db.select()
      .from(users)
      .where(eq(users.id, writerId))
      .limit(1);

    if (!writer) {
      return NextResponse.json({ 
        error: 'Writer not found' 
      }, { status: 404 });
    }

    // Allow both freelancers and managers to request payouts
    if (writer.role !== 'freelancer' && writer.role !== 'manager') {
      return NextResponse.json({ 
        error: 'Only freelancers and managers can request payouts' 
      }, { status: 403 });
    }

    if (!writer.approved) {
      return NextResponse.json({ 
        error: 'Your account must be approved before you can request payouts',
        code: 'ACCOUNT_NOT_APPROVED'
      }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Ensure balance row exists
    const [existingBalance] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, writerId))
      .limit(1);

    if (!existingBalance) {
      await db.insert(balances).values({
        userId: writerId,
        availableBalance: 0,
        pendingBalance: 0,
        reservedBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    const [balanceRow] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, writerId))
      .limit(1);

    const availableBalance = balanceRow?.availableBalance || 0;

    if (availableBalance < parsedAmount) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: KSh ${availableBalance.toFixed(2)}` 
      }, { status: 400 });
    }

    // Create payout request
    // Note: Using writerId field for both freelancers and managers (schema limitation)
    const [payoutRequest] = await db.insert(payoutRequests).values({
      writerId, // This field name is misleading - it's actually userId (works for both freelancers and managers)
      amount: parsedAmount,
      method,
      accountDetails: JSON.stringify(accountDetails),
      status: 'pending',
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ 
      payoutRequest,
      message: 'Payout request submitted successfully. Awaiting admin approval.'
    });
  } catch (error: any) {
    console.error('Error creating payout request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create payout request' 
    }, { status: 500 });
  }
}