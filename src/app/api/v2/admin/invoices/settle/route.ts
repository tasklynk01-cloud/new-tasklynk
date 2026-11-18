import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs, invoiceSettlements, orderSettlements, balances, jobStatusLogs, notifications, users } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

/**
 * POST /api/v2/admin/invoices/settle
 * 
 * Batch settle invoices for freelancers/managers (mark orders as completed and generate payout CSV)
 * 
 * Key Behavior:
 * - Accepts array of order IDs or settlement parameters
 * - Generates CSV report of payouts
 * - Updates invoiceSettlements table
 * - Marks orders as isSettled=true, updates orderSettlements
 * - Updates orders to status='completed'
 * - Moves reserved_balance → 0 (clears for external payout)
 * - Creates audit logs for all orders
 * - Idempotent: Cannot settle already settled orders
 * 
 * Auth: Requires admin role only
 * 
 * Body:
 * {
 *   orderIds: number[],  // Array of job IDs to settle
 *   notes?: string,      // Optional settlement notes
 *   generateCSV?: boolean // Default: true
 * }
 * 
 * Response:
 * {
 *   settlements: [...array of settlement records],
 *   ordersProcessed: number,
 *   totalAmount: number,
 *   csv?: string,  // CSV data if generateCSV=true
 *   message: "Successfully settled X orders for Y users"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const admin = authCheck.user!;

    const body = await request.json();
    const { orderIds, notes, generateCSV = true } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds array is required' }, { status: 400 });
    }

    // Get all orders
    const orders = await db.select()
      .from(jobs)
      .where(inArray(jobs.id, orderIds));

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // This endpoint settles PAID orders specifically - require that exact status
    // rather than the generic transition validator. This route and settlePaidOrder
    // (order-flow-helpers.ts, used by /api/v2/orders/release-payouts) are two
    // independent settlement mechanisms that both move a 'paid' order to
    // 'completed'; without this explicit check, an order already settled via the
    // other path would pass the generic same-status-is-always-valid transition
    // check and get double-processed (reservedBalance zeroed and totalWithdrawn
    // incremented a second time for money already released).
    const invalidTransitions = [];
    for (const order of orders) {
      if (order.status !== 'paid') {
        invalidTransitions.push(
          `${order.orderNumber}: must be in 'paid' status to settle (current: ${order.status}). ` +
          `If this order was already settled via /api/v2/orders/release-payouts, it cannot be settled again here.`
        );
      }
    }

    if (invalidTransitions.length > 0) {
      return NextResponse.json({
        error: 'Cannot settle some orders due to invalid status transitions',
        details: invalidTransitions
      }, { status: 400 });
    }

    // Check for already settled orders
    const existingSettlements = await db.select()
      .from(orderSettlements)
      .where(inArray(orderSettlements.jobId, orderIds));

    if (existingSettlements.length > 0) {
      const settledOrderIds = existingSettlements.map(s => s.jobId);
      const settledOrders = orders.filter(o => settledOrderIds.includes(o.id));
      return NextResponse.json({ 
        error: `Some orders are already settled: ${settledOrders.map(o => o.orderNumber).join(', ')}` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Group orders by user (freelancer and manager)
    const userSettlements = new Map<number, { userType: 'freelancer' | 'manager', orders: typeof orders, totalAmount: number }>();

    for (const order of orders) {
      // Add freelancer settlement
      if (order.assignedFreelancerId && order.freelancerEarnings) {
        const existing = userSettlements.get(order.assignedFreelancerId);
        if (existing) {
          existing.orders.push(order);
          existing.totalAmount += order.freelancerEarnings;
        } else {
          userSettlements.set(order.assignedFreelancerId, {
            userType: 'freelancer',
            orders: [order],
            totalAmount: order.freelancerEarnings,
          });
        }
      }

      // Add manager settlement
      if (order.managerId && order.managerEarnings) {
        const existing = userSettlements.get(order.managerId);
        if (existing) {
          existing.orders.push(order);
          existing.totalAmount += order.managerEarnings;
        } else {
          userSettlements.set(order.managerId, {
            userType: 'manager',
            orders: [order],
            totalAmount: order.managerEarnings,
          });
        }
      }
    }

    // ATOMIC TRANSACTION - Use Drizzle transaction wrapper for proper connection pooling
    try {
      const createdSettlements: any[] = [];
      const csvRows: string[] = [
        'User ID,User Name,User Email,User Type,Phone,M-Pesa Number,Amount,Orders Count,Order Numbers,Settlement Date'
      ];

      await db.transaction(async (tx) => {
        // Process each user settlement
        for (const [userId, settlement] of userSettlements.entries()) {
          // Get current balance
          const [userBalance] = await tx.select()
            .from(balances)
            .where(eq(balances.userId, userId));

          if (!userBalance) {
            throw new Error(`Balance not found for user ${userId}`);
          }

          // Create invoice settlement record
          const [settlementRecord] = await tx.insert(invoiceSettlements).values({
            userId: userId,
            userType: settlement.userType,
            settlementAmount: settlement.totalAmount,
            ordersSettled: settlement.orders.length,
            orderIds: JSON.stringify(settlement.orders.map(o => o.id)),
            balanceBeforeSettlement: userBalance.reservedBalance,
            balanceAfterSettlement: 0,
            notes: notes || null,
            settledBy: admin.id,
            settledAt: now,
            createdAt: now,
          }).returning();

          createdSettlements.push(settlementRecord);

          // Create order settlement records
          for (const order of settlement.orders) {
            await tx.insert(orderSettlements).values({
              jobId: order.id,
              settlementId: settlementRecord.id,
              freelancerAmount: order.assignedFreelancerId === userId ? order.freelancerEarnings || 0 : 0,
              managerAmount: order.managerId === userId ? order.managerEarnings || 0 : 0,
              isSettled: true,
              settledAt: now,
              createdAt: now,
            });

            // Update order to completed
            await tx.update(jobs)
              .set({
                status: 'completed',
                completedAt: now,
                updatedAt: now,
              })
              .where(eq(jobs.id, order.id));

            // Log status change
            await tx.insert(jobStatusLogs).values({
              jobId: order.id,
              oldStatus: 'paid',
              newStatus: 'completed',
              changedBy: admin.id,
              note: `Order settled and marked as completed. Settlement ID: ${settlementRecord.id}`,
              createdAt: now,
            });
          }

          // Clear reserved balance (funds paid externally)
          await tx.update(balances)
            .set({
              reservedBalance: 0,
              totalWithdrawn: sql`${balances.totalWithdrawn} + ${settlement.totalAmount}`,
              updatedAt: now,
            })
            .where(eq(balances.userId, userId));

          // Create notification
          await tx.insert(notifications).values({
            userId: userId,
            type: 'settlement_processed',
            title: 'Payment Settled',
            message: `Your payment of KSh ${settlement.totalAmount.toFixed(2)} for ${settlement.orders.length} order(s) has been processed and settled.`,
            read: false,
            createdAt: now,
          });

          // Get user info for CSV
          const [user] = await tx.select().from(users).where(eq(users.id, userId));
          if (user) {
            csvRows.push([
              user.id.toString(),
              user.name || 'N/A',
              user.email,
              settlement.userType,
              user.phone || 'N/A',
              user.phone || 'N/A',
              settlement.totalAmount.toFixed(2),
              settlement.orders.length.toString(),
              settlement.orders.map(o => o.orderNumber).join(';'),
              new Date(now).toLocaleDateString()
            ].join(','));
          }
        }
      });

      const csvData = generateCSV ? csvRows.join('\n') : null;

      return NextResponse.json({
        settlements: createdSettlements,
        ordersProcessed: orders.length,
        totalAmount: Array.from(userSettlements.values()).reduce((sum, s) => sum + s.totalAmount, 0),
        usersSettled: userSettlements.size,
        csv: csvData,
        message: `Successfully settled ${orders.length} orders for ${userSettlements.size} users`,
      });

    } catch (error) {
      throw error;
    }

  } catch (error: any) {
    console.error('Error settling invoices:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to settle invoices' 
    }, { status: 500 });
  }
}

/**
 * GET /api/v2/admin/invoices/settle
 * 
 * Get all settlement records (admin view)
 * 
 * Query params:
 * - userId?: number (filter by user)
 * - userType?: 'freelancer' | 'manager' (filter by type)
 * - startDate?: ISO string
 * - endDate?: ISO string
 * 
 * Response:
 * {
 *   settlements: [...array of settlement records with user details],
 *   totalAmount: number,
 *   totalOrders: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');

    let query = db.select().from(invoiceSettlements).$dynamic();

    if (userId) {
      query = query.where(eq(invoiceSettlements.userId, parseInt(userId)));
    }

    if (userType && (userType === 'freelancer' || userType === 'manager')) {
      query = query.where(eq(invoiceSettlements.userType, userType));
    }

    const settlements = await query;

    // Calculate totals
    const totalAmount = settlements.reduce((sum, s) => sum + s.settlementAmount, 0);
    const totalOrders = settlements.reduce((sum, s) => sum + s.ordersSettled, 0);

    return NextResponse.json({
      settlements: settlements,
      totalAmount: totalAmount,
      totalOrders: totalOrders,
      count: settlements.length,
    });

  } catch (error: any) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch settlements' 
    }, { status: 500 });
  }
}

