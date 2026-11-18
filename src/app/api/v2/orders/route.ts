import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, notifications, orderStatusHistory, orderTimelineEvents, freelancerProfiles } from '@/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';
import { computeOrderPricing } from '@/lib/order-pricing';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';
import { generateJobDisplayId } from '@/app/api/utils/generate-display-id/route';

function parseStatusList(status: string | null): string[] {
  if (!status) return [];
  return status
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// 🔴 DISABLE CACHING: Ensure real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/v2/orders - List orders with role-based filtering and assignment info
export async function GET(request: NextRequest) {
  try {
    // 🔴 REAL-TIME: Log request for debugging
    console.log(`[Orders API] GET request at ${new Date().toISOString()}`);
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // 🔒 Always require an authenticated session (even if query params are provided)
    // Prevents callers from spoofing `role=admin` / `userId=...`.
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer', 'editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const authUser = authCheck.user!;

    // ------------------------------
    // Legacy compatibility mode
    // Many UI screens still call the legacy list endpoint shape:
    //   GET /api/jobs?clientId=..&assignedFreelancerId=..&status=..&limit=..&offset=..
    // Phase 1 migrates UI to /api/v2/orders without forcing query rewrites.
    // ------------------------------
    if (!userId || !role) {
      const user = authUser;

      const clientId = searchParams.get('clientId');
      const assignedFreelancerId = searchParams.get('assignedFreelancerId');
      const statusParam = searchParams.get('status');
      const statusList = parseStatusList(statusParam);
      const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 1000);
      const offset = parseInt(searchParams.get('offset') ?? '0', 10);

      const conditions: any[] = [];
      if (user.role === 'client' || user.role === 'account_owner') {
        conditions.push(eq(jobs.clientId, user.id));
      } else if (user.role === 'freelancer') {
        conditions.push(eq(jobs.assignedFreelancerId, user.id));
      } else if (user.role === 'editor') {
        conditions.push(eq(jobs.assignedEditorId, user.id));
      } else if ((user.role === 'admin' || user.role === 'manager') && clientId) {
        const parsedClientId = parseInt(clientId, 10);
        if (!Number.isNaN(parsedClientId)) conditions.push(eq(jobs.clientId, parsedClientId));
      }

      if (assignedFreelancerId) {
        const parsedFreelancerId = parseInt(assignedFreelancerId, 10);
        if (!Number.isNaN(parsedFreelancerId)) conditions.push(eq(jobs.assignedFreelancerId, parsedFreelancerId));
      }

      if (statusList.length === 1) {
        conditions.push(eq(jobs.status, statusList[0]));
      } else if (statusList.length > 1) {
        conditions.push(inArray(jobs.status, statusList));
      }

      const baseQuery = db
        .select({
          id: jobs.id,
          displayId: jobs.displayId,
          orderNumber: jobs.orderNumber,
          orderId: jobs.orderId,
          clientId: jobs.clientId,
          clientName: users.name,
          title: jobs.title,
          instructions: jobs.instructions,
          workType: jobs.workType,
          pages: jobs.pages,
          slides: jobs.slides,
          amount: jobs.amount,
          deadline: jobs.deadline,
          status: jobs.status,
          assignedFreelancerId: jobs.assignedFreelancerId,
          freelancerAccepted: jobs.freelancerAccepted,
          freelancerAcceptedAt: jobs.freelancerAcceptedAt,
          freelancerResponsePending: jobs.freelancerResponsePending,
          actualDeadline: jobs.actualDeadline,
          freelancerDeadline: jobs.freelancerDeadline,
          freelancerEarnings: jobs.freelancerEarnings,
          managerId: jobs.managerId,
          managerEarnings: jobs.managerEarnings,
          adminApproved: jobs.adminApproved,
          clientApproved: jobs.clientApproved,
          approvedByClientAt: jobs.approvedByClientAt,
          revisionRequested: jobs.revisionRequested,
          revisionNotes: jobs.revisionNotes,
          paymentConfirmed: jobs.paymentConfirmed,
          paidOrderConfirmedAt: jobs.paidOrderConfirmedAt,
          clientPreferredFreelancer: jobs.clientPreferredFreelancer,
          clientPreferenceType: jobs.clientPreferenceType,
          metadata: jobs.metadata,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
        })
        .from(jobs)
        .leftJoin(users, eq(jobs.clientId, users.id));

      const results = conditions.length > 0
        ? await baseQuery.where(and(...conditions)).orderBy(desc(jobs.createdAt)).limit(limit).offset(offset)
        : await baseQuery.orderBy(desc(jobs.createdAt)).limit(limit).offset(offset);

      const preferredIds = Array.from(
        new Set(
          results
            .map((r: any) => r.clientPreferredFreelancer)
            .filter((id: any): id is number => typeof id === 'number' && id > 0)
        )
      );
      const preferredNameMap = new Map<number, string>();
      if (preferredIds.length > 0) {
        try {
          const prefUsers = await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, preferredIds));
          for (const u of prefUsers) {
            preferredNameMap.set(u.id, u.name);
          }
        } catch (prefErr) {
          console.error('[Orders API] Failed to resolve preferred specialist names:', prefErr);
        }
      }

      const enrichedResults = results.map((r: any) => {
        const meta = r.metadata && typeof r.metadata === 'object' ? r.metadata : {};
        const preferredFreelancerName =
          (r.clientPreferredFreelancer ? preferredNameMap.get(r.clientPreferredFreelancer) : null) ||
          meta.preferredSpecialistName ||
          (meta.preferredSpecialistSlug ? String(meta.preferredSpecialistSlug).replace(/-/g, ' ') : null);
        return {
          ...r,
          preferredFreelancerName: preferredFreelancerName || null,
          preferredSpecialistSlug: meta.preferredSpecialistSlug || null,
        };
      });

      return NextResponse.json(enrichedResults, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const uid = parseInt(userId);
    const requestedRole = String(role).toLowerCase().trim();
    const requestedUserId = Number.isNaN(uid) ? null : uid;

    // 🔒 Enforce that non-admin/manager callers cannot request broader access.
    // Admin/manager access is driven by authenticated role, not by query params.
    const effectiveRole = (authUser.role === 'admin' || authUser.role === 'manager')
      ? authUser.role
      : authUser.role;

    if (authUser.role !== 'admin' && authUser.role !== 'manager') {
      if (requestedRole !== String(authUser.role).toLowerCase().trim()) {
        return createErrorResponse('Forbidden: role mismatch', 'ROLE_MISMATCH', 403);
      }
      if (requestedUserId == null || requestedUserId !== Number(authUser.id)) {
        return createErrorResponse('Forbidden: user mismatch', 'USER_MISMATCH', 403);
      }
    }

    let baseQuery;

    const statusList = parseStatusList(status);

    // Role-based filtering with proper manager_id support
    if (effectiveRole === 'admin') {
      // Admin sees all orders
      if (statusList.length === 1) {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.status, statusList[0]))
          .orderBy(desc(jobs.createdAt));
      } else if (statusList.length > 1) {
        baseQuery = db.select().from(jobs)
          .where(inArray(jobs.status, statusList))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs).orderBy(desc(jobs.createdAt));
      }
    } else if (effectiveRole === 'manager') {
      // ✅ OPEN ACCESS: Managers can see ALL orders (no client/writer restrictions)
      // This allows managers to help with any order on the platform
      if (statusList.length === 1) {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.status, statusList[0]))
          .orderBy(desc(jobs.createdAt));
      } else if (statusList.length > 1) {
        baseQuery = db.select().from(jobs)
          .where(inArray(jobs.status, statusList))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs).orderBy(desc(jobs.createdAt));
      }
    } else if (effectiveRole === 'client' || effectiveRole === 'account_owner') {
      // Client sees their own orders
      if (statusList.length === 1) {
        baseQuery = db.select().from(jobs)
          .where(and(
            eq(jobs.clientId, uid),
            eq(jobs.status, statusList[0])
          ))
          .orderBy(desc(jobs.createdAt));
      } else if (statusList.length > 1) {
        baseQuery = db.select().from(jobs)
          .where(and(
            eq(jobs.clientId, uid),
            inArray(jobs.status, statusList)
          ))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.clientId, uid))
          .orderBy(desc(jobs.createdAt));
      }
    } else if (effectiveRole === 'freelancer') {
      // Freelancer sees orders assigned to them (for their dashboard stats)
      // For available orders to bid on, they use /api/v2/freelancers/available-orders
      if (statusList.length === 1) {
        baseQuery = db.select().from(jobs)
          .where(and(
            eq(jobs.assignedFreelancerId, uid),
            eq(jobs.status, statusList[0])
          ))
          .orderBy(desc(jobs.createdAt));
      } else if (statusList.length > 1) {
        baseQuery = db.select().from(jobs)
          .where(and(
            eq(jobs.assignedFreelancerId, uid),
            inArray(jobs.status, statusList)
          ))
          .orderBy(desc(jobs.createdAt));
      } else {
        baseQuery = db.select().from(jobs)
          .where(eq(jobs.assignedFreelancerId, uid))
          .orderBy(desc(jobs.createdAt));
      }
    } else {
      return createErrorResponse('Invalid role', 'INVALID_ROLE', 400);
    }

    const ordersData = await withRetry(
      async () => {
        return await baseQuery;
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    // ✅ ENHANCEMENT: Enrich orders with manager, freelancer, and client details (name + phone)
    const enrichedOrders = await Promise.all(ordersData.map(async (order) => {
      let managerName = null;
      let managerPhone = null;
      let freelancerName = null;
      let freelancerPhone = null;
      let clientName = null;
      let clientPhone = null;

      // Fetch manager details if assigned
      if (order.managerId != null) {
        const managerId = order.managerId;
        const [manager] = await withRetry(
          async () => {
            return await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, managerId)).limit(1);
          },
          { maxRetries: 2, initialDelay: 300 }
        );
        managerName = manager?.name || null;
        managerPhone = manager?.phone || null;
      }

      // Fetch freelancer details if assigned
      if (order.assignedFreelancerId != null) {
        const freelancerId = order.assignedFreelancerId;
        const [freelancer] = await withRetry(
          async () => {
            return await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, freelancerId)).limit(1);
          },
          { maxRetries: 2, initialDelay: 300 }
        );
        freelancerName = freelancer?.name || null;
        freelancerPhone = freelancer?.phone || null;
      }

      // Fetch client details (always present)
      const [client] = await withRetry(
        async () => {
          return await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, order.clientId)).limit(1);
        },
        { maxRetries: 2, initialDelay: 300 }
      );
      clientName = client?.name || null;
      clientPhone = client?.phone || null;

      // 🔴 FIX: Add financial field aliases for consistent API responses
      return {
        ...order,
        managerName,
        managerPhone,
        freelancerName,
        freelancerPhone,
        clientName,
        clientPhone,
        // Add aliases for common field name variations
        writerTotal: order.freelancerEarnings || 0,
        freelancerAmount: order.freelancerEarnings || 0,
        clientTotal: order.amount || 0,
        managerTotal: order.managerEarnings || 0,
        orderNumber: order.orderNumber || order.displayId || order.orderId,
        pageCount: order.pages,
        slideCount: order.slides,
      };
    }));

    return createSuccessResponse({ orders: enrichedOrders });
  } catch (error: any) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

// POST /api/v2/orders - Create new order
export async function POST(request: NextRequest) {
  console.log('[POST /api/v2/orders] ==> ORDER CREATION REQUEST STARTED');
  console.log('[POST /api/v2/orders] Request URL:', request.url);
  console.log('[POST /api/v2/orders] Request headers:', {
    'content-type': request.headers.get('content-type'),
    'authorization': request.headers.get('authorization') ? 'Bearer token present' : 'No auth header',
    'cookie': request.headers.get('cookie') ? 'Cookies present' : 'No cookies',
    'user-agent': request.headers.get('user-agent')
  });
  
  try {
    // 🔒 AUTHENTICATION: Check authentication FIRST before any processing
    console.log('[POST /api/v2/orders] Checking authentication...');
    let authCheck;
    try {
      authCheck = await requireRole(request, ['client', 'account_owner', 'admin']);
    } catch (authError: any) {
      console.error('[POST /api/v2/orders] requireRole threw exception:', {
        message: authError?.message,
        stack: authError?.stack,
        name: authError?.name
      });
      return NextResponse.json(
        { 
          error: 'Authentication system error: ' + (authError?.message || 'Unknown error'),
          code: 'AUTH_SYSTEM_ERROR' 
        },
        { status: 500 }
      );
    }
    
    if (authCheck.error) {
      console.error('[POST /api/v2/orders] Authentication failed:', authCheck.error);
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }

    const authenticatedUser = authCheck.user!;
    console.log('[POST /api/v2/orders] Authentication successful for user:', {
      id: authenticatedUser.id,
      role: authenticatedUser.role,
      name: authenticatedUser.name
    });
    
    console.log('[POST /api/v2/orders] Parsing request body...');
    const body = await request.json();
    console.log('[POST /api/v2/orders] Request body parsed successfully:', {
      hasClientId: !!body.clientId,
      hasTitle: !!body.title,
      hasWorkType: !!body.workType,
      hasPages: !!body.pages,
      hasSlides: !!body.slides
    });
    
    const {
      clientId,
      title,
      instructions,
      workType,
      pages,
      slides,
      // pricing inputs
      clientCpp,
      amount,
      deadline,
      // optional metadata (legacy/new-job payload compatibility)
      actualDeadline,
      freelancerDeadline,
      requestDraft,
      requestPrintableSources,
      singleSpaced,
      baseCpp,
      effectiveCpp,
      accountOrderNumber,
      accountLinked,
      // New fields for enhanced order placement
      clientNotes,
      preferredFreelancerId,
      freelancerPreference,
      urgencyLevel,
      complexityLevel,
    } = body;

    // Comprehensive input validation
    const validationErrors = [];
    const isNonAcademic = Boolean(body.isNonAcademic) || Boolean(body.category && body.category !== 'academic');
    
    // 🔒 STRICT VALIDATION: clientId must be a valid positive integer
    if (!clientId) {
      validationErrors.push('Client ID is required');
    } else {
      const parsedClientId = parseInt(String(clientId), 10);
      if (isNaN(parsedClientId) || parsedClientId <= 0 || String(parsedClientId) !== String(clientId).trim()) {
        validationErrors.push('Client ID must be a valid positive integer');
      }
    }
    
    if (!title || String(title).trim().length === 0) {
      validationErrors.push('Title is required and cannot be empty');
    }
    
    if (!workType || String(workType).trim().length === 0) {
      validationErrors.push('Work type is required and cannot be empty');
    }
    
    if (!isNonAcademic && !pages && !slides) {
      validationErrors.push('Either pages or slides must be specified');
    }
    
    if (pages && (isNaN(Number(pages)) || Number(pages) <= 0)) {
      validationErrors.push('Pages must be a positive number');
    }
    
    if (slides && (isNaN(Number(slides)) || Number(slides) <= 0)) {
      validationErrors.push('Slides must be a positive number');
    }

    if (isNonAcademic && (!amount || Number(amount) <= 0)) {
      validationErrors.push('Order amount must be greater than zero for this service');
    }
    
    if (validationErrors.length > 0) {
      console.error('[Orders] Validation failed:', validationErrors);
      return createErrorResponse(
        `Validation failed: ${validationErrors.join(', ')}`,
        'VALIDATION_ERROR',
        400
      );
    }

    console.log('[POST /api/v2/orders] Input validation passed successfully');

    // 🔒 AUTHORIZATION: Verify clientId matches authenticated user (unless admin)
    const parsedClientId = parseInt(String(clientId));
    if (authenticatedUser.role !== 'admin' && parsedClientId !== authenticatedUser.id) {
      console.error('[POST /api/v2/orders] Authorization failed: clientId mismatch', {
        requestedClientId: parsedClientId,
        authenticatedUserId: authenticatedUser.id
      });
      return NextResponse.json({
        error: 'Cannot create orders for other users',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 🔒 SECURITY: Check if client is approved before allowing order placement
    console.log('[POST /api/v2/orders] Checking client approval status...');
    const [client] = await withRetry(
      async () => {
        return await db.select().from(users).where(eq(users.id, parsedClientId)).limit(1);
      },
      { maxRetries: 3, initialDelay: 500 }
    );
    
    console.log('[POST /api/v2/orders] Client lookup completed:', {
      found: !!client,
      approved: client?.approved,
      status: client?.status
    });
    
    if (!client) {
      console.error('[POST /api/v2/orders] Client not found for ID:', clientId);
      return createErrorResponse('Client not found', 'CLIENT_NOT_FOUND', 404);
    }

    // Check if client is approved and active
    if (!client.approved || (client.status !== 'active' && client.status !== 'approved')) {
      console.error('[POST /api/v2/orders] Client not approved:', {
        approved: client.approved,
        status: client.status,
        clientId: client.id
      });
      return createErrorResponse(
        'Your account is pending approval. Please wait for admin approval before placing orders.',
        'ACCOUNT_NOT_APPROVED',
        403
      );
    }

    console.log('[POST /api/v2/orders] Client approved, proceeding with order creation');

    // 🔴 FIX: Get manager_id from client's assignedManagerId
    const managerId = client.assignedManagerId || null;
    console.log('[POST /api/v2/orders] Manager ID resolved:', managerId);

    const now = new Date().toISOString();
    console.log('[POST /api/v2/orders] Basic variables set, proceeding to pricing...');

    // Unified pricing logic (Phase 2)
    let pricing;
    try {
      console.log('[POST /api/v2/orders] Computing order pricing with:', {
        workType, pages, slides, clientCpp, amount, deadline, singleSpaced, isNonAcademic
      });
      
      pricing = computeOrderPricing({
        workType,
        category: body.category,
        isNonAcademic,
        pages,
        slides,
        clientCpp,
        amount,
        deadline: deadline || actualDeadline || freelancerDeadline,
        singleSpaced,
      });
      
      console.log('[POST /api/v2/orders] Pricing computed successfully:', {
        clientTotal: pricing.clientTotal,
        pages: pricing.pages,
        slides: pricing.slides
      });
    } catch (e: any) {
      console.error('[POST /api/v2/orders] Pricing computation failed:', e);
      const msg = e?.message || 'Invalid pricing inputs';
      const code = msg.toLowerCase().includes('rate') ? 'CLIENT_CPP_BELOW_MINIMUM' : 'INVALID_UNITS';
      return createErrorResponse(msg, code, 400);
    }

    const nowSingleSpaced = Boolean(singleSpaced);
    console.log('[POST /api/v2/orders] Computing writer estimate...');
    const writerEstimate = isNonAcademic
      ? Math.round(pricing.clientTotal * 0.8)
      : calculateWriterEarningsByCPPLevel(
          pricing.pages,
          pricing.slides,
          workType,
          0,
          nowSingleSpaced
        );
    console.log('[POST /api/v2/orders] Writer estimate computed:', writerEstimate);

    const managerTotal = 0;
    const platformFee = Math.max(pricing.clientTotal - writerEstimate - managerTotal, 0);

    console.log('[POST /api/v2/orders] All calculations complete, starting order creation...');

    // Generate unique display ID inside retry block to handle race conditions
    let newOrder;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`[POST /api/v2/orders] Retry attempt ${retryCount + 1}/${maxRetries}`);
        
        // Generate a fresh display ID on each attempt with error handling
        let displayId;
        try {
          console.log('[POST /api/v2/orders] Generating display ID...');
          displayId = await generateJobDisplayId();
          console.log('[POST /api/v2/orders] Display ID generated:', displayId);
        } catch (idError: any) {
          console.error(`[Orders] Display ID generation failed (attempt ${retryCount + 1}):`, idError);
          // Fallback to timestamp-based ID if generation fails
          displayId = `#${String(new Date().getFullYear()).slice(2)}${String(Date.now()).slice(-6)}`;
          console.log('[POST /api/v2/orders] Using fallback display ID:', displayId);
        }
        const orderNumber = displayId;

        // 🔴 PRODUCTION FIX: Provide ALL required fields with comprehensive validation
        const safeClientId = parseInt(String(clientId));
        const safeTitle = String(title || 'Untitled Order').trim().substring(0, 255);
        const safeInstructions = String(instructions || 'No instructions provided').trim();
        const safeWorkType = String(workType || 'writing').trim();
        const safeDeadline = deadline || pricing.parsedDeadline.toISOString();
        const safeActualDeadline = actualDeadline || deadline || pricing.parsedDeadline.toISOString();
        const safeFreelancerDeadline = freelancerDeadline || deadline || pricing.parsedDeadline.toISOString();
        
        if (isNaN(safeClientId) || safeClientId <= 0) {
          throw new Error('Invalid client ID provided');
        }
        
        const insertData: any = {
          // Core required fields (no defaults)
          displayId: displayId || `FALLBACK-${Date.now()}`,
          orderNumber: orderNumber || displayId || `ORDER-${Date.now()}`,
          orderId: displayId || `ID-${Date.now()}`,
          clientId: safeClientId,
          title: safeTitle,
          instructions: safeInstructions,
          workType: safeWorkType,
          amount: Number(pricing?.clientTotal || amount || 0),
          deadline: safeDeadline,
          actualDeadline: safeActualDeadline,
          freelancerDeadline: safeFreelancerDeadline,
          
          // Quantity fields with explicit validation
          pages: Math.max(0, Number(pricing?.pages || pages || 0)) || null,
          slides: Math.max(0, Number(pricing?.slides || slides || 0)) || null,
          problems: null,
          
          // Status field (required with default)
          status: 'pending',
          
          // Financial fields (required with default(0)) - ensure numeric
          freelancerEarnings: Number(writerEstimate || 0) || 0,
          managerEarnings: Number(managerTotal || 0) || 0,
          adminProfit: Number(platformFee || 0) || 0,
          managerAssignedFee: 0,
          managerDeliveryFee: 0,
          
          // Boolean fields with required defaults
          accountLinked: Boolean(accountLinked),
          requestDraft: Boolean(requestDraft),
          requestPrintableSources: Boolean(requestPrintableSources),
          singleSpaced: Boolean(singleSpaced),
          draftDelivered: false,
          managerApproved: false,
          editorApproved: false,
          editorRequestedRevision: false,
          editorFlagged: false,
          adminApproved: false,
          clientApproved: false,
          revisionRequested: false,
          paymentConfirmed: false,
          invoiceGenerated: false,
          isRealOrder: true,
          requiresReports: true,
          finalSubmissionComplete: false,
          revisionSubmissionComplete: false,
          clientCppConfirmed: false,
          freelancerAccepted: false,
          freelancerRejected: false,
          freelancerResponsePending: false,
          isInvoiced: false,
          hasOpenInternalRevision: false,
          clientRequestedRevision: false,
          
          // Numeric fields with required defaults
          placementPriority: 0,
          urgencyMultiplier: 1.0,
          managerAdditional: 0,
          clientBonus: 0,
          statusTotalAmount: 0,
          internalRevisionCount: 0,
          escalationLevel: 0,
          
          // Text fields with defaults
          editorStatus: 'not_assigned',
          serviceType: 'writing_page',
          managerAdditionalStatus: 'none',
          cppPaymentStatus: 'unpaid',
          
          // Timestamps
          createdAt: now,
          updatedAt: now,
        };

        // Add optional fields if provided (with strict type validation)
        if (managerId) {
          const parsedManagerId = parseInt(String(managerId), 10);
          if (!isNaN(parsedManagerId) && parsedManagerId > 0) {
            insertData.managerId = parsedManagerId;
          }
        }
        if (accountOrderNumber) insertData.accountOrderNumber = String(accountOrderNumber).trim();
        if (baseCpp) {
          const parsedBaseCpp = parseFloat(String(baseCpp));
          if (!isNaN(parsedBaseCpp) && parsedBaseCpp > 0) {
            insertData.baseCpp = parsedBaseCpp;
          }
        }
        if (effectiveCpp) {
          const parsedEffectiveCpp = parseFloat(String(effectiveCpp));
          if (!isNaN(parsedEffectiveCpp) && parsedEffectiveCpp > 0) {
            insertData.effectiveCpp = parsedEffectiveCpp;
          }
        }
        if (clientCpp) {
          const parsedClientCpp = parseFloat(String(clientCpp));
          if (!isNaN(parsedClientCpp) && parsedClientCpp > 0) {
            insertData.clientCpp = parsedClientCpp;
          }
        }
        
        // Add new enhanced fields (with validation)
        if (clientNotes) insertData.clientNotes = String(clientNotes).trim();
        if (preferredFreelancerId) {
          const parsedPreferredId = parseInt(String(preferredFreelancerId), 10);
          if (!isNaN(parsedPreferredId) && parsedPreferredId > 0) {
            insertData.clientPreferredFreelancer = parsedPreferredId;
          }
        }
        if (freelancerPreference) insertData.clientPreferenceType = String(freelancerPreference);
        if (urgencyLevel) insertData.urgencyLevel = String(urgencyLevel);
        if (complexityLevel) insertData.complexityLevel = String(complexityLevel);

        // Store category-specific metadata & answers in jobs.metadata
        insertData.metadata = {
          ...(body.metadata || {}),
          category: body.category || (isNonAcademic ? 'professional_services' : 'academic'),
          dynamicAnswers: body.dynamicAnswers || null,
          scopeDetails: body.scopeDetails || null,
          preferredSpecialistSlug: body.preferredSpecialistSlug || null,
        };

        // If client requested a specialist by public slug, map to preferred freelancer ID & name
        if (body.preferredSpecialistSlug && !insertData.clientPreferredFreelancer) {
          try {
            const [specProfile] = await db
              .select({ userId: freelancerProfiles.userId })
              .from(freelancerProfiles)
              .where(eq(freelancerProfiles.publicSlug, String(body.preferredSpecialistSlug).trim()))
              .limit(1);
            if (specProfile?.userId) {
              insertData.clientPreferredFreelancer = specProfile.userId;
              insertData.clientPreferenceType = 'preferred';
            }
          } catch (specLookupErr) {
            console.error('[Orders] Failed to map preferred specialist slug:', specLookupErr);
          }
        }

        // Attach human-readable specialist name to metadata for admin & manager visibility
        if (insertData.clientPreferredFreelancer) {
          try {
            const [prefUser] = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, insertData.clientPreferredFreelancer))
              .limit(1);
            if (prefUser?.name) {
              insertData.metadata = {
                ...insertData.metadata,
                preferredSpecialistName: prefUser.name,
              };
            }
          } catch (prefNameErr) {
            console.error('[Orders] Failed to resolve preferred specialist name:', prefNameErr);
          }
        }

        console.log('[POST /api/v2/orders] About to insert into database with displayId:', displayId);
        console.log('[POST /api/v2/orders] Insert data keys:', Object.keys(insertData));
        
        // 🔧 CRITICAL FIX: Explicitly delete 'id' field to prevent Drizzle from inserting null
        // The id field is auto-increment and should not be included in INSERT statements
        const { id: _removeId, ...insertDataWithoutId } = insertData as any;
        
        const result = await db.insert(jobs).values(insertDataWithoutId).returning();
        console.log('[POST /api/v2/orders] Database insert successful, returned:', {
          id: result[0]?.id,
          displayId: result[0]?.displayId
        });
        
        newOrder = result[0];
        break; // Success - exit retry loop
      } catch (insertError: any) {
        retryCount++;
        
        // Enhanced error logging for debugging
        console.error(`[Orders] Insert attempt ${retryCount}/${maxRetries} failed:`, {
          message: insertError?.message,
          code: insertError?.code,
          name: insertError?.name,
          constraint: insertError?.constraint,
          table: insertError?.table,
          column: insertError?.column,
        });
        
        // Check if it's a unique constraint violation
        const isUniqueViolation = insertError?.message?.toLowerCase().includes('unique') ||
                                 insertError?.code === 'SQLITE_CONSTRAINT' ||
                                 insertError?.code === '23505';
        
        if (isUniqueViolation && retryCount < maxRetries) {
          // Wait with exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
          console.log(`[Orders] Retry ${retryCount}/${maxRetries} due to unique constraint`);
          continue;
        }
        
        // If not a unique violation or out of retries, throw the error
        console.error('[Orders] Max retries exceeded or non-retryable error:', {
          isUniqueViolation,
          retryCount,
          maxRetries,
          error: insertError?.message,
        });
        throw insertError;
      }
    }
    
    if (!newOrder) {
      throw new Error('Failed to create order after maximum retries');
    }

    // ✅ Record order status history
    try {
      await db.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        fromStatus: null, // Initial status
        toStatus: 'pending',
        changedBy: parseInt(clientId),
        changedByRole: 'client',
        reason: 'Order created by client',
        notes: `Order "${newOrder.title}" created`,
        automaticTransition: false,
        createdAt: now,
      });
    } catch (historyErr) {
      console.error('[Orders] Failed to record status history:', historyErr);
      // Non-critical, continue
    }

    // ✅ Record timeline events
    try {
      const timelineEvents = [
        {
          orderId: newOrder.id,
          eventType: 'order_created',
          eventCategory: 'order',
          title: 'Order Created',
          description: `Order ${newOrder.displayId} created by ${client.name}`,
          actorId: parseInt(clientId),
          actorRole: 'client',
          actorName: client.name,
          metadata: JSON.stringify({
            workType: newOrder.workType,
            pages: newOrder.pages,
            slides: newOrder.slides,
            amount: newOrder.amount,
            deadline: newOrder.deadline,
          }),
          importance: 'high',
          visibleToClient: true,
          visibleToFreelancer: false,
          visibleToAdmin: true,
          icon: 'file-plus',
          color: 'blue',
          createdAt: now,
        },
      ];

      // Add preferred freelancer event if specified
      if (preferredFreelancerId && freelancerPreference === 'preferred') {
        timelineEvents.push({
          orderId: newOrder.id,
          eventType: 'freelancer_preference_set',
          eventCategory: 'order',
          title: 'Preferred Freelancer Selected',
          description: `Client selected a preferred freelancer for this order`,
          actorId: parseInt(clientId),
          actorRole: 'client',
          actorName: client.name,
          metadata: JSON.stringify({ preferredFreelancerId }),
          importance: 'normal',
          visibleToClient: true,
          visibleToFreelancer: false,
          visibleToAdmin: true,
          icon: 'user-check',
          color: 'purple',
          createdAt: now,
        });
      }

      await db.insert(orderTimelineEvents).values(timelineEvents);
    } catch (timelineErr) {
      console.error('[Orders] Failed to record timeline events:', timelineErr);
      // Non-critical, continue
    }

    // ✅ AUTOMATION: Notify assigned manager (best-effort)
    // After admin approval, managers should take over day-to-day handling.
    if (managerId) {
      try {
        await db.insert(notifications).values({
          userId: managerId,
          jobId: newOrder.id,
          type: 'new_order',
          title: 'New Order Created',
          message: `${client.name} created a new order ${newOrder.displayId || newOrder.orderNumber}.`,
          read: false,
          createdAt: now,
        });
      } catch (notifyErr) {
        console.error('[Orders] Failed to notify manager about new order:', notifyErr);
      }
    }

    // ✅ AUTOMATION: Send email notification to admins about new order
    try {
      const { sendNewOrderNotificationToAdmins } = await import('@/lib/email');
      
      console.log('[Orders] Sending email notification to admins about new order:', newOrder.id);
      
      await sendNewOrderNotificationToAdmins({
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        displayId: newOrder.displayId,
        clientName: client.name,
        clientEmail: client.email,
        title: newOrder.title,
        workType: newOrder.workType,
        pages: newOrder.pages || undefined,
        slides: newOrder.slides || undefined,
        amount: newOrder.amount,
        deadline: newOrder.deadline,
        instructions: newOrder.instructions || undefined,
      });
      
      console.log('[Orders] ✅ Admin email notification sent successfully');
    } catch (emailErr) {
      // Email is best-effort, don't fail the order creation
      console.error('[Orders] ⚠️ Failed to send admin email notification (non-critical):', emailErr);
    }

    return createSuccessResponse({ 
      order: newOrder,
      message: 'Order created successfully. Pending admin approval.'
    }, 201);
  } catch (error: any) {
    // Drizzle wraps DB failures as a generic "Failed query: ..." on
    // error.message - the actual Postgres reason (invalid type, constraint
    // name, etc.) lives on error.cause and was never being surfaced, which
    // makes every DB-level order-creation failure a guessing game.
    const cause = error?.cause?.message ? error.cause : error;
    console.error('[POST /api/v2/orders] ❌❌❌ FATAL ERROR - Complete diagnostic:', {
      errorType: error?.constructor?.name,
      message: error?.message,
      causeMessage: cause?.message,
      stack: error?.stack,
      code: cause?.code,
      name: error?.name,
      constraint: cause?.constraint,
      table: cause?.table,
      column: cause?.column,
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    });

    logApiError(error, {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      error: 'Failed to create order: ' + (cause?.message || 'Unknown error'),
      code: 'ORDER_CREATION_ERROR',
      details: cause?.message || 'Contact support',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

