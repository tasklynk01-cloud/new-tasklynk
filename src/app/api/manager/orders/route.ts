import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, inArray, desc, and, or, isNull } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Require manager or admin role
  const authCheck = await requireRole(request, ['manager', 'admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const managerIdParam = searchParams.get('managerId');
    const statusFilter = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const formatParam = searchParams.get('format');

    let managerIdInt: number | null = null;
    if (managerIdParam !== null) {
      managerIdInt = parseInt(managerIdParam, 10);
      if (Number.isNaN(managerIdInt)) {
        return NextResponse.json(
          {
            error: 'Valid managerId is required',
            code: 'INVALID_MANAGER_ID',
          },
          { status: 400 }
        );
      }
    } else if (authCheck.user?.role === 'manager' && authCheck.user?.id) {
      managerIdInt = Number(authCheck.user.id);
    }

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { 
          error: 'Valid page number is required (minimum 1)',
          code: 'INVALID_PAGE' 
        },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { 
          error: 'Valid limit is required (minimum 1, maximum 100)',
          code: 'INVALID_LIMIT' 
        },
        { status: 400 }
      );
    }

    // Validate status filter if provided
    if (statusFilter) {
      const validStatuses = [
        'pending',
        'accepted',
        'approved',
        'in_progress',
        'submitted',
        'editing',
        'delivered',
        'revision',
        'on_hold',
        'paid',
        'completed',
        'cancelled',
      ];
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          {
            error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
    }

    // Query user by managerId and verify role === 'manager'
    let fallbackClientIds: number[] = [];
    let fallbackWriterIds: number[] = [];

    if (managerIdInt !== null) {
      const manager = await db
        .select()
        .from(users)
        .where(eq(users.id, managerIdInt))
        .limit(1);

      if (manager.length === 0) {
        return NextResponse.json(
          {
            error: 'Manager not found',
            code: 'MANAGER_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      if (String(manager[0].role).toLowerCase() !== 'manager') {
        return NextResponse.json(
          {
            error: 'User is not a manager',
            code: 'FORBIDDEN_NOT_MANAGER',
          },
          { status: 403 }
        );
      }

      // 🔄 Collect fallback relationships: clients and writers assigned to this manager
      const assignedClients = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.assignedManagerId, managerIdInt),
            or(eq(users.role, 'client'), eq(users.role, 'account_owner'))
          )
        );

      const assignedWriters = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.assignedManagerId, managerIdInt),
            eq(users.role, 'freelancer')
          )
        );

      fallbackClientIds = assignedClients.map((client) => client.id);
      fallbackWriterIds = assignedWriters.map((writer) => writer.id);
    }

    const isAdminRequest = authCheck.user?.role === 'admin';
    const isManagerRequest = authCheck.user?.role === 'manager';

    // Build where conditions - MANAGERS CAN SEE ALL ORDERS (no client/writer restrictions)
    const whereConditions: any[] = [];

    // ✅ OPEN ACCESS: Managers can see ALL orders regardless of client/writer assignment
    // This allows managers to help with any order on the platform
    // No filtering by managerId, clientId, or assignedFreelancerId

    // Add status filter if provided
    if (statusFilter) {
      whereConditions.push(eq(jobs.status, statusFilter));
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get jobs with proper authorization filtering
    let jobsQuery: any[] = [];
    try {
      const whereClause = whereConditions.length === 0
        ? undefined
        : whereConditions.length === 1
          ? whereConditions[0]
          : and(...whereConditions);

      let query = db.select().from(jobs).$dynamic();
      if (whereClause) {
        query = query.where(whereClause);
      }

      query = query.orderBy(desc(jobs.createdAt)).limit(limit).offset(offset);

      jobsQuery = await query;
    } catch (error) {
      console.error(`[Manager Orders API] Error querying jobs:`, error);
      throw error;
    }

    // Get all unique client and writer IDs from the jobs
    const jobClientIds = [...new Set(jobsQuery.map(job => job.clientId))];
    const jobWriterIds = [...new Set(jobsQuery.map(job => job.assignedFreelancerId).filter(id => id !== null))];

    // Fetch client users with phone numbers
    const clientUsers = jobClientIds.length > 0
      ? await db.select({
          id: users.id,
          displayId: users.displayId,
          name: users.name,
          phone: users.phone
        })
        .from(users)
        .where(inArray(users.id, jobClientIds))
      : [];

    // Fetch writer users with phone numbers
    const writerUsers = jobWriterIds.length > 0
      ? await db.select({
          id: users.id,
          displayId: users.displayId,
          name: users.name,
          phone: users.phone
        })
        .from(users)
        .where(inArray(users.id, jobWriterIds))
      : [];

    // Create lookup maps
    const clientMap = new Map(clientUsers.map(c => [c.id, c]));
    const writerMap = new Map(writerUsers.map(w => [w.id, w]));

    // Format response with nested client and writer info
    const formattedJobs = jobsQuery.map(job => {
      const client = clientMap.get(job.clientId);
      const writer = job.assignedFreelancerId ? writerMap.get(job.assignedFreelancerId) : null;

      return {
        id: job.id,
        displayId: job.displayId,
        orderNumber: job.orderNumber,
        clientId: job.clientId,
        assignedFreelancerId: job.assignedFreelancerId,
        title: job.title,
        instructions: job.instructions,
        workType: job.workType,
        pages: job.pages,
        slides: job.slides,
        amount: job.amount,
        statusTotalAmount: job.statusTotalAmount,
        freelancerEarnings: job.freelancerEarnings,
        managerEarnings: job.managerEarnings,
        clientCpp: job.clientCpp,
        baseCpp: job.baseCpp,
        effectiveCpp: job.effectiveCpp,
        singleSpaced: job.singleSpaced,
        clientBonus: job.clientBonus,
        managerAdditional: job.managerAdditional,
        deadline: job.deadline,
        actualDeadline: job.actualDeadline,
        status: job.status,
        paymentConfirmed: job.paymentConfirmed,
        revisionRequested: job.revisionRequested,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        client: client ? {
          id: client.id,
          displayId: client.displayId,
          name: client.name,
          phone: client.phone
        } : null,
        writer: writer ? {
          id: writer.id,
          displayId: writer.displayId,
          name: writer.name,
          phone: writer.phone
        } : null
      };
    });

    // CSV export support
    if (formatParam === 'csv') {
      const header = ['Order ID','Order Number','Title','Work Type','Amount','Status','Deadline','Client','Writer','Created At'];
      const rows = formattedJobs.map((j) => [
        j.displayId,
        j.orderNumber ?? '',
        (j.title ?? '').replace(/\n|\r/g, ' ').trim(),
        j.workType ?? '',
        String(j.amount ?? ''),
        j.status ?? '',
        j.actualDeadline ?? j.deadline ?? '',
        j.client?.name ?? '',
        j.writer?.name ?? '',
        j.createdAt ?? ''
      ]);
      const esc = (val: string) => {
        if (val == null) return '';
        const needsQuotes = /[",\n]/.test(val);
        const safe = String(val).replace(/"/g, '""');
        return needsQuotes ? `"${safe}"` : safe;
      };
      const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
      const managerIdLabel = managerIdInt !== null ? String(managerIdInt) : 'all-managers';
      const filename = `manager-orders-${managerIdLabel}-${statusFilter ?? 'all'}-${new Date().toISOString().slice(0,10)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=${filename}`,
          'Cache-Control': 'no-store'
        }
      });
    }

    return NextResponse.json(formattedJobs, { status: 200 });

  } catch (error) {
    console.error('GET manager orders error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

