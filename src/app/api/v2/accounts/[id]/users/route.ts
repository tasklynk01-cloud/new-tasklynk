import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { accounts, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/v2/accounts/[id]/users
 * Link a user to an account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);

    // Validate authentication and role (admin only)
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { userId, setAsOwner } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if account exists
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if user exists and is a client
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'client' && user.role !== 'account_owner') {
      return NextResponse.json({ 
        error: 'Only clients can be linked to accounts' 
      }, { status: 400 });
    }

    // Update user's account association
    const updateData: any = {
      accountId: accountId,
      accountName: account.accountName,
      updatedAt: new Date().toISOString(),
    };

    // If setting as owner, update role
    if (setAsOwner) {
      updateData.role = 'account_owner';
      updateData.roleId = 6; // account_owner role ID
    }

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        accountName: updatedUser.accountName,
      },
      message: `User linked to ${account.accountName} successfully`,
    });
  } catch (error) {
    console.error('Error linking user to account:', error);
    return NextResponse.json({ error: 'Failed to link user to account' }, { status: 500 });
  }
}

/**
 * DELETE /api/v2/accounts/[id]/users
 * Unlink a user from an account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);

    // Validate authentication and role (admin only)
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists and is linked to this account
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, parseInt(userId)),
        eq(users.accountId, accountId)
      ),
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found or not linked to this account' 
      }, { status: 404 });
    }

    // Unlink user from account
    const updateData: any = {
      accountId: null,
      accountName: null,
      updatedAt: new Date().toISOString(),
    };

    // If user was account_owner, revert to regular client
    if (user.role === 'account_owner') {
      updateData.role = 'client';
      updateData.roleId = 2;
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(userId)));

    return NextResponse.json({
      success: true,
      message: 'User unlinked from account successfully',
    });
  } catch (error) {
    console.error('Error unlinking user from account:', error);
    return NextResponse.json({ error: 'Failed to unlink user from account' }, { status: 500 });
  }
}
