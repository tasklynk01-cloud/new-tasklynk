import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/users/[id]/payment-terms
 * Update payment terms for a client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Authenticate admin
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const rawUserId = resolvedParams.id;

    if (!rawUserId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const numericUserId = parseInt(rawUserId);

    // Parse request body
    const { paymentTerms } = await request.json();

    // Validate payment terms
    const validTerms = ['pod', 'poa'];
    if (!paymentTerms || !validTerms.includes(paymentTerms)) {
      return NextResponse.json({ 
        error: 'Payment terms must be either "pod" (Pay on Delivery) or "poa" (Pay on Approval)' 
      }, { status: 400 });
    }

    // Fetch user to verify they exist and are a client
    const [user] = await db
      .select()
      .from(users)
      .where(
        Number.isNaN(numericUserId)
          ? eq(users.displayId, rawUserId)
          : eq(users.id, numericUserId)
      )
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is a client or account_owner
    if (!['client', 'account_owner'].includes(user.role)) {
      return NextResponse.json({ 
        error: 'Payment terms can only be set for clients and account owners' 
      }, { status: 400 });
    }

    // Update payment terms
    await db
      .update(users)
      .set({
        paymentTerms,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    console.log('[Admin] Payment terms updated:', {
      userId: user.id,
      userEmail: user.email,
      previousTerms: user.paymentTerms,
      newTerms: paymentTerms,
      updatedBy: authCheck.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment terms updated successfully',
      data: {
        userId: user.id,
        paymentTerms,
      },
    });
  } catch (error) {
    console.error('Failed to update payment terms:', error);
    return NextResponse.json(
      { error: 'Failed to update payment terms' },
      { status: 500 }
    );
  }
}
