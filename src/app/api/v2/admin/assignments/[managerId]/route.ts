import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, managerFreelancers, managerClients } from '@/db/schema';
import { eq, inArray, and, or } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// Bulk assign freelancers and clients to a manager
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ managerId: string }> }
) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { managerId } = await params;
    const managerIdInt = parseInt(managerId);

    if (isNaN(managerIdInt)) {
      return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
    }

    // Verify manager exists
    const manager = await db.select()
      .from(users)
      .where(and(eq(users.id, managerIdInt), eq(users.role, 'manager')))
      .limit(1);

    if (manager.length === 0) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const body = await request.json();
    const { freelancerIds = [], clientIds = [] } = body;

    if (!Array.isArray(freelancerIds) || !Array.isArray(clientIds)) {
      return NextResponse.json(
        { error: 'freelancerIds and clientIds must be arrays' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const adminId = authResult.user?.id || null;

    // Handle freelancer assignments
    // First, deactivate all current assignments for this manager
    await db.update(managerFreelancers)
      .set({ status: 'inactive', updatedAt: now })
      .where(eq(managerFreelancers.managerId, managerIdInt));

    // Then create/reactivate the new assignments
    for (const freelancerId of freelancerIds) {
      const existing = await db.select()
        .from(managerFreelancers)
        .where(and(
          eq(managerFreelancers.managerId, managerIdInt),
          eq(managerFreelancers.freelancerId, freelancerId)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db.update(managerFreelancers)
          .set({ status: 'active', updatedAt: now })
          .where(eq(managerFreelancers.id, existing[0].id));
      } else {
        await db.insert(managerFreelancers).values({
          managerId: managerIdInt,
          freelancerId,
          assignedBy: adminId,
          status: 'active',
          assignedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Handle client assignments
    await db.update(managerClients)
      .set({ status: 'inactive', updatedAt: now })
      .where(eq(managerClients.managerId, managerIdInt));

    for (const clientId of clientIds) {
      const existing = await db.select()
        .from(managerClients)
        .where(and(
          eq(managerClients.managerId, managerIdInt),
          eq(managerClients.clientId, clientId)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db.update(managerClients)
          .set({ status: 'active', updatedAt: now })
          .where(eq(managerClients.id, existing[0].id));
      } else {
        await db.insert(managerClients).values({
          managerId: managerIdInt,
          clientId,
          assignedBy: adminId,
          status: 'active',
          assignedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Also update legacy assignedManagerId field for backward compatibility
    // Note: This sets to the most recent manager, but the junction tables allow many-to-many
    if (freelancerIds.length > 0) {
      await db.update(users)
        .set({ assignedManagerId: managerIdInt, updatedAt: now })
        .where(inArray(users.id, freelancerIds));
    }

    if (clientIds.length > 0) {
      await db.update(users)
        .set({ assignedManagerId: managerIdInt, updatedAt: now })
        .where(inArray(users.id, clientIds));
    }

    return NextResponse.json({
      success: true,
      message: 'Users assigned to manager successfully',
      assignedFreelancers: freelancerIds.length,
      assignedClients: clientIds.length,
    });

  } catch (error) {
    console.error('Bulk assign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get all assignments for a specific manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ managerId: string }> }
) {
  try {
    const authResult = await requireRole(request, ['admin', 'manager']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { managerId } = await params;
    const managerIdInt = parseInt(managerId);

    if (isNaN(managerIdInt)) {
      return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
    }

    // Fetch freelancer assignments
    const freelancerAssignments = await db.select({
      id: managerFreelancers.id,
      freelancerId: managerFreelancers.freelancerId,
      assignedAt: managerFreelancers.assignedAt,
    })
    .from(managerFreelancers)
    .where(and(
      eq(managerFreelancers.managerId, managerIdInt),
      eq(managerFreelancers.status, 'active')
    ));

    // Fetch client assignments
    const clientAssignments = await db.select({
      id: managerClients.id,
      clientId: managerClients.clientId,
      assignedAt: managerClients.assignedAt,
    })
    .from(managerClients)
    .where(and(
      eq(managerClients.managerId, managerIdInt),
      eq(managerClients.status, 'active')
    ));

    // Get freelancer details
    const freelancerIds = freelancerAssignments.map(a => a.freelancerId);
    const freelancers = freelancerIds.length > 0
      ? await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          displayId: users.displayId,
          balance: users.balance,
          completedJobs: users.completedJobs,
          status: users.status,
        })
        .from(users)
        .where(inArray(users.id, freelancerIds))
      : [];

    // Get client details
    const clientIds = clientAssignments.map(a => a.clientId);
    const clients = clientIds.length > 0
      ? await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          displayId: users.displayId,
          role: users.role,
          status: users.status,
        })
        .from(users)
        .where(inArray(users.id, clientIds))
      : [];

    return NextResponse.json({
      managerId: managerIdInt,
      freelancers: freelancers.map(f => {
        const assignment = freelancerAssignments.find(a => a.freelancerId === f.id);
        return { ...f, assignedAt: assignment?.assignedAt };
      }),
      clients: clients.map(c => {
        const assignment = clientAssignments.find(a => a.clientId === c.id);
        return { ...c, assignedAt: assignment?.assignedAt };
      }),
      totalFreelancers: freelancers.length,
      totalClients: clients.length,
    });

  } catch (error) {
    console.error('GET manager assignments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
