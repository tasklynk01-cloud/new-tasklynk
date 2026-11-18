import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { balances, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/balances/[userId]
 * 
 * Fetch user's balance breakdown
 * 
 * Returns:
 * - available_balance: Funds ready for withdrawal
 * - pending_balance: Approved orders awaiting admin payment confirmation
 * - reserved_balance: Payment confirmed, awaiting settlement/payout
 * - total_earned: Lifetime earnings
 * - total_withdrawn: Lifetime withdrawals
 * - (For managers only) assignment_balance: Earnings from assigning orders
 * - (For managers only) delivery_balance: Earnings from delivering orders
 * 
 * Auth: Requires user to be fetching their own balance OR admin role
 * 
 * Response:
 * {
 *   balance: {
 *     userId: number,
 *     availableBalance: number,
 *     pendingBalance: number,
 *     reservedBalance: number,
 *     totalEarned: number,
 *     totalWithdrawn: number,
 *     assignmentBalance?: number,   // Managers only
 *     deliveryBalance?: number,     // Managers only
 *     createdAt: string,
 *     updatedAt: string
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Authenticate
    const authCheck = await requireRole(request, ['admin', 'freelancer', 'manager', 'client', 'account_owner', 'editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const { userId } = await params;
    const targetUserId = parseInt(userId);

    // Authorization: Users can only fetch their own balance unless admin
    if (user.role !== 'admin' && user.id !== targetUserId) {
      return NextResponse.json({ 
        error: 'Not authorized to view this balance' 
      }, { status: 403 });
    }

    // Fetch user role to determine if manager-specific fields should be included
    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));

    // Fetch balance
    const [balance] = await db.select().from(balances).where(eq(balances.userId, targetUserId));

    if (!balance) {
      // Return zero balance if no record exists
      const baseBalance = {
        userId: targetUserId,
        availableBalance: 0,
        pendingBalance: 0,
        reservedBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add manager-specific fields if user is a manager
      if (targetUser?.role === 'manager') {
        return NextResponse.json({
          balance: {
            ...baseBalance,
            assignmentBalance: 0,
            deliveryBalance: 0,
          }
        });
      }

      return NextResponse.json({ balance: baseBalance });
    }

    // Include manager-specific breakdown if user is a manager
    if (targetUser?.role === 'manager') {
      return NextResponse.json({
        balance: {
          ...balance,
          assignmentBalance: balance.assignmentBalance || 0,
          deliveryBalance: balance.deliveryBalance || 0,
        }
      });
    }

    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch balance' 
    }, { status: 500 });
  }
}
