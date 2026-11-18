import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { balances, jobs, jobStatusLogs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyClientOrderCompleted } from '@/lib/client-notifications';
import { requireRole } from '@/lib/admin-auth';

// POST /api/v2/orders/[id]/complete - Admin marks order as completed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const admin = authCheck.user!;
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json().catch(() => ({}));
    const { adminId } = body || {};

    if (adminId != null && Number(adminId) !== admin.id) {
      return NextResponse.json({ error: 'Admin ID mismatch' }, { status: 403 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order can be completed
    if (order.status !== 'paid' && order.status !== 'approved') {
      return NextResponse.json({ 
        error: `Cannot complete order in status: ${order.status}. Order must be paid first.` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update order status
    await db.update(jobs)
      .set({
        status: 'completed',
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log status change
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: 'completed',
      changedBy: admin.id,
      note: 'Order completed by admin',
      createdAt: now,
    });

    // ✅ Credit freelancer earnings
    if (order.assignedFreelancerId && order.freelancerEarnings) {
      const writerId = order.assignedFreelancerId;
      const earnings = Number(order.freelancerEarnings);
      
      // Single source of truth: balances table
      const [existing] = await db.select().from(balances).where(eq(balances.userId, writerId)).limit(1);
      if (!existing) {
        await db.insert(balances).values({
          userId: writerId,
          availableBalance: earnings,
          pendingBalance: 0,
          reservedBalance: 0,
          totalEarned: earnings,
          totalWithdrawn: 0,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await db
          .update(balances)
          .set({
            availableBalance: (existing.availableBalance || 0) + earnings,
            totalEarned: (existing.totalEarned || 0) + earnings,
            updatedAt: now,
          })
          .where(eq(balances.userId, writerId));
      }
    }

    // ✅ Notify client about completion
    if (order.clientId) {
      await notifyClientOrderCompleted(
        orderId,
        order.clientId,
        order.orderNumber
      );
    }

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Order completed successfully. Freelancer earnings credited.'
    });
  } catch (error: any) {
    console.error('Error completing order:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to complete order' 
    }, { status: 500 });
  }
}