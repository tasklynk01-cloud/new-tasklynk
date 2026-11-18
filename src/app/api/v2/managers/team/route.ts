import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, managerFreelancers, managerClients } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// GET - Fetch manager's assigned team (freelancers and clients)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['manager', 'admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');

    // For managers, use their own ID. For admins, they can specify any manager
    const targetManagerId = authResult.user!.role === 'admin' && managerId
      ? parseInt(managerId)
      : authResult.user!.id;

    if (isNaN(targetManagerId)) {
      return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
    }

    // Verify this is a manager
    const managerRecord = await db.select()
      .from(users)
      .where(and(eq(users.id, targetManagerId), eq(users.role, 'manager')))
      .limit(1);

    if (managerRecord.length === 0) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Get assigned freelancers from many-to-many table
    const freelancerAssignments = await db.select({
      id: managerFreelancers.id,
      freelancerId: managerFreelancers.freelancerId,
      assignedAt: managerFreelancers.assignedAt,
    })
    .from(managerFreelancers)
    .where(and(
      eq(managerFreelancers.managerId, targetManagerId),
      eq(managerFreelancers.status, 'active')
    ));

    // Also get from legacy field for backward compatibility
    const legacyFreelancers = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.assignedManagerId, targetManagerId),
        eq(users.role, 'freelancer')
      ));

    // Combine and deduplicate
    const freelancerIds = [...new Set([
      ...freelancerAssignments.map(a => a.freelancerId),
      ...legacyFreelancers.map(f => f.id)
    ])];

    // Get freelancer details
    const freelancers = freelancerIds.length > 0
      ? await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          displayId: users.displayId,
          balance: users.balance,
          completedJobs: users.completedJobs,
          status: users.status,
          presenceStatus: users.presenceStatus,
          rating: users.rating,
          ratingAverage: users.ratingAverage,
        })
        .from(users)
        .where(inArray(users.id, freelancerIds))
      : [];

    // Get assigned clients from many-to-many table
    const clientAssignments = await db.select({
      id: managerClients.id,
      clientId: managerClients.clientId,
      assignedAt: managerClients.assignedAt,
    })
    .from(managerClients)
    .where(and(
      eq(managerClients.managerId, targetManagerId),
      eq(managerClients.status, 'active')
    ));

    // Also get from legacy field
    const legacyClients = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.assignedManagerId, targetManagerId),
        eq(users.role, 'client')
      ));

    const legacyAccountOwners = await db.select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.assignedManagerId, targetManagerId),
        eq(users.role, 'account_owner')
      ));

    // Combine and deduplicate
    const clientIds = [...new Set([
      ...clientAssignments.map(a => a.clientId),
      ...legacyClients.map(c => c.id),
      ...legacyAccountOwners.map(c => c.id)
    ])];

    // Get client details
    const clients = clientIds.length > 0
      ? await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          displayId: users.displayId,
          role: users.role,
          status: users.status,
          totalSpent: users.totalSpent,
          presenceStatus: users.presenceStatus,
        })
        .from(users)
        .where(inArray(users.id, clientIds))
      : [];

    // Enrich with assignment dates
    const freelancersWithDates = freelancers.map(f => {
      const assignment = freelancerAssignments.find(a => a.freelancerId === f.id);
      return {
        ...f,
        assignedAt: assignment?.assignedAt || null,
      };
    });

    const clientsWithDates = clients.map(c => {
      const assignment = clientAssignments.find(a => a.clientId === c.id);
      return {
        ...c,
        assignedAt: assignment?.assignedAt || null,
      };
    });

    return NextResponse.json({
      manager: {
        id: managerRecord[0].id,
        name: managerRecord[0].name,
        email: managerRecord[0].email,
        displayId: managerRecord[0].displayId,
      },
      freelancers: freelancersWithDates,
      clients: clientsWithDates,
      summary: {
        totalFreelancers: freelancers.length,
        totalClients: clients.length,
        onlineFreelancers: freelancers.filter(f => f.presenceStatus === 'online').length,
        onlineClients: clients.filter(c => c.presenceStatus === 'online').length,
      }
    });

  } catch (error) {
    console.error('GET manager team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

