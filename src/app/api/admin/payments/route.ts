import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, paymentAuditLogs } from '@/db/schema';
import { eq, and, or, desc, sql, ilike } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdminRole(request);
    if (adminAuth.error) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status') || 'all';
    const filterProvider = searchParams.get('provider') || 'all';
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50', 10)), 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const conditions: any[] = [];

    // Filter by status
    if (filterStatus === 'unmatched') {
      conditions.push(eq(payments.unmatched, true));
    } else if (filterStatus === 'review_required' || filterStatus === 'payment_review_required') {
      conditions.push(eq(payments.status, 'payment_review_required'));
    } else if (filterStatus === 'paid') {
      conditions.push(or(eq(payments.status, 'paid'), eq(payments.status, 'completed')));
    } else if (filterStatus === 'pending') {
      conditions.push(or(eq(payments.status, 'pending'), eq(payments.status, 'initiated'), eq(payments.status, 'awaiting_confirmation')));
    } else if (filterStatus !== 'all') {
      conditions.push(eq(payments.status, filterStatus));
    }

    // Filter by provider
    if (filterProvider !== 'all') {
      conditions.push(eq(payments.provider, filterProvider));
    }

    // Search query
    if (search) {
      conditions.push(
        or(
          ilike(payments.reference, `%${search}%`),
          ilike(payments.mpesaReceiptNumber, `%${search}%`),
          ilike(payments.phoneNumber, `%${search}%`),
          ilike(payments.checkoutRequestId, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const paymentRows = await db
      .select({
        id: payments.id,
        reference: payments.reference,
        jobId: payments.jobId,
        orderId: payments.orderId,
        clientId: payments.clientId,
        userId: payments.userId,
        amount: payments.amount,
        currency: payments.currency,
        provider: payments.provider,
        paymentMethod: payments.paymentMethod,
        status: payments.status,
        phoneNumber: payments.phoneNumber,
        merchantRequestId: payments.merchantRequestId,
        checkoutRequestId: payments.checkoutRequestId,
        mpesaCheckoutRequestId: payments.mpesaCheckoutRequestId,
        mpesaReceiptNumber: payments.mpesaReceiptNumber,
        mpesaTransactionDate: payments.mpesaTransactionDate,
        resultCode: payments.resultCode,
        resultDescription: payments.resultDescription,
        unmatched: payments.unmatched,
        reconciled: payments.reconciled,
        reconciledAt: payments.reconciledAt,
        reconciliationNotes: payments.reconciliationNotes,
        confirmedByAdmin: payments.confirmedByAdmin,
        rawCallback: payments.rawCallback,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    // Collect order and customer details
    const orderIds: number[] = Array.from(new Set(paymentRows.map(p => p.jobId || p.orderId).filter((id): id is number => Boolean(id))));
    const clientIds: number[] = Array.from(new Set(paymentRows.map(p => p.clientId || p.userId).filter((id): id is number => Boolean(id))));

    const [ordersList, clientsList] = await Promise.all([
      orderIds.length > 0
        ? db.select({ id: jobs.id, title: jobs.title, orderNumber: jobs.orderNumber, displayId: jobs.displayId, status: jobs.status }).from(jobs).where(sql`${jobs.id} IN ${orderIds}`)
        : [],
      clientIds.length > 0
        ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(sql`${users.id} IN ${clientIds}`)
        : [],
    ]);

    type OrderRow = { id: number; title: string; orderNumber: string | null; displayId: string | null; status: string };
    type ClientRow = { id: number; name: string; email: string };

    const orderMap = new Map<number, OrderRow>(ordersList.map(o => [o.id, o]));
    const clientMap = new Map<number, ClientRow>(clientsList.map(c => [c.id, c]));

    const enrichedPayments = paymentRows.map(payment => {
      const targetOrderId = payment.jobId || payment.orderId;
      const order = targetOrderId ? orderMap.get(targetOrderId) : null;
      const targetClientId = payment.clientId || payment.userId;
      const client = targetClientId ? clientMap.get(targetClientId) : null;

      return {
        ...payment,
        amount: Number(payment.amount),
        order: order
          ? {
              id: order.id,
              title: order.title,
              orderNumber: order.orderNumber,
              displayId: order.displayId,
              status: order.status,
            }
          : null,
        customer: client
          ? {
              id: client.id,
              name: client.name,
              email: client.email,
            }
          : null,
      };
    });

    // Counts by status for quick tabs
    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        paid: sql<number>`count(case when ${payments.status} in ('paid', 'completed') then 1 end)::int`,
        pending: sql<number>`count(case when ${payments.status} in ('pending', 'initiated', 'awaiting_confirmation') then 1 end)::int`,
        failed: sql<number>`count(case when ${payments.status} = 'failed' then 1 end)::int`,
        reviewRequired: sql<number>`count(case when ${payments.status} = 'payment_review_required' then 1 end)::int`,
        unmatched: sql<number>`count(case when ${payments.unmatched} = true then 1 end)::int`,
      })
      .from(payments);

    return NextResponse.json({
      success: true,
      payments: enrichedPayments,
      counts: {
        total: Number(counts?.total || 0),
        paid: Number(counts?.paid || 0),
        pending: Number(counts?.pending || 0),
        failed: Number(counts?.failed || 0),
        reviewRequired: Number(counts?.reviewRequired || 0),
        unmatched: Number(counts?.unmatched || 0),
      },
      pagination: {
        limit,
        offset,
        count: enrichedPayments.length,
      },
    });
  } catch (error: any) {
    console.error('[Admin Payments API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}
