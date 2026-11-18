import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, payments, notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * POST /api/v2/orders/[id]/submit-payment
 * 
 * Client submits payment details (MPESA code) for an approved order
 * Creates a pending payment record that admin must confirm
 * 
 * Flow:
 * - Validates order is approved and not already paid
 * - Creates payment record with status 'pending'
 * - Notifies admin of pending payment
 * - Order status remains 'approved' until admin confirms
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { phoneNumber, mpesaCode, paymentMethod = 'mpesa' } = body;

    // Authenticate - allow both client and account_owner
    const authCheck = await requireRole(request, ['client', 'account_owner']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user!;

    if (!phoneNumber || !mpesaCode) {
      return NextResponse.json({ 
        error: 'Phone number and MPESA code are required' 
      }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate order belongs to client
    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'You can only pay for your own orders' }, { status: 403 });
    }

    // Validate order status - allow both approved and delivered
    const payableStatuses = ['approved', 'delivered'];
    if (!payableStatuses.includes(order.status)) {
      return NextResponse.json({ 
        error: `Order must be approved or delivered before payment. Current status: ${order.status}` 
      }, { status: 400 });
    }

    // Check if already paid
    if (order.paymentConfirmed) {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    // Check for existing payment - allow updating if exists
    const [existingPayment] = await db.select().from(payments)
      .where(eq(payments.jobId, orderId));

    if (existingPayment && existingPayment.status === 'confirmed') {
      return NextResponse.json({ error: 'Payment already confirmed' }, { status: 400 });
    }

    if (existingPayment && existingPayment.status === 'completed') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create or update payment record with pending status
    if (existingPayment) {
      await db.update(payments)
        .set({
          status: 'pending',
          mpesaCode: mpesaCode.trim().toUpperCase(),
          phoneNumber: phoneNumber.trim(),
          paymentMethod: paymentMethod,
          updatedAt: now,
        })
        .where(eq(payments.jobId, orderId));
    } else {
      await db.insert(payments).values({
        jobId: orderId,
        clientId: order.clientId,
        freelancerId: order.assignedFreelancerId || null,
        amount: order.amount || 0,
        paymentMethod: paymentMethod,
        status: 'pending',
        mpesaCode: mpesaCode.trim().toUpperCase(),
        phoneNumber: phoneNumber.trim(),
        createdAt: now,
        updatedAt: now,
      });
    }

    // Notify admin of pending payment
    // Get all admins
    const admins = await db.select().from(users)
      .where(eq(users.role, 'admin'));

    const notificationPromises = admins.map(admin => 
      db.insert(notifications).values({
        userId: admin.id,
        jobId: orderId,
        type: 'payment_pending',
        title: 'Payment Pending Confirmation',
        message: `Client ${user.name} submitted payment for order ${order.displayId || order.orderNumber || orderId}. MPESA Code: ${mpesaCode.trim().toUpperCase()}`,
        read: false,
        createdAt: now,
      })
    );

    await Promise.all(notificationPromises);

    // Get updated payment
    const [updatedPayment] = await db.select().from(payments)
      .where(eq(payments.jobId, orderId));

    return NextResponse.json({ 
      success: true,
      payment: updatedPayment,
      message: 'Payment submitted successfully. Admin will confirm shortly.',
    });
  } catch (error: any) {
    console.error('Error submitting payment:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to submit payment' 
    }, { status: 500 });
  }
}

