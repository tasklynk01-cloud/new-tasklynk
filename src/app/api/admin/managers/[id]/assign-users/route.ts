import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, managerClients, managerFreelancers } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const managerId = parseInt(id);
    if (isNaN(managerId)) {
      return NextResponse.json(
        { error: 'Invalid manager ID' },
        { status: 400 }
      );
    }

    // Verify manager exists and is a manager
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);

    if (manager.length === 0 || manager[0].role !== 'manager') {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { clientIds = [], writerIds = [], adminId } = body;

    // Validate input
    if (!Array.isArray(clientIds) || !Array.isArray(writerIds)) {
      return NextResponse.json(
        { error: 'clientIds and writerIds must be arrays' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Remove all previous assignments for this manager (from many-to-many tables)
    await db.delete(managerClients)
      .where(eq(managerClients.managerId, managerId));
    
    await db.delete(managerFreelancers)
      .where(eq(managerFreelancers.managerId, managerId));

    // Assign selected clients to this manager (many-to-many)
    let assignedClientsCount = 0;
    if (clientIds.length > 0) {
      const clientAssignments = clientIds.map((clientId: number) => ({
        managerId,
        clientId,
        assignedBy: adminId || null,
        status: 'active',
        assignedAt: now,
        createdAt: now,
        updatedAt: now,
      }));
      
      await db.insert(managerClients).values(clientAssignments);
      assignedClientsCount = clientIds.length;
    }

    // Assign selected writers to this manager (many-to-many)
    let assignedWritersCount = 0;
    if (writerIds.length > 0) {
      const writerAssignments = writerIds.map((writerId: number) => ({
        managerId,
        freelancerId: writerId,
        assignedBy: adminId || null,
        status: 'active',
        assignedAt: now,
        createdAt: now,
        updatedAt: now,
      }));
      
      await db.insert(managerFreelancers).values(writerAssignments);
      assignedWritersCount = writerIds.length;
    }

    return NextResponse.json({
      success: true,
      assignedClients: assignedClientsCount,
      assignedWriters: assignedWritersCount,
      message: `Assigned ${assignedClientsCount} client(s) and ${assignedWritersCount} writer(s) to manager`
    }, { status: 200 });

  } catch (error) {
    console.error('Assign users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
