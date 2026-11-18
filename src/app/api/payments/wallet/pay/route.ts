import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, payments, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/admin-auth';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';
import { generatePaymentReference } from '@/lib/mpesa-service';

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const orderId = Number(body.orderId);

    if (!orderId || orderId <= 0) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // 1. Fetch order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Authorization
    if (authenticatedUser.role !== 'admin' && order.clientId !== authenticatedUser.id) {
      return NextResponse.json({ error: 'Unauthorized to pay for this order' }, { status: 403 });
    }

    // 3. Status checks
    if (order.status === 'paid' || (order as any).paymentConfirmed) {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    // 4. Fetch client balance
    const [client] = await db.select().from(users).where(eq(users.id, order.clientId)).limit(1);
    const clientBalance = Number(client?.balance || 0);
    const orderAmount = Number(order.amount);
    if (!Number.isFinite(orderAmount) || orderAmount <= 0 || order.status === 'cancelled') {
      return NextResponse.json({ error: 'This order cannot be paid' }, { status: 400 });
    }

    if (clientBalance < orderAmount) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You have KES ${clientBalance.toFixed(2)}, but KES ${orderAmount.toFixed(2)} is required.`,
        currentBalance: clientBalance,
        requiredAmount: orderAmount,
      }, { status: 400 });
    }

    // 5. Deduct from client balance & record payment
    let newBalance = clientBalance - orderAmount;
    const nowIso = new Date().toISOString();
    const reference = generatePaymentReference('TLK-WAL');

    const paymentRecord = await db.transaction(async tx => {
      const [lockedOrder] = await tx.select().from(jobs).where(eq(jobs.id, order.id)).for('update');
      if (!lockedOrder || lockedOrder.paymentConfirmed || lockedOrder.status === 'paid' || lockedOrder.status === 'cancelled') throw new Error('Order is already paid or unavailable');
      if (Number(lockedOrder.amount) !== orderAmount) throw new Error('Order amount changed. Please refresh and retry.');
      const [lockedClient] = await tx.select().from(users).where(eq(users.id, order.clientId)).for('update');
      if (!lockedClient || Number(lockedClient.balance || 0) < orderAmount) throw new Error('Insufficient wallet balance');
      newBalance = Number(lockedClient.balance || 0) - orderAmount;
    await tx
      .update(users)
      .set({
        balance: newBalance,
        totalSpent: Number(lockedClient.totalSpent || 0) + orderAmount,
        updatedAt: nowIso,
      })
      .where(eq(users.id, order.clientId));

    const [createdPayment] = await tx
      .insert(payments)
      .values({
        reference,
        jobId: order.id,
        orderId: order.id,
        clientId: order.clientId,
        userId: order.clientId,
        freelancerId: order.assignedFreelancerId || null,
        amount: orderAmount,
        currency: 'KES',
        paymentMethod: 'wallet',
        provider: 'wallet',
        status: 'paid',
        paidAt: nowIso,
        resultCode: 0,
        resultDescription: 'Paid in full using TaskLynk wallet balance.',
        createdAt: nowIso,
        updatedAt: nowIso,
        confirmedByAdmin: true,
      })
      .returning();
    await tx.update(jobs).set({ paymentConfirmed: true, updatedAt: nowIso }).where(eq(jobs.id, order.id));
    return createdPayment;
    });

    // 6. Transition order to paid
    if (['approved', 'delivered'].includes(order.status)) {
      await confirmPaymentReceived({
        orderId: order.id,
        paymentId: paymentRecord.id,
        adminId: authenticatedUser.id,
        actualPaymentAmount: orderAmount,
      });
    } else {
      await db
        .update(jobs)
        .set({
          status: 'paid',
          paymentConfirmed: true,
          paidAt: nowIso,
          updatedAt: nowIso,
        })
        .where(eq(jobs.id, order.id));
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentRecord.id,
      reference,
      amount: orderAmount,
      newBalance,
      message: 'Order paid successfully using your TaskLynk wallet balance!',
    });
  } catch (err: any) {
    console.error('[Wallet Pay API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to pay with wallet' }, { status: 500 });
  }
}
