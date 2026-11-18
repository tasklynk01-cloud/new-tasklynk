import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users, clientProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/users/[id]
 * Get detailed user information for admin
 */
export async function GET(
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
    const userId = parseInt(resolvedParams.id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get client profile if it exists
    let clientProfile = null;
    if (['client', 'account_owner'].includes(user.role)) {
      const [profile] = await db
        .select()
        .from(clientProfiles)
        .where(eq(clientProfiles.userId, userId))
        .limit(1);
      clientProfile = profile || null;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
        paymentTerms: user.paymentTerms || 'pod',
        balance: user.balance || 0,
        phone: user.phone,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt,
        domainId: user.domainId,
      },
      clientProfile,
    });

  } catch (error) {
    console.error('Failed to get user details:', error);
    return NextResponse.json(
      { error: 'Failed to get user details' },
      { status: 500 }
    );
  }
}