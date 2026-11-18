import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, inArray, desc, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';

// GET - Fetch available orders for freelancers
// Freelancers can see ALL accepted orders plus any jobs already assigned to them
export async function GET(request: NextRequest) {
  let freelancerId: number | null = null;

  try {
    const authResult = await requireRole(request, ['freelancer']);
    if (authResult.error) {
      return createErrorResponse(authResult.error, 'UNAUTHORIZED', authResult.status || 401);
    }

    const currentFreelancerId = authResult.user!.id;
    freelancerId = currentFreelancerId;
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    // Validate pagination
    if (isNaN(page) || page < 1) {
      return createErrorResponse('Invalid page number', 'INVALID_PAGE', 400);
    }

    // ✅ OPEN ACCESS: Freelancers can see ALL orders available for bidding
    // Show ALL orders that meet these criteria:
    // 1. Status is 'accepted' OR 'pending' (with admin/manager approval)
    // 2. Not yet assigned to a freelancer (assignedFreelancerId is null)
    // 3. OR orders already assigned to this freelancer (any status for their own work)
    
    // Build query conditions based on status filter
    const myAssignedCondition = eq(jobs.assignedFreelancerId, currentFreelancerId);
    let whereConditions: any[];

    if (!statusFilter) {
      // No filter: Show ALL available orders for bidding (accepted/pending with approval, unassigned)
      // OR orders already assigned to me (any status)
      // Note: We'll filter by assignment and approval status in post-query processing
      whereConditions = [];
    } else if (statusFilter === 'accepted') {
      // Show accepted orders (for bidding) - will filter unassigned in post-processing
      whereConditions = [eq(jobs.status, 'accepted')];
    } else {
      // For other statuses (in_progress, editing, delivered, revision, completed, approved)
      // Show ONLY orders assigned to this freelancer with that specific status
      const validStatuses = ['in_progress', 'editing', 'delivered', 'completed', 'revision', 'approved', 'pending'];
      if (!validStatuses.includes(statusFilter)) {
        return createErrorResponse('Invalid status filter', 'INVALID_STATUS', 400);
      }
      whereConditions = [
        myAssignedCondition,
        eq(jobs.status, statusFilter)
      ];
    }

    const offset = (page - 1) * limit;

    console.log('[Freelancer Orders API] Query params:', {
      freelancerId,
      statusFilter: statusFilter || 'all',
      page,
      limit,
      offset,
      whereConditionsCount: whereConditions.length
    });

    // Fetch orders
    let ordersData: any[] = [];
    try {
      ordersData = await withRetry(
        async () => {
          const query = db.select({
      id: jobs.id,
      displayId: jobs.displayId,
      orderNumber: jobs.orderNumber,
      title: jobs.title,
      instructions: jobs.instructions,
      workType: jobs.workType,
      pages: jobs.pages,
      slides: jobs.slides,
      amount: jobs.amount,
      freelancerEarnings: jobs.freelancerEarnings,
      deadline: jobs.deadline,
      actualDeadline: jobs.actualDeadline,
      freelancerDeadline: jobs.freelancerDeadline,
      status: jobs.status,
      clientId: jobs.clientId,
      managerId: jobs.managerId,
      assignedFreelancerId: jobs.assignedFreelancerId,
      adminApproved: jobs.adminApproved,
      managerApproved: jobs.managerApproved,
      requestDraft: jobs.requestDraft,
      requestPrintableSources: jobs.requestPrintableSources,
      revisionRequested: jobs.revisionRequested,
      createdAt: jobs.createdAt,
    })
            .from(jobs);
          
          // Apply where conditions if any exist
          if (whereConditions.length > 0) {
            query.where(and(...whereConditions));
          }
          
          return await query
            .orderBy(desc(jobs.createdAt))
            .limit(limit)
            .offset(offset);
        },
        { maxRetries: 3, initialDelay: 500 }
      );
      
      // ✅ POST-QUERY FILTERING: Show orders available for bidding
      // For no filter or 'accepted' filter, apply intelligent filtering:
      // - Show orders that are unassigned AND (status='accepted' OR (status='pending' AND (adminApproved=true OR managerApproved=true)))
      // - EXCLUDE orders in terminal states: cancelled, completed, paid
      // - For other status filters, data is already filtered by assigned orders only
      
      if (!statusFilter || statusFilter === 'accepted') {
        const excludedStatuses = ['cancelled', 'completed', 'paid', 'approved'];
        ordersData = ordersData.filter(order => {
          // Exclude terminal/completed states
          if (excludedStatuses.includes(order.status)) {
            return false;
          }
          
          // Include orders assigned to this freelancer
          if (order.assignedFreelancerId === freelancerId) {
            return true;
          }
          
          // For unassigned orders, include if:
          // 1. Status is 'accepted', OR
          // 2. Status is 'pending' and either admin or manager has approved
          if (!order.assignedFreelancerId) {
            return order.status === 'accepted' || 
                   (order.status === 'pending' && (order.adminApproved || order.managerApproved));
          }
          
          return false;
        });
      }
      
      // Debug: Count orders by type
      const acceptedUnassignedCount = ordersData.filter(o => o.status === 'accepted' && !o.assignedFreelancerId).length;
      const pendingApprovedCount = ordersData.filter(o => o.status === 'pending' && (o.adminApproved || o.managerApproved) && !o.assignedFreelancerId).length;
      const myAssignedCount = ordersData.filter(o => o.assignedFreelancerId === freelancerId).length;
      
      console.log('[Freelancer Orders API] Query returned:', {
        totalOrders: ordersData.length,
        acceptedUnassigned: acceptedUnassignedCount,
        pendingApproved: pendingApprovedCount,
        myAssigned: myAssignedCount,
        orderIds: ordersData.map(o => o.id),
        orderStatuses: ordersData.map(o => ({ id: o.id, status: o.status, assigned: o.assignedFreelancerId, adminApproved: o.adminApproved, managerApproved: o.managerApproved }))
      });
    } catch (error) {
      console.error(`[Freelancer Orders API] Error querying orders:`, error);
      throw error;
    }

    // Get client details for these orders
    const orderClientIds = [...new Set(ordersData.map(o => o.clientId))];
    const clientDetails = orderClientIds.length > 0
      ? await withRetry(
          async () => {
            return await db.select({
              id: users.id,
              name: users.name,
              displayId: users.displayId,
            })
            .from(users)
            .where(inArray(users.id, orderClientIds));
          },
          { maxRetries: 3, initialDelay: 500 }
        )
      : [];

    const clientMap = new Map(clientDetails.map(c => [c.id, c]));

    // Format response
    const formattedOrders = ordersData.map(order => ({
      ...order,
      client: clientMap.get(order.clientId) || null,
      isAssignedToMe: order.assignedFreelancerId === freelancerId,
    }));

    return createSuccessResponse({
      orders: formattedOrders,
      totalCount: ordersData.length,
      page,
      limit,
      debug: {
        freelancerId,
        orderCount: ordersData.length,
        restrictionsRemoved: true,
        allAcceptedOrdersVisible: true,
      }
    });

  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
      userId: freelancerId ?? undefined,
    });
    return handleDatabaseError(error);
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

