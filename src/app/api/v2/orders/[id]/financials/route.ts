import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { calculateOrderFinancialsFromOrderId } from '@/lib/order-flow-helpers';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/orders/[id]/financials
 * 
 * Calculate and return financial breakdown for an order
 * 
 * 🔴 CRITICAL: All calculations based on ACTUAL payment amount from client, not calculated amounts
 * 
 * Returns financial components based on actual payment:
 * - clientAmount: ACTUAL amount paid by client (from payments table)
 * - freelancerAmount: Freelancer payout (CPP-level based, calculated from actual payment)
 * - managerAssignedFee: 10 KES flat
 * - managerDeliveryFee: 10 + 5 × (pages - 1) KES
 * - managerTotal: Sum of manager fees
 * - adminProfit: Remainder (actualPayment - freelancerAmount - managerTotal)
 * 
 * Auth: Requires admin, manager, or assigned freelancer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate
    const authCheck = await requireRole(request, ['admin', 'manager', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const { id } = await params;
    const orderId = parseInt(id);

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Authorization: Freelancers can only see financials for orders assigned to them
    if (user.role === 'freelancer' && order.assignedFreelancerId !== user.id) {
      return NextResponse.json({ 
        error: 'Not authorized to view financials for this order' 
      }, { status: 403 });
    }

    // 🔴 FIX: Use the async version that fetches and uses actual payment amount
    const resolvedClientCpp = order.clientCpp ?? order.effectiveCpp ?? order.baseCpp ?? 0;

    const financials = await calculateOrderFinancialsFromOrderId({
      orderId,
      pages: order.pages || 0,
      slides: order.slides || 0,
      clientCpp: resolvedClientCpp,
      workType: order.workType || 'standard',
      singleSpaced: Boolean(order.singleSpaced),
      freelancerId: order.assignedFreelancerId,
      managerId: order.managerId,
    });

    return NextResponse.json({
      orderId,
      financials: {
        clientAmount: financials.clientAmount,
        freelancerAmount: financials.freelancerAmount,
        managerAssignedFee: financials.managerAssignedFee,
        managerDeliveryFee: financials.managerDeliveryFee,
        managerTotal: financials.managerTotal,
        adminProfit: financials.adminProfit,
      },
      breakdown: {
        pages: order.pages || 0,
        slides: order.slides || 0,
        clientCpp: resolvedClientCpp,
        singleSpaced: Boolean(order.singleSpaced),
        effectivePages: financials.effectivePages,
        workType: order.workType || 'standard',
        freelancerCompletedOrders: financials.freelancerCompletedOrders || 0,
        freelancerCppLevel: financials.cppLevelName || 'N/A',
      }
    });
  } catch (error: any) {
    console.error('Error calculating financials:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to calculate financials' 
    }, { status: 500 });
  }
}
