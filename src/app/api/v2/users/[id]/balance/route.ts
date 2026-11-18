import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { balances, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/v2/users/[id]/balance - Get user balance information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    // Get user with balance info
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      balance: users.balance,
      earned: users.earned,
      totalEarnings: users.totalEarnings,
      totalEarned: users.totalEarned,
      totalSpent: users.totalSpent,
      completedJobs: users.completedJobs,
      completedOrders: users.completedJobs,
      rating: users.rating,
      ratingAverage: users.ratingAverage,
      ratingCount: users.ratingCount,
    }).from(users).where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Wallet balances (single source of truth for payouts): balances table
    let writerBalance = null;
    if (user.role === 'freelancer' || user.role === 'manager') {
      const [balanceRow] = await db
        .select()
        .from(balances)
        .where(eq(balances.userId, userId))
        .limit(1);
      writerBalance = balanceRow || null;
    }

    return NextResponse.json({ 
      user,
      writerBalance,
      balance: {
        // NOTE: clients may still use users.balance as a budget-like field
        available: (user.role === 'freelancer' || user.role === 'manager')
          ? (writerBalance?.availableBalance || 0)
          : (user.balance || 0),
        earned: user.earned || 0,
        totalEarnings: user.totalEarnings || 0,
        totalEarned: user.totalEarned || 0,
        totalSpent: user.totalSpent || 0,
      }
    });
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch balance' }, { status: 500 });
  }
}