import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/v2/users/[id]/payment-terms
 * Update payment terms for a specific client (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Validate admin authentication
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const rawUserId = resolvedParams.id;
    
    console.log('[Payment Terms] Received request for user ID:', rawUserId);
    
    if (!rawUserId) {
      console.error('[Payment Terms] No user ID provided');
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    const numericUserId = parseInt(rawUserId);

    const body = await request.json();
    const { paymentTerms } = body;

    // Validate payment terms
    if (!paymentTerms || !['poa', 'pod'].includes(paymentTerms)) {
      return NextResponse.json(
        { error: 'Invalid payment terms. Must be "poa" or "pod"' },
        { status: 400 }
      );
    }

    // Check if user exists and is a client
    const [existingUser] = await db
      .select()
      .from(users)
      .where(
        Number.isNaN(numericUserId)
          ? eq(users.displayId, rawUserId)
          : eq(users.id, numericUserId)
      )
      .limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!['client', 'account_owner'].includes(existingUser.role)) {
      return NextResponse.json(
        { error: 'Payment terms can only be set for clients' },
        { status: 400 }
      );
    }

    // Update payment terms
    await db
      .update(users)
      .set({
        paymentTerms,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, existingUser.id));

    return NextResponse.json({
      success: true,
      message: `Payment terms updated to ${paymentTerms.toUpperCase()}`,
      paymentTerms,
    });
  } catch (error) {
    console.error('Failed to update payment terms:', error);
    return NextResponse.json(
      { error: 'Failed to update payment terms' },
      { status: 500 }
    );
  }
}
