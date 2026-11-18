import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderAmountAdjustments, users, jobs } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/v2/orders/[id]/adjustments
 * Get price adjustment history for a specific order
 * Accessible by: admin, manager, client (own orders only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Authentication check - allow client access too
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;

    // If client/account_owner, verify they own this order
    if (user.role === 'client' || user.role === 'account_owner') {
      const order = await db.query.jobs.findFirst({
        where: eq(jobs.id, orderId),
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Check if client owns the order or is part of the same account
      const isOwner = order.clientId === user.id;
      let isSameAccount = false;
      if (user.accountId) {
        const orderOwner = await db.query.users.findFirst({
          where: eq(users.id, order.clientId),
          columns: { accountId: true },
        });
        isSameAccount = Boolean(orderOwner?.accountId && orderOwner.accountId === user.accountId);
      }

      if (!isOwner && !isSameAccount) {
        return NextResponse.json({ error: 'Unauthorized to view this order' }, { status: 403 });
      }
    }

    // Fetch adjustments for this order - with error handling for missing table
    let adjustments: any[] = [];
    try {
      adjustments = await db
        .select({
          id: orderAmountAdjustments.id,
          jobId: orderAmountAdjustments.jobId,
          changedBy: orderAmountAdjustments.changedBy,
          changeType: orderAmountAdjustments.changeType,
          amount: orderAmountAdjustments.amount,
          previousTotal: orderAmountAdjustments.previousTotal,
          newTotal: orderAmountAdjustments.newTotal,
          reason: orderAmountAdjustments.reason,
          status: orderAmountAdjustments.status,
          approvedAt: orderAmountAdjustments.approvedAt,
          appliedAt: orderAmountAdjustments.appliedAt,
          createdAt: orderAmountAdjustments.createdAt,
          // Requester info
          changedByName: users.name,
          changedByRole: users.role,
        })
        .from(orderAmountAdjustments)
        .leftJoin(users, eq(orderAmountAdjustments.changedBy, users.id))
        .where(eq(orderAmountAdjustments.jobId, orderId))
        .orderBy(desc(orderAmountAdjustments.createdAt));
    } catch (tableError: any) {
      const errorMessage = tableError?.message?.toLowerCase() || '';
      if (errorMessage.includes('no such table') || errorMessage.includes('order_amount_adjustments')) {
        console.warn('[Adjustments API] order_amount_adjustments table not found, returning empty array');
        return NextResponse.json({
          orderId,
          adjustments: [],
          summary: {
            totalAdjustments: 0,
            pendingCount: 0,
            appliedCount: 0,
            totalAmountChange: 0,
          },
        });
      }
      throw tableError;
    }

    // Format for client-friendly display
    const formattedAdjustments = adjustments.map(a => ({
      id: a.id,
      type: a.changeType,
      amount: a.amount,
      previousTotal: a.previousTotal,
      newTotal: a.newTotal,
      reason: a.reason,
      status: a.status,
      requestedBy: a.changedByName || 'System',
      requestedByRole: a.changedByRole,
      appliedAt: a.appliedAt,
      createdAt: a.createdAt,
      // Client-friendly status description
      statusDescription: getStatusDescription(a.status, a.changeType),
    }));

    return NextResponse.json({
      orderId,
      adjustments: formattedAdjustments,
      summary: {
        totalAdjustments: adjustments.length,
        pendingCount: adjustments.filter(a => a.status === 'pending').length,
        appliedCount: adjustments.filter(a => a.status === 'applied').length,
        totalAmountChange: adjustments
          .filter(a => a.status === 'applied')
          .reduce((sum, a) => {
            if (a.changeType === 'discount' || a.changeType === 'refund') {
              return sum - (a.amount || 0);
            }
            return sum + (a.amount || 0);
          }, 0),
      },
    });
  } catch (error) {
    console.error('Failed to fetch order adjustments:', error);
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 });
  }
}

function getStatusDescription(status: string | null, changeType: string | null): string {
  const type = changeType === 'discount' ? 'Discount' : 
               changeType === 'refund' ? 'Refund' :
               changeType === 'additional' ? 'Additional Charge' : 'Adjustment';
  
  switch (status) {
    case 'pending':
      return `${type} pending approval`;
    case 'approved':
      return `${type} approved, awaiting application`;
    case 'applied':
      return `${type} applied to order`;
    case 'rejected':
      return `${type} request was rejected`;
    default:
      return `${type} - ${status || 'Unknown'}`;
  }
}
