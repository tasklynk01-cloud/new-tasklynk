import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { accounts, users, jobs } from '@/db/schema';
import { eq, sql, desc, count, sum, and, inArray } from 'drizzle-orm';

/**
 * GET /api/v2/accounts
 * Fetch all accounts with linked user counts and stats
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication and role (admin only)
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Get all accounts with user counts and financial stats
    const accountsList = await db.select({
      id: accounts.id,
      accountName: accounts.accountName,
      contactPerson: accounts.contactPerson,
      contactEmail: accounts.contactEmail,
      createdAt: accounts.createdAt,
      updatedAt: accounts.updatedAt,
    }).from(accounts).orderBy(desc(accounts.createdAt));

    // For each account, get linked users count and total spent
    const accountsWithStats = await Promise.all(accountsList.map(async (account) => {
      // Count linked users
      const linkedUsers = await db.select({ count: count() })
        .from(users)
        .where(eq(users.accountId, account.id));
      
      // Get total orders and spending from linked users
      const linkedUserIds = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.accountId, account.id));
      
      const userIds = linkedUserIds.map(u => u.id);
      
      let totalOrders = 0;
      let totalSpent = 0;
      let completedOrders = 0;

      if (userIds.length > 0) {
        const orderStats = await db.select({
          count: count(),
          total: sum(jobs.amount),
        })
        .from(jobs)
        .where(inArray(jobs.clientId, userIds));
        
        totalOrders = orderStats[0]?.count || 0;
        totalSpent = Number(orderStats[0]?.total) || 0;

        const completedStats = await db.select({ count: count() })
          .from(jobs)
          .where(and(
            inArray(jobs.clientId, userIds),
            eq(jobs.status, 'completed')
          ));
        completedOrders = completedStats[0]?.count || 0;
      }

      return {
        ...account,
        linkedUsersCount: linkedUsers[0]?.count || 0,
        totalOrders,
        completedOrders,
        totalSpent,
      };
    }));

    return NextResponse.json({ accounts: accountsWithStats });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

/**
 * POST /api/v2/accounts
 * Create a new account
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication and role (admin only)
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { accountName, contactPerson, contactEmail } = body;

    // Validate required fields
    if (!accountName || !contactPerson || !contactEmail) {
      return NextResponse.json({ 
        error: 'Account name, contact person, and contact email are required' 
      }, { status: 400 });
    }

    // Check if account name already exists
    const existingAccount = await db.query.accounts.findFirst({
      where: eq(accounts.accountName, accountName),
    });

    if (existingAccount) {
      return NextResponse.json({ error: 'Account name already exists' }, { status: 400 });
    }

    // Check if contact email already exists
    const existingEmail = await db.query.accounts.findFirst({
      where: eq(accounts.contactEmail, contactEmail),
    });

    if (existingEmail) {
      return NextResponse.json({ error: 'Contact email already in use' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const [newAccount] = await db.insert(accounts).values({
      accountName,
      contactPerson,
      contactEmail,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      account: newAccount,
      message: 'Account created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

