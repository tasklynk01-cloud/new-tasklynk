import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, payments, users } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { confirmPaymentReceived } from '@/lib/order-flow-helpers';

/**
 * POST /api/v2/payments/mark-paid
 * 
 * Marks orders as paid after successful payment confirmation.
 * Uses confirmPaymentReceived() for proper balance updates when possible.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate - allow client, account_owner, and admin
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user!;
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        error: 'Order IDs array is required' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Validate all orders exist
    const ordersToUpdate = await db.select()
      .from(jobs)
      .where(inArray(jobs.id, orderIds));

    if (ordersToUpdate.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Non-admin users can only mark their own orders
    if (user.role !== 'admin') {
      const unauthorizedOrders = ordersToUpdate.filter(order => order.clientId !== user.id);
      if (unauthorizedOrders.length > 0) {
        return NextResponse.json({ 
          error: 'You can only mark your own orders as paid' 
        }, { status: 403 });
      }
    }

    // Check if orders are in valid status for payment
    const validStatuses = ['delivered', 'accepted', 'approved', 'revision'];
    const invalidOrders = ordersToUpdate.filter(order => !validStatuses.includes(order.status));
    
    if (invalidOrders.length > 0) {
      return NextResponse.json({ 
        error: `Some orders are not in valid status for payment. Invalid: ${invalidOrders.map(o => `${o.displayId}(${o.status})`).join(', ')}` 
      }, { status: 400 });
    }

    // Get system admin ID for confirmPaymentReceived
    const [systemAdmin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    const adminId = systemAdmin?.id || user.id;

    const results: { orderId: number; success: boolean; error?: string }[] = [];

    for (const order of ordersToUpdate) {
      try {
        // Find or create payment record for this order
        let [payment] = await db.select().from(payments).where(eq(payments.jobId, order.id)).limit(1);
        
        if (!payment) {
          const [newPayment] = await db.insert(payments).values({
            jobId: order.id,
            clientId: order.clientId,
            freelancerId: order.assignedFreelancerId || null,
            amount: order.amount || 0,
            paymentMethod: 'manual',
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          }).returning();
          payment = newPayment;
        }

        // Use confirmPaymentReceived for proper balance updates
        if (['approved', 'delivered'].includes(order.status)) {
          await confirmPaymentReceived({
            orderId: order.id,
            paymentId: payment.id,
            adminId,
          });
        } else {
          // For other statuses, do direct update
          await db.update(jobs)
            .set({ 
              status: 'paid',
              paymentConfirmed: true,
              paidAt: now,
              updatedAt: now,
            })
            .where(eq(jobs.id, order.id));

          await db.update(payments)
            .set({ 
              status: 'confirmed',
              confirmedAt: now,
              updatedAt: now,
            })
            .where(eq(payments.id, payment.id));
        }

        results.push({ orderId: order.id, success: true });
      } catch (orderError: any) {
        console.error(`[Mark Paid] Failed for order ${order.id}:`, orderError);
        results.push({ orderId: order.id, success: false, error: orderError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedResults = results.filter(r => !r.success);

    return NextResponse.json({ 
      success: successCount > 0,
      message: `${successCount}/${orderIds.length} order(s) marked as paid`,
      results,
      ...(failedResults.length > 0 ? { warnings: failedResults } : {}),
    });

  } catch (error) {
    console.error('Error marking orders as paid:', error);
    return NextResponse.json({ 
      error: 'Failed to mark orders as paid' 
    }, { status: 500 });
  }
}

