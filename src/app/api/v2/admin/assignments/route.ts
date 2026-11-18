import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, managerFreelancers, managerClients } from '@/db/schema';
import { eq, and, or, inArray, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';

// GET - Fetch all assignments (who is assigned to which manager)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return createErrorResponse(authResult.error, 'UNAUTHORIZED', authResult.status || 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');
    const type = searchParams.get('type'); // 'freelancers', 'clients', or 'all'

    // Fetch all managers
    const allManagers = await withRetry(
      async () => {
        return await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          displayId: users.displayId,
        })
        .from(users)
        .where(and(eq(users.role, 'manager'), eq(users.approved, true)))
        .orderBy(users.name);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    // Fetch manager-freelancer assignments
    const freelancerAssignments = await withRetry(
      async () => {
        return await db.select({
          id: managerFreelancers.id,
          managerId: managerFreelancers.managerId,
          freelancerId: managerFreelancers.freelancerId,
          status: managerFreelancers.status,
          assignedAt: managerFreelancers.assignedAt,
        })
        .from(managerFreelancers)
        .where(eq(managerFreelancers.status, 'active'));
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    // Fetch manager-client assignments
    const clientAssignments = await withRetry(
      async () => {
        return await db.select({
          id: managerClients.id,
          managerId: managerClients.managerId,
          clientId: managerClients.clientId,
          status: managerClients.status,
          assignedAt: managerClients.assignedAt,
        })
        .from(managerClients)
        .where(eq(managerClients.status, 'active'));
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    // Get all freelancer IDs and client IDs from assignments
    const freelancerIds = [...new Set(freelancerAssignments.map(a => a.freelancerId))];
    const clientIds = [...new Set(clientAssignments.map(a => a.clientId))];

    // Fetch freelancer details
    const freelancers = freelancerIds.length > 0 
      ? await withRetry(
          async () => {
            return await db.select({
              id: users.id,
              name: users.name,
              email: users.email,
              displayId: users.displayId,
              balance: users.balance,
              completedJobs: users.completedJobs,
            })
            .from(users)
            .where(inArray(users.id, freelancerIds));
          },
          { maxRetries: 3, initialDelay: 500 }
        )
      : [];

    // Fetch client details
    const clients = clientIds.length > 0 
      ? await withRetry(
          async () => {
            return await db.select({
              id: users.id,
              name: users.name,
              email: users.email,
              displayId: users.displayId,
              role: users.role,
            })
            .from(users)
            .where(inArray(users.id, clientIds));
          },
          { maxRetries: 3, initialDelay: 500 }
        )
      : [];

    // Build the response structure
    const freelancerMap = new Map(freelancers.map(f => [f.id, f]));
    const clientMap = new Map(clients.map(c => [c.id, c]));

    // Group assignments by manager
    const managerAssignments = allManagers.map(manager => {
      const managerFreelancerAssigns = freelancerAssignments
        .filter(a => a.managerId === manager.id)
        .map(a => ({
          assignmentId: a.id,
          freelancer: freelancerMap.get(a.freelancerId),
          assignedAt: a.assignedAt,
        }))
        .filter(a => a.freelancer);

      const managerClientAssigns = clientAssignments
        .filter(a => a.managerId === manager.id)
        .map(a => ({
          assignmentId: a.id,
          client: clientMap.get(a.clientId),
          assignedAt: a.assignedAt,
        }))
        .filter(a => a.client);

      return {
        manager,
        freelancers: managerFreelancerAssigns,
        clients: managerClientAssigns,
        totalFreelancers: managerFreelancerAssigns.length,
        totalClients: managerClientAssigns.length,
      };
    });

    // If filtering by manager
    if (managerId) {
      const managerIdInt = parseInt(managerId);
      const filtered = managerAssignments.find(m => m.manager.id === managerIdInt);
      return createSuccessResponse(filtered || null);
    }

    return createSuccessResponse({
      managers: managerAssignments,
      summary: {
        totalManagers: allManagers.length,
        totalFreelancerAssignments: freelancerAssignments.length,
        totalClientAssignments: clientAssignments.length,
      }
    });

  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

// POST - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return createErrorResponse(authResult.error, 'UNAUTHORIZED', authResult.status || 401);
    }

    const body = await request.json();
    const { managerId, userId, userType } = body; // userType: 'freelancer' or 'client'

    if (!managerId || !userId || !userType) {
      return createErrorResponse('managerId, userId, and userType are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    if (!['freelancer', 'client'].includes(userType)) {
      return createErrorResponse('userType must be "freelancer" or "client"', 'INVALID_USER_TYPE', 400);
    }

    const now = new Date().toISOString();

    if (userType === 'freelancer') {
      // 🔴 ENFORCE LIMIT: Check if freelancer already has 10 managers (max limit)
      const existingFreelancerAssignments = await withRetry(
        async () => {
          return await db.select()
            .from(managerFreelancers)
            .where(and(
              eq(managerFreelancers.freelancerId, userId),
              eq(managerFreelancers.status, 'active')
            ));
        },
        { maxRetries: 3, initialDelay: 500 }
      );

      // Check if this specific assignment already exists
      const existing = existingFreelancerAssignments.find(
        a => a.managerId === managerId
      );

      if (existing) {
        // Update status to active if it was inactive
        if (existing.status !== 'active') {
          await withRetry(
            async () => {
              return await db.update(managerFreelancers)
                .set({ status: 'active', updatedAt: now })
                .where(eq(managerFreelancers.id, existing.id));
            },
            { maxRetries: 2, initialDelay: 300 }
          );
        }
        return createSuccessResponse({ message: 'Assignment already exists', id: existing.id });
      }

      // Enforce limit: one freelancer can be assigned to max 10 managers
      if (existingFreelancerAssignments.length >= 10) {
        return createErrorResponse(
          'Freelancer is already assigned to the maximum of 10 managers. Please remove an existing assignment first.',
          'MAX_ASSIGNMENTS_REACHED',
          400
        );
      }

      // Create new assignment
      const result = await withRetry(
        async () => {
          return await db.insert(managerFreelancers).values({
            managerId,
            freelancerId: userId,
            assignedBy: authResult.user?.id || null,
            status: 'active',
            assignedAt: now,
            createdAt: now,
            updatedAt: now,
          }).returning({ id: managerFreelancers.id });
        },
        { maxRetries: 3, initialDelay: 500 }
      );

      return createSuccessResponse({
        success: true,
        message: 'Freelancer assigned to manager successfully',
        id: result[0].id
      }, 201);

    } else {
      // Client assignment
      // 🔴 ENFORCE LIMIT: Check if client already has 8 managers (max limit)
      const existingClientAssignments = await withRetry(
        async () => {
          return await db.select()
            .from(managerClients)
            .where(and(
              eq(managerClients.clientId, userId),
              eq(managerClients.status, 'active')
            ));
        },
        { maxRetries: 3, initialDelay: 500 }
      );

      // Check if this specific assignment already exists
      const existing = existingClientAssignments.find(
        a => a.managerId === managerId
      );

      if (existing) {
        if (existing.status !== 'active') {
          await withRetry(
            async () => {
              return await db.update(managerClients)
                .set({ status: 'active', updatedAt: now })
                .where(eq(managerClients.id, existing.id));
            },
            { maxRetries: 2, initialDelay: 300 }
          );
        }
        return createSuccessResponse({ message: 'Assignment already exists', id: existing.id });
      }

      // Enforce limit: one client can be assigned to max 8 managers
      if (existingClientAssignments.length >= 8) {
        return createErrorResponse(
          'Client is already assigned to the maximum of 8 managers. Please remove an existing assignment first.',
          'MAX_ASSIGNMENTS_REACHED',
          400
        );
      }

      const result = await withRetry(
        async () => {
          return await db.insert(managerClients).values({
            managerId,
            clientId: userId,
            assignedBy: authResult.user?.id || null,
            status: 'active',
            assignedAt: now,
            createdAt: now,
            updatedAt: now,
          }).returning({ id: managerClients.id });
        },
        { maxRetries: 3, initialDelay: 500 }
      );

      return createSuccessResponse({
        success: true,
        message: 'Client assigned to manager successfully',
        id: result[0].id
      }, 201);
    }

  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

// DELETE - Remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult.error) {
      return createErrorResponse(authResult.error, 'UNAUTHORIZED', authResult.status || 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const assignmentId = searchParams.get('assignmentId');
    const userType = searchParams.get('userType'); // 'freelancer' or 'client'

    if (!assignmentId || !userType) {
      return createErrorResponse('assignmentId and userType are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    const now = new Date().toISOString();

    if (userType === 'freelancer') {
      await withRetry(
        async () => {
          return await db.update(managerFreelancers)
            .set({ status: 'inactive', updatedAt: now })
            .where(eq(managerFreelancers.id, parseInt(assignmentId)));
        },
        { maxRetries: 3, initialDelay: 500 }
      );
    } else {
      await withRetry(
        async () => {
          return await db.update(managerClients)
            .set({ status: 'inactive', updatedAt: now })
            .where(eq(managerClients.id, parseInt(assignmentId)));
        },
        { maxRetries: 3, initialDelay: 500 }
      );
    }

    return createSuccessResponse({ success: true, message: 'Assignment removed' });

  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

