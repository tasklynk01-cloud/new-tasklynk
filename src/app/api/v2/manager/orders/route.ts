import { NextRequest } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { createErrorResponse, createSuccessResponse, handleDatabaseError, handleOptions } from '@/lib/api-helpers';
import { logApiError } from '@/lib/error-logger';

const VALID_STATUSES = [
  'pending',
  'accepted',
  'approved',
  'in_progress',
  'editing',
  'delivered',
  'revision',
  'completed',
  'cancelled',
  'on_hold',
  'paid',
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(request, ['manager', 'admin']);
  if (authCheck.error) {
    return createErrorResponse(authCheck.error, 'UNAUTHORIZED', authCheck.status || 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitParam = parseInt(searchParams.get('limit') ?? '50', 10);
    const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
    const managerIdParam = searchParams.get('managerId');

    if (status && !VALID_STATUSES.includes(status as ValidStatus)) {
      return createErrorResponse('Invalid status filter', 'INVALID_STATUS', 400);
    }

    const limit = Math.min(Math.max(limitParam || 50, 1), 100);
    const page = Math.max(pageParam || 1, 1);
    const offset = (page - 1) * limit;

    const parsedManagerId = managerIdParam ? Number.parseInt(managerIdParam, 10) : null;
    if (managerIdParam && Number.isNaN(parsedManagerId)) {
      return createErrorResponse('managerId must be a valid number', 'INVALID_MANAGER_ID', 400);
    }

    const isAdminRequest = authCheck.user?.role === 'admin';
    const isManagerRequest = authCheck.user?.role === 'manager';
    const effectiveManagerId = isManagerRequest
      ? authCheck.user!.id
      : parsedManagerId;

    const filters: any[] = [];

    if (isManagerRequest) {
      filters.push(eq(jobs.managerId, authCheck.user!.id));
    } else if (isAdminRequest && effectiveManagerId !== null && !Number.isNaN(effectiveManagerId)) {
      filters.push(eq(jobs.managerId, effectiveManagerId));
    }

    if (status) {
      filters.push(eq(jobs.status, status as ValidStatus));
    }

    const jobRows = await db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        orderNumber: jobs.orderNumber,
        clientId: jobs.clientId,
        assignedFreelancerId: jobs.assignedFreelancerId,
        managerId: jobs.managerId,
        title: jobs.title,
        instructions: jobs.instructions,
        workType: jobs.workType,
        pages: jobs.pages,
        slides: jobs.slides,
        amount: jobs.amount,
        managerEarnings: jobs.managerEarnings,
        freelancerEarnings: jobs.freelancerEarnings,
        adminProfit: jobs.adminProfit,
        deadline: jobs.deadline,
        actualDeadline: jobs.actualDeadline,
        freelancerDeadline: jobs.freelancerDeadline,
        status: jobs.status,
        paymentConfirmed: jobs.paymentConfirmed,
        revisionRequested: jobs.revisionRequested,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(
        filters.length === 0
          ? undefined
          : filters.length === 1
            ? filters[0]
            : and(...filters)
      )
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    const clientIds = Array.from(new Set(jobRows.map((row) => row.clientId).filter(Boolean)));
    const writerIds = Array.from(
      new Set(jobRows.map((row) => row.assignedFreelancerId).filter((id): id is number => Boolean(id)))
    );

    const clients = clientIds.length
      ? await db
          .select({
            id: users.id,
            displayId: users.displayId,
            name: users.name,
            phone: users.phone,
            email: users.email,
          })
          .from(users)
          .where(inArray(users.id, clientIds))
      : [];

    const writers = writerIds.length
      ? await db
          .select({
            id: users.id,
            displayId: users.displayId,
            name: users.name,
            phone: users.phone,
            email: users.email,
          })
          .from(users)
          .where(inArray(users.id, writerIds))
      : [];

    const clientMap = new Map(clients.map((client) => [client.id, client]));
    const writerMap = new Map(writers.map((writer) => [writer.id, writer]));

    const formatted = jobRows.map((job) => ({
      ...job,
      client: clientMap.get(job.clientId) || null,
      writer: job.assignedFreelancerId ? writerMap.get(job.assignedFreelancerId) || null : null,
    }));

    return createSuccessResponse({
      orders: formatted,
      pagination: {
        page,
        limit,
        count: formatted.length,
        hasMore: formatted.length === limit,
      },
    });
  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

export async function OPTIONS() {
  return handleOptions();
}

