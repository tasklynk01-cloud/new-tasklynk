import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, inArray, or, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // 🔒 AUTH: Require manager/admin (prevents leaking dashboard data by guessing managerId)
    const authCheck = await requireRole(request, ['manager', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');

    // Managers may ONLY fetch their own dashboard.
    // Admins may fetch a specific manager dashboard via managerId.
    const managerIdFromSession = authCheck.user?.role === 'manager' ? String(authCheck.user.id) : null;
    const effectiveManagerId = managerIdFromSession ?? managerId;

    // Validate managerId parameter
    if (!effectiveManagerId) {
      return NextResponse.json(
        { 
          error: 'Manager ID is required',
          code: 'MISSING_MANAGER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate managerId is a valid integer
    const managerIdInt = parseInt(effectiveManagerId);
    if (isNaN(managerIdInt)) {
      return NextResponse.json(
        { 
          error: 'Manager ID must be a valid integer',
          code: 'INVALID_MANAGER_ID' 
        },
        { status: 400 }
      );
    }

    // Query user by managerId and verify role === 'manager'
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerIdInt))
      .limit(1);

    if (manager.length === 0) {
      return NextResponse.json(
        { 
          error: 'Manager not found',
          code: 'MANAGER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    if (manager[0].role !== 'manager') {
      return NextResponse.json(
        { 
          error: 'User is not a manager',
          code: 'FORBIDDEN_NOT_MANAGER' 
        },
        { status: 403 }
      );
    }

    // Get assigned clients (both client and account_owner roles)
    const assignedClients = await db.select()
      .from(users)
      .where(
        and(
          eq(users.assignedManagerId, managerIdInt),
          or(
            eq(users.role, 'client'),
            eq(users.role, 'account_owner')
          )
        )
      )
      .orderBy(desc(users.createdAt));

    const clientIds = assignedClients.map(client => client.id);

    // Get assigned writers
    const assignedWriters = await db.select()
      .from(users)
      .where(
        and(
          eq(users.assignedManagerId, managerIdInt),
          eq(users.role, 'freelancer')
        )
      )
      .orderBy(desc(users.createdAt));

    const writerIds = assignedWriters.map(writer => writer.id);

    // Initialize empty orders array and stats
    let assignedOrders: any[] = [];
    const stats = {
      totalClients: assignedClients.length,
      totalWriters: assignedWriters.length,
      totalOrders: 0,
      pendingOrders: 0,
      acceptedOrders: 0,
      inProgressOrders: 0,
      editingOrders: 0,
      deliveredOrders: 0,
      approvedOrders: 0,
      paidOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      onHoldOrders: 0,
      revisionOrders: 0
    };

    // 🔴 FIX: Query orders by manager_id (primary) + fallback to assigned clients/writers
    // Get orders directly assigned to this manager
    const managerOrders = await db.select()
      .from(jobs)
      .where(eq(jobs.managerId, managerIdInt))
      .orderBy(desc(jobs.createdAt));

    assignedOrders = managerOrders;

    // 🔄 FALLBACK: If manager has no direct orders but has assigned users, show their orders too
    if (assignedOrders.length === 0 && (clientIds.length > 0 || writerIds.length > 0)) {
      let ordersQuery;

      if (clientIds.length > 0 && writerIds.length > 0) {
        ordersQuery = await db.select()
          .from(jobs)
          .where(
            or(
              inArray(jobs.clientId, clientIds),
              inArray(jobs.assignedFreelancerId, writerIds)
            )
          )
          .orderBy(desc(jobs.createdAt));
      } else if (clientIds.length > 0) {
        ordersQuery = await db.select()
          .from(jobs)
          .where(inArray(jobs.clientId, clientIds))
          .orderBy(desc(jobs.createdAt));
      } else {
        ordersQuery = await db.select()
          .from(jobs)
          .where(inArray(jobs.assignedFreelancerId, writerIds))
          .orderBy(desc(jobs.createdAt));
      }

      assignedOrders = ordersQuery;
    }

    // Calculate stats from orders
    stats.totalOrders = assignedOrders.length;
    
    assignedOrders.forEach(order => {
      if (order.status === 'pending') stats.pendingOrders++;
      if (order.status === 'accepted') stats.acceptedOrders++;
      if (order.status === 'in_progress') stats.inProgressOrders++;
      if (order.status === 'editing') stats.editingOrders++;
      if (order.status === 'delivered') stats.deliveredOrders++;
      if (order.status === 'approved') stats.approvedOrders++;
      if (order.status === 'paid') stats.paidOrders++;
      if (order.status === 'completed') stats.completedOrders++;
      if (order.status === 'cancelled') stats.cancelledOrders++;
      if (order.status === 'on_hold') stats.onHoldOrders++;
      if (order.status === 'revision' || order.revisionRequested) stats.revisionOrders++;
    });

    // Get all unique client and writer IDs from orders
    const orderClientIds = [...new Set(assignedOrders.map(o => o.clientId).filter(id => id !== null))];
    const orderWriterIds = [...new Set(assignedOrders.map(o => o.assignedFreelancerId).filter(id => id !== null))];

    // Fetch client users for orders (if not already in assignedClients)
    let allClientUsers: any[] = [];
    if (orderClientIds.length > 0) {
      allClientUsers = await db.select({
        id: users.id,
        displayId: users.displayId,
        name: users.name
      })
      .from(users)
      .where(inArray(users.id, orderClientIds));
    }

    // Fetch writer users for orders (if not already in assignedWriters)
    let allWriterUsers: any[] = [];
    if (orderWriterIds.length > 0) {
      allWriterUsers = await db.select({
        id: users.id,
        displayId: users.displayId,
        name: users.name
      })
      .from(users)
      .where(inArray(users.id, orderWriterIds));
    }

    // Create lookup maps
    const clientMap = new Map(allClientUsers.map(c => [c.id, c]));
    const writerMap = new Map(allWriterUsers.map(w => [w.id, w]));

    // Format orders with client and writer info
    const formattedOrders = assignedOrders.map(order => {
      const client = order.clientId ? clientMap.get(order.clientId) : null;
      const writer = order.assignedFreelancerId ? writerMap.get(order.assignedFreelancerId) : null;

      return {
        id: order.id,
        displayId: order.displayId,
        orderNumber: order.orderNumber,
        title: order.title,
        workType: order.workType,
        pages: order.pages,
        slides: order.slides,
        amount: order.amount,
        status: order.status,
        deadline: order.deadline,
        actualDeadline: order.actualDeadline,
        createdAt: order.createdAt,
        client: client ? { id: client.id, displayId: client.displayId, name: client.name } : null,
        writer: writer ? { id: writer.id, displayId: writer.displayId, name: writer.name } : null
      };
    });

    // Remove password from manager object
    const { password, ...managerWithoutPassword } = manager[0];

    // Remove passwords from clients and writers
    const clientsWithoutPasswords = assignedClients.map(({ password, ...client }) => client);
    const writersWithoutPasswords = assignedWriters.map(({ password, ...writer }) => writer);

    return NextResponse.json({
      manager: managerWithoutPassword,
      stats,
      clients: clientsWithoutPasswords,
      writers: writersWithoutPasswords,
      orders: formattedOrders
    }, { status: 200 });

  } catch (error) {
    console.error('GET manager dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

