import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { accounts, users, jobs } from '@/db/schema';
import { eq, and, inArray, desc, count, sum, notInArray } from 'drizzle-orm';

/**
 * GET /api/v2/accounts/[id]
 * Fetch account details with linked users and financial summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);

    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin', 'manager', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;

    // If account_owner, verify they belong to this account
    if (user.role === 'account_owner' && user.accountId !== accountId) {
      return NextResponse.json({ error: 'Unauthorized to view this account' }, { status: 403 });
    }

    // Fetch account
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Fetch linked users
    const linkedUsers = await db.select({
      id: users.id,
      displayId: users.displayId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      approved: users.approved,
      totalSpent: users.totalSpent,
      completedJobs: users.completedJobs,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.accountId, accountId))
    .orderBy(desc(users.createdAt));

    // Get user IDs for order queries
    const userIds = linkedUsers.map(u => u.id);

    let orderStats = {
      totalOrders: 0,
      completedOrders: 0,
      activeOrders: 0,
      totalSpent: 0,
    };

    if (userIds.length > 0) {
      // Get total orders
      const totalResult = await db.select({ 
        count: count(),
        total: sum(jobs.amount)
      })
      .from(jobs)
      .where(inArray(jobs.clientId, userIds));

      // Get completed orders
      const completedResult = await db.select({ count: count() })
        .from(jobs)
        .where(and(
          inArray(jobs.clientId, userIds),
          eq(jobs.status, 'completed')
        ));

      // Get active orders (not completed or cancelled)
      const activeResult = await db.select({ count: count() })
        .from(jobs)
        .where(and(
          inArray(jobs.clientId, userIds),
          notInArray(jobs.status, ['completed', 'cancelled'])
        ));

      orderStats = {
        totalOrders: totalResult[0]?.count || 0,
        completedOrders: completedResult[0]?.count || 0,
        activeOrders: activeResult[0]?.count || 0,
        totalSpent: Number(totalResult[0]?.total) || 0,
      };
    }

    // Get recent orders for this account
    let recentOrders: any[] = [];
    if (userIds.length > 0) {
      recentOrders = await db.select({
        id: jobs.id,
        displayId: jobs.displayId,
        title: jobs.title,
        status: jobs.status,
        amount: jobs.amount,
        deadline: jobs.deadline,
        createdAt: jobs.createdAt,
        clientId: jobs.clientId,
      })
      .from(jobs)
      .where(inArray(jobs.clientId, userIds))
      .orderBy(desc(jobs.createdAt))
      .limit(10);
    }

    return NextResponse.json({
      account,
      linkedUsers,
      orderStats,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching account details:', error);
    return NextResponse.json({ error: 'Failed to fetch account details' }, { status: 500 });
  }
}

/**
 * PUT /api/v2/accounts/[id]
 * Update account details
 */
export async function PUT(
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
    const { accountName, contactPerson, contactEmail } = body;

    // Fetch existing account
    const existingAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if new account name is taken by another account
    if (accountName && accountName !== existingAccount.accountName) {
      const nameExists = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.accountName, accountName),
        ),
      });
      if (nameExists && nameExists.id !== accountId) {
        return NextResponse.json({ error: 'Account name already in use' }, { status: 400 });
      }
    }

    // Check if new email is taken by another account
    if (contactEmail && contactEmail !== existingAccount.contactEmail) {
      const emailExists = await db.query.accounts.findFirst({
        where: eq(accounts.contactEmail, contactEmail),
      });
      if (emailExists && emailExists.id !== accountId) {
        return NextResponse.json({ error: 'Contact email already in use' }, { status: 400 });
      }
    }

    const [updatedAccount] = await db.update(accounts)
      .set({
        accountName: accountName || existingAccount.accountName,
        contactPerson: contactPerson || existingAccount.contactPerson,
        contactEmail: contactEmail || existingAccount.contactEmail,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, accountId))
      .returning();

    return NextResponse.json({
      success: true,
      account: updatedAccount,
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

/**
 * DELETE /api/v2/accounts/[id]
 * Delete account (removes account link from users, doesn't delete users)
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

    // Check if account exists
    const existingAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Unlink all users from this account (set accountId to null)
    await db.update(users)
      .set({ 
        accountId: null,
        accountName: null,
      })
      .where(eq(users.accountId, accountId));

    // Delete the account
    await db.delete(accounts).where(eq(accounts.id, accountId));

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. Linked users have been unlinked.',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
