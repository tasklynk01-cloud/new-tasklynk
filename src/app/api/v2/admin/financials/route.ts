import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { withRetry } from '@/lib/db-retry';

export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    // Fetch all orders
    const allOrdersData = await withRetry(
      async () => {
        return await db
          .select({
            id: jobs.id,
            displayId: jobs.displayId,
            orderNumber: jobs.orderNumber,
            orderId: jobs.orderId,
            clientId: jobs.clientId,
            assignedFreelancerId: jobs.assignedFreelancerId,
            managerId: jobs.managerId,
            pages: jobs.pages,
            slides: jobs.slides,
            singleSpaced: jobs.singleSpaced,
            workType: jobs.workType,
            status: jobs.status,
            amount: jobs.amount,
            freelancerEarnings: jobs.freelancerEarnings,
            managerEarnings: jobs.managerEarnings,
            adminProfit: jobs.adminProfit,
            clientCpp: jobs.clientCpp,
            effectiveCpp: jobs.effectiveCpp,
            baseCpp: jobs.baseCpp,
            createdAt: jobs.createdAt,
          })
          .from(jobs)
          .orderBy(desc(jobs.createdAt));
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    // Get unique user IDs
    const clientIds = [...new Set(allOrdersData.map(o => o.clientId))];
    const freelancerIds = [...new Set(allOrdersData.map(o => o.assignedFreelancerId).filter(id => id !== null))] as number[];

    // Fetch user names in batch
    const allUserIds = [...new Set([...clientIds, ...freelancerIds])];
    const userMap = new Map<number, string>();
    
    if (allUserIds.length > 0) {
      const userList = await withRetry(
        async () => {
          return await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, allUserIds));
        },
        { maxRetries: 2, initialDelay: 300 }
      );
      
      userList.forEach(user => {
        userMap.set(user.id, user.name);
      });
    }

    // Format orders
    const formatOrder = (order: any) => {
      const clientName = userMap.get(order.clientId) || 'Unknown Client';
      const freelancerName = order.assignedFreelancerId 
        ? (userMap.get(order.assignedFreelancerId) || 'Unassigned')
        : 'Unassigned';
      
      // Calculate CPP - use effectiveCpp, clientCpp, or baseCpp
      const cpp = order.effectiveCpp || order.clientCpp || order.baseCpp || 0;
      
      // 🔴 CRITICAL FIX: Calculate total using actual CPP paid by client
      const pages = order.pages || 0;
      const slides = order.slides || 0;
      const pageMultiplier = order.singleSpaced ? 2 : 1;
      const effectivePages = pages * pageMultiplier;
      const actualClientTotal = (effectivePages * cpp) + (slides * 150);
      
      // Use actual calculated total, not jobs.amount which may be outdated
      const total = actualClientTotal > 0 ? actualClientTotal : (order.amount || 0);
      
      // 🔴 FIX: Recalculate freelancer earnings if stored value is 0 but order has pages/slides
      // Use Starter tier (150 non-tech / 170 tech) as estimate for unassigned orders
      let freelancerTotal = order.freelancerEarnings || 0;
      if (freelancerTotal === 0 && (pages > 0 || slides > 0)) {
        // Check if work type is technical
        const workTypeLower = (order.workType || '').toLowerCase();
        const isTechnical = ['excel', 'spss', 'stata', 'powerpoint', 'presentation', 'technical', 'coding', 'python', 'data analysis'].some(k => workTypeLower.includes(k));
        const writerCpp = isTechnical ? 170 : 150; // Starter tier
        const writerSlideRate = 100;
        freelancerTotal = (effectivePages * writerCpp) + (slides * writerSlideRate);
      }
      
      // 🔴 FIX: Recalculate manager earnings if stored value is 0 and freelancer is assigned
      let managerTotal = order.managerEarnings || 0;
      if (managerTotal === 0 && order.assignedFreelancerId) {
        // Estimate: assignment fee (10) + delivery fee (10 + 5 * extra pages)
        // For display purposes, use assignment fee only if not delivered yet
        const isDeliveredOrLater = ['delivered', 'approved', 'paid', 'completed'].includes(order.status);
        if (isDeliveredOrLater) {
          managerTotal = 10 + 10 + Math.max(0, (pages - 1) * 5); // Assignment + delivery
        } else {
          managerTotal = 10; // Assignment only
        }
      }
      
      const companyProfit = total - (freelancerTotal + managerTotal);
      
      return {
        id: order.id,
        orderId: order.displayId || order.orderNumber || order.orderId || `#${order.id}`,
        displayId: order.displayId || order.orderNumber || order.orderId,
        clientName,
        freelancerName,
        pages: order.pages || 0,
        slides: order.slides || 0,
        workType: order.workType,
        status: order.status,
        cpp: cpp,
        total: total,
        freelancerTotal: freelancerTotal,
        managerTotal: managerTotal,
        companyProfit: companyProfit,
        createdAt: order.createdAt,
      };
    };

    // Filter orders by status
    const allOrders = allOrdersData.map(formatOrder);
    const deliveredOrders = allOrdersData
      .filter(o => o.status === 'delivered')
      .map(formatOrder);
    const paidOrders = allOrdersData
      .filter(o => o.status === 'paid')
      .map(formatOrder);
    const completedOrders = allOrdersData
      .filter(o => o.status === 'completed')
      .map(formatOrder);

    // Calculate summaries
    const calculateSummary = (orders: any[]) => ({
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      totalFreelancerPayout: orders.reduce((sum, o) => sum + o.freelancerTotal, 0),
      totalManagerPayout: orders.reduce((sum, o) => sum + o.managerTotal, 0),
      totalCompanyProfit: orders.reduce((sum, o) => sum + o.companyProfit, 0),
    });

    return NextResponse.json({
      allOrders,
      deliveredOrders,
      paidOrders,
      completedOrders,
      allSummary: calculateSummary(allOrders),
      deliveredSummary: calculateSummary(deliveredOrders),
      paidSummary: calculateSummary(paidOrders),
      completedSummary: calculateSummary(completedOrders),
    });
  } catch (error) {
    console.error('GET admin financials error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}


