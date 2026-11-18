import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { withRetry } from '@/lib/db-retry';
import { getManagerScopedJobIds } from '@/lib/manager-job-scope';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');

    if (!managerId || isNaN(parseInt(managerId))) {
      return NextResponse.json(
        { error: 'Valid managerId is required' },
        { status: 400 }
      );
    }

    const managerIdInt = parseInt(managerId);

    // Verify manager exists
    const [manager] = await withRetry(
      async () => {
        return await db.select().from(users).where(eq(users.id, managerIdInt)).limit(1);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    if (!manager || manager.role !== 'manager') {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    const managerJobIds = await getManagerScopedJobIds(managerIdInt);
    const billableStatuses = ['approved', 'paid', 'completed'] as const;

    // Fetch billable orders assigned to this manager
    const approvedOrders = await withRetry(
      async () => {
        if (managerJobIds.length === 0) {
          return [];
        }

        return await db
          .select({
            id: jobs.id,
            displayId: jobs.displayId,
            orderNumber: jobs.orderNumber,
            orderId: jobs.orderId,
            clientId: jobs.clientId,
            managerId: jobs.managerId,
            assignedFreelancerId: jobs.assignedFreelancerId,
            freelancerEarnings: jobs.freelancerEarnings,
            managerEarnings: jobs.managerEarnings,
            approvedAt: jobs.approvedAt,
            paidAt: jobs.paidAt,
            completedAt: jobs.completedAt,
            createdAt: jobs.createdAt,
            title: jobs.title,
          })
          .from(jobs)
          .where(
            and(
              inArray(jobs.id, managerJobIds),
              inArray(jobs.status, billableStatuses)
            )
          )
          .orderBy(desc(jobs.updatedAt));
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    // Get unique user IDs for fetching names
    const clientIds = [...new Set(approvedOrders.map(o => o.clientId))];
    const managerIds = [...new Set(approvedOrders.map(o => o.managerId).filter(id => id !== null))] as number[];
    const freelancerIds = [...new Set(approvedOrders.map(o => o.assignedFreelancerId).filter(id => id !== null))] as number[];

    // Fetch all user names in batch
    const allUserIds = [...new Set([...clientIds, ...managerIds, ...freelancerIds])];
    
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

    const clientMap = new Map<number, string>();
    clientIds.forEach(id => {
      if (userMap.has(id)) {
        clientMap.set(id, userMap.get(id)!);
      }
    });

    const managerMap = new Map<number, string>();
    managerIds.forEach(id => {
      if (userMap.has(id)) {
        managerMap.set(id, userMap.get(id)!);
      }
    });

    const freelancerMap = new Map<number, string>();
    freelancerIds.forEach(id => {
      if (userMap.has(id)) {
        freelancerMap.set(id, userMap.get(id)!);
      }
    });

    // Format response
    const formattedOrders = approvedOrders.map(order => ({
      orderId: order.displayId || order.orderNumber || order.orderId || `#${order.id}`,
      client: clientMap.get(order.clientId) || 'Unknown Client',
      manager: order.managerId ? (managerMap.get(order.managerId) || manager.name) : manager.name,
      freelancer: order.assignedFreelancerId ? (freelancerMap.get(order.assignedFreelancerId) || 'Unassigned') : 'Unassigned',
      earnings: order.managerEarnings || 0,
      date: order.completedAt || order.paidAt || order.approvedAt || order.createdAt,
      title: order.title,
    }));

    return NextResponse.json({ orders: formattedOrders }, { status: 200 });
  } catch (error) {
    console.error('GET manager invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}


