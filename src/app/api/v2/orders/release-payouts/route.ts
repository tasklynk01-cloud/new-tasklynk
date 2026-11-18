import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { ORDER_STATUS } from '@/db/schema-order-flow-updates';
import { settlePaidOrder, type SettlementResult } from '@/lib/order-flow-helpers';
import { and, eq, inArray, lte } from 'drizzle-orm';

interface ReleaseRequestBody {
  orderIds?: number[];
  minHoursSincePaid?: number;
  dryRun?: boolean;
}

export async function POST(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const admin = authCheck.user!;
  const body: ReleaseRequestBody = await request.json().catch(() => ({}));
  const minHours = Math.max(1, body.minHoursSincePaid ?? 24);
  const dryRun = Boolean(body.dryRun);

  let resolvedOrderIds: number[] | undefined;
  if (body.orderIds) {
    if (!Array.isArray(body.orderIds)) {
      return NextResponse.json({ error: 'orderIds must be an array of numbers' }, { status: 400 });
    }
    resolvedOrderIds = body.orderIds
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (resolvedOrderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds array must contain valid numeric IDs' }, { status: 400 });
    }
  }

  const cutoffIso = new Date(Date.now() - minHours * 60 * 60 * 1000).toISOString();

  const filters = [eq(jobs.status, ORDER_STATUS.PAID)];
  if (resolvedOrderIds?.length) {
    filters.push(inArray(jobs.id, resolvedOrderIds));
  } else {
    filters.push(lte(jobs.paidAt, cutoffIso));
  }

  const eligibleOrders = await db
    .select({
      id: jobs.id,
      status: jobs.status,
      displayId: jobs.displayId,
      orderNumber: jobs.orderNumber,
      paidAt: jobs.paidAt,
      freelancerId: jobs.assignedFreelancerId,
      freelancerAmount: jobs.freelancerEarnings,
      managerId: jobs.managerId,
      managerAmount: jobs.managerEarnings,
    })
    .from(jobs)
    .where(and(...filters));

  if (eligibleOrders.length === 0) {
    return NextResponse.json({
      success: true,
      released: 0,
      message: 'No paid orders matched the release criteria.',
    });
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      released: 0,
      dryRun: true,
      orders: eligibleOrders.map((order) => ({
        id: order.id,
        label: order.displayId || order.orderNumber || `#${order.id}`,
        paidAt: order.paidAt,
      })),
    });
  }

  const releasedOrders: SettlementResult[] = [];

  for (const order of eligibleOrders) {
    try {
      const settlement = await settlePaidOrder({
        orderId: order.id,
        actorId: admin.id,
        actorRole: admin.role,
        note: 'Automated payout release via /api/v2/orders/release-payouts',
      });
      releasedOrders.push(settlement);
    } catch (error) {
      console.error(`[Payout Release] Failed for order ${order.id}:`, error);
      return NextResponse.json(
        {
          error: `Failed to release payouts for order ${order.id}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    released: releasedOrders.length,
    details: releasedOrders,
  });
}

