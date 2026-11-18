import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * PATCH /api/v2/orders/[id]/update-earnings
 * Admin-only endpoint to manually update freelancer and manager payment amounts
 * 
 * Body: {
 *   freelancerAmount: number,
 *   managerAmount: number
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 AUTHENTICATION: Only admins can update payment amounts
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }
    const adminUser = authCheck.user!;

    const { id } = await params;
    const orderId = parseInt(id);
    
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Valid order ID required', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { freelancerAmount, managerAmount } = body as {
      freelancerAmount: number;
      managerAmount: number;
    };

    // Validate inputs
    if (typeof freelancerAmount !== 'number' || freelancerAmount < 0) {
      return NextResponse.json(
        { error: 'Valid freelancer amount required (must be >= 0)', code: 'INVALID_FREELANCER_AMOUNT' },
        { status: 400 }
      );
    }

    if (typeof managerAmount !== 'number' || managerAmount < 0) {
      return NextResponse.json(
        { error: 'Valid manager amount required (must be >= 0)', code: 'INVALID_MANAGER_AMOUNT' },
        { status: 400 }
      );
    }

    // Fetch the order
    const [order] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Calculate new admin profit based on client amount
    const clientAmount = order.amount || 0;
    const adminProfit = Math.max(0, clientAmount - (freelancerAmount + managerAmount));

    // Update the order with new amounts
    await db
      .update(jobs)
      .set({
        freelancerEarnings: freelancerAmount,
        managerEarnings: managerAmount,
        adminProfit: adminProfit,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(jobs.id, orderId));

    console.log(`[Update Earnings] Admin ${adminUser.id} updated order ${orderId}:`, {
      freelancerAmount,
      managerAmount,
      adminProfit,
      oldFreelancerAmount: order.freelancerEarnings,
      oldManagerAmount: order.managerEarnings,
    });

    return NextResponse.json({
      success: true,
      orderId,
      financials: {
        clientAmount,
        freelancerAmount,
        managerAmount,
        adminProfit,
      },
      message: 'Payment amounts updated successfully',
    });
  } catch (error: any) {
    console.error('[Update Earnings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment amounts', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
