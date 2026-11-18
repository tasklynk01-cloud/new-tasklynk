import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, bids, users, notifications } from '@/db/schema';
import { eq, and, desc, notInArray, sql } from 'drizzle-orm';
import { generateJobDisplayId } from '@/app/api/utils/generate-display-id/route';
import { sendEmailToAdmins, getNewJobPostingAdminHTML } from '@/lib/email';
import { minRequiredClientAmount, minRequiredClientSlideAmount, calculateUrgentSurcharge, isUrgentOrder, clientMinCPP, clientMinCPS } from '@/lib/payment-calculations';
import { requireRole } from '@/lib/admin-auth';
import { notifyOrderCreated } from '@/lib/notifications';

const VALID_STATUSES = ['pending', 'accepted', 'approved', 'in_progress', 'editing', 'delivered', 'revision', 'completed', 'cancelled', 'on_hold', 'paid'] as const;

// Helper function to enforce minimum client pricing rules
function computeClientMinimumAmount(pages: number | null | undefined, slides: number | null | undefined, workType?: string | null | undefined): number {
  const p = Math.max(0, Number(pages || 0));
  const s = Math.max(0, Number(slides || 0));
  // Use the updated pricing function that considers work type
  return minRequiredClientAmount(p, workType) + minRequiredClientSlideAmount(s);
}

export async function GET(request: NextRequest) {
  try {
    // 🔒 AUTHENTICATION: Require valid session
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const assignedFreelancerId = searchParams.get('assignedFreelancerId');
    const status = searchParams.get('status');
    const excludeFreelancerBids = searchParams.get('excludeFreelancerBids');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query conditions
    const conditions: any[] = [];

    // 🔒 AUTHORIZATION: Enforce role-based data access
    if (user.role === 'client' || user.role === 'account_owner') {
      // Clients can ONLY see their own jobs
      conditions.push(eq(jobs.clientId, user.id));
    } else if (user.role === 'admin' || user.role === 'manager') {
      // ✅ Admins and Managers can see ALL orders system-wide
      // Apply clientId filter only if explicitly provided
      if (clientId) {
        const parsedClientId = parseInt(clientId);
        if (isNaN(parsedClientId)) {
          return NextResponse.json({ 
            error: 'Invalid clientId parameter',
            code: 'INVALID_CLIENT_ID' 
          }, { status: 400 });
        }
        conditions.push(eq(jobs.clientId, parsedClientId));
      }
      // No conditions = full visibility
    }

    if (assignedFreelancerId) {
      const parsedFreelancerId = parseInt(assignedFreelancerId);
      if (isNaN(parsedFreelancerId)) {
        return NextResponse.json({ 
          error: 'Invalid assignedFreelancerId parameter',
          code: 'INVALID_FREELANCER_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(jobs.assignedFreelancerId, parsedFreelancerId));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(jobs.status, status));
    }

    // Handle excludeFreelancerBids parameter
    if (excludeFreelancerBids) {
      const parsedFreelancerId = parseInt(excludeFreelancerBids);
      if (isNaN(parsedFreelancerId)) {
        return NextResponse.json({ 
          error: 'Invalid excludeFreelancerBids parameter',
          code: 'INVALID_EXCLUDE_FREELANCER_BIDS' 
        }, { status: 400 });
      }

      // Get all job IDs where this freelancer has placed a bid
      const freelancerBids = await db
        .select({ jobId: bids.jobId })
        .from(bids)
        .where(eq(bids.freelancerId, parsedFreelancerId));

      const jobIdsWithBids = freelancerBids.map(bid => bid.jobId);

      // If freelancer has placed bids, exclude those jobs
      if (jobIdsWithBids.length > 0) {
        conditions.push(notInArray(jobs.id, jobIdsWithBids));
      }
    }

    // Fetch jobs with client information using LEFT JOIN
    const baseQuery = db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        orderNumber: jobs.orderNumber,
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
        adminApproved: jobs.adminApproved,
        clientApproved: jobs.clientApproved,
        approvedByClientAt: jobs.approvedByClientAt,
        revisionRequested: jobs.revisionRequested,
        revisionNotes: jobs.revisionNotes,
        paymentConfirmed: jobs.paymentConfirmed,
        paidOrderConfirmedAt: jobs.paidOrderConfirmedAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.clientId, users.id));

    const results = conditions.length > 0 
      ? await baseQuery.where(and(...conditions)).orderBy(desc(jobs.createdAt)).limit(limit).offset(offset)
      : await baseQuery.orderBy(desc(jobs.createdAt)).limit(limit).offset(offset);

    // Return with aggressive cache-busting headers for real-time updates
    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('[POST /api/jobs] ==> ORDER CREATION REQUEST STARTED (LEGACY ENDPOINT)');
  
  try {
    console.log('[POST /api/jobs] Checking authentication...');
    // 🔒 AUTHENTICATION: Require client, account_owner, or admin role
    const authCheck = await requireRole(request, ['client', 'account_owner', 'admin']);
    if (authCheck.error) {
      console.error('[POST /api/jobs] Authentication failed:', authCheck.error);
      return NextResponse.json(
        { error: authCheck.error, code: 'UNAUTHORIZED' },
        { status: authCheck.status }
      );
    }

    const authenticatedUser = authCheck.user!;
    console.log('[POST /api/jobs] Authentication successful for user:', {
      id: authenticatedUser.id,
      role: authenticatedUser.role,
      name: authenticatedUser.name
    });

    console.log('[POST /api/jobs] Parsing request body...');
    // Accept both JSON and form submissions to avoid 500s on multipart posts
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      body = Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, typeof v === 'string' ? v : (v as File).name]));
    } else {
      // Fallback try JSON
      try { body = await request.json(); } catch { body = {}; }
    }

    console.log('[POST /api/jobs] Request body parsed successfully:', {
      hasClientId: !!body.clientId,
      hasTitle: !!body.title,
      hasInstructions: !!body.instructions,
      hasWorkType: !!body.workType,
      hasPages: !!body.pages,
      hasSlides: !!body.slides,
      hasAmount: !!body.amount,
      hasDeadline: !!body.deadline
    });

    const { 
      clientId, 
      title, 
      instructions, 
      workType, 
      pages, 
      slides, 
      problems,
      amount, 
      deadline, 
      actualDeadline, 
      freelancerDeadline, 
      requestDraft, 
      requestPrintableSources,
      singleSpaced,
      baseCpp,
      effectiveCpp,
      clientCpp,
      accountOrderNumber, 
      accountLinked 
    } = body;

    // Validation: Required fields
    if (!clientId) {
      return NextResponse.json({ 
        error: 'clientId is required',
        code: 'MISSING_CLIENT_ID' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || String(title).trim() === '') {
      return NextResponse.json({ 
        error: 'title is required and must be a non-empty string',
        code: 'INVALID_TITLE' 
      }, { status: 400 });
    }

    if (!instructions || typeof instructions !== 'string' || String(instructions).trim() === '') {
      return NextResponse.json({ 
        error: 'instructions is required and must be a non-empty string',
        code: 'INVALID_INSTRUCTIONS' 
      }, { status: 400 });
    }

    // 🔧 FIX: Accept any non-empty workType string
    const rawWorkType = typeof workType === 'string' ? workType.trim() : String(workType || '').trim();
    if (!rawWorkType) {
      return NextResponse.json({ 
        error: 'workType is required',
        code: 'INVALID_WORK_TYPE' 
      }, { status: 400 });
    }
    const normalizedWorkType = rawWorkType || 'Other';

    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: 'amount is required',
        code: 'MISSING_AMOUNT' 
      }, { status: 400 });
    }

    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: 'amount must be a positive number',
        code: 'INVALID_AMOUNT' 
      }, { status: 400 });
    }

    if (!deadline) {
      return NextResponse.json({ 
        error: 'deadline is required',
        code: 'MISSING_DEADLINE' 
      }, { status: 400 });
    }

    // Validate deadline is a valid ISO timestamp
    const parsedDeadlineDate = new Date(String(deadline));
    if (isNaN(parsedDeadlineDate.getTime())) {
      return NextResponse.json({ 
        error: 'deadline must be a valid ISO timestamp',
        code: 'INVALID_DEADLINE' 
      }, { status: 400 });
    }

    // Validate clientId is a valid integer
    const parsedClientId = parseInt(String(clientId));
    if (isNaN(parsedClientId)) {
      return NextResponse.json({ 
        error: 'clientId must be a valid integer',
        code: 'INVALID_CLIENT_ID' 
      }, { status: 400 });
    }

    // 🔒 AUTHORIZATION: Verify clientId matches authenticated user (unless admin)
    if (authenticatedUser.role !== 'admin' && parsedClientId !== authenticatedUser.id) {
      return NextResponse.json({
        error: 'Cannot create jobs for other users',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Validate optional pages field
    let parsedPages: number | null = null;
    if (pages !== undefined && pages !== null && String(pages).trim() !== '') {
      parsedPages = parseInt(String(pages));
      if (isNaN(parsedPages) || parsedPages < 0) {
        return NextResponse.json({ 
          error: 'pages must be a non-negative integer',
          code: 'INVALID_PAGES' 
        }, { status: 400 });
      }
    }

    // Validate optional slides field
    let parsedSlides: number | null = null;
    if (slides !== undefined && slides !== null && String(slides).trim() !== '') {
      parsedSlides = parseInt(String(slides));
      if (isNaN(parsedSlides) || parsedSlides < 0) {
        return NextResponse.json({ 
          error: 'slides must be a non-negative integer',
          code: 'INVALID_SLIDES' 
        }, { status: 400 });
      }
    }

    // Validate optional problems field
    let parsedProblems: number | null = null;
    if (problems !== undefined && problems !== null && String(problems).trim() !== '') {
      parsedProblems = parseInt(String(problems));
      if (isNaN(parsedProblems) || parsedProblems < 0) {
        return NextResponse.json({ 
          error: 'problems must be a non-negative integer',
          code: 'INVALID_PROBLEMS' 
        }, { status: 400 });
      }
    }

    // 🔧 FIX: Only enforce minimum pricing if pages or slides are provided
    if (parsedPages !== null || parsedSlides !== null) {
      const minimumAmount = computeClientMinimumAmount(parsedPages, parsedSlides, normalizedWorkType);
      if (minimumAmount > 0 && parsedAmount < minimumAmount) {
        return NextResponse.json({ 
          error: `Amount (KSh ${parsedAmount}) cannot be less than the required minimum (KSh ${minimumAmount}) based on ${parsedPages || 0} page(s) and ${parsedSlides || 0} slide(s).`,
          code: 'AMOUNT_BELOW_MINIMUM',
          minimumAmount
        }, { status: 400 });
      }
    }

    // Normalize optional CPP fields
    const normalizedBaseCpp = baseCpp !== undefined && baseCpp !== null && String(baseCpp).trim() !== ''
      ? parseFloat(String(baseCpp))
      : null;

    const normalizedEffectiveCpp = effectiveCpp !== undefined && effectiveCpp !== null && String(effectiveCpp).trim() !== ''
      ? parseFloat(String(effectiveCpp))
      : null;

    let parsedClientCpp: number | null = null;
    if (clientCpp !== undefined && clientCpp !== null && String(clientCpp).trim() !== '') {
      parsedClientCpp = parseFloat(String(clientCpp));
      if (isNaN(parsedClientCpp) || parsedClientCpp <= 0) {
        return NextResponse.json({
          error: 'CPP must be a positive number',
          code: 'INVALID_CPP',
        }, { status: 400 });
      }
    }

    // Enforce CPP minimums where applicable
    if (parsedClientCpp !== null) {
      if (parsedPages && parsedPages > 0) {
        const minCppForWorkType = clientMinCPP(normalizedWorkType);
        if (parsedClientCpp < minCppForWorkType) {
          return NextResponse.json({
            error: `CPP cannot be less than KSh ${minCppForWorkType} for this work type`,
            code: 'CPP_BELOW_MINIMUM',
          }, { status: 400 });
        }
      }

      if ((parsedPages === null || parsedPages === 0) && parsedSlides && parsedSlides > 0) {
        const minSlideCpp = clientMinCPS();
        if (parsedClientCpp < minSlideCpp) {
          return NextResponse.json({
            error: `CPP cannot be less than KSh ${minSlideCpp} for slide-based orders`,
            code: 'SLIDE_CPP_BELOW_MINIMUM',
          }, { status: 400 });
        }
      }
    }

    console.log('[POST /api/jobs] Fetching client from database...');
    // Fetch client to determine account and name for order number generation
    const clientRows = await db.select().from(users).where(eq(users.id, parsedClientId)).limit(1);
    if (clientRows.length === 0) {
      console.error('[POST /api/jobs] Client not found in database:', parsedClientId);
      return NextResponse.json({ 
        error: 'Client not found',
        code: 'CLIENT_NOT_FOUND' 
      }, { status: 404 });
    }
    const client = clientRows[0];
    console.log('[POST /api/jobs] Client found:', { id: client.id, name: (client as any).name });

    console.log('[POST /api/jobs] Determining order context...');
    // 🔧 FIX: Simplified account context determination
    const isAccountContext = Boolean(accountLinked);
    console.log('[POST /api/jobs] Account context:', { isAccountContext, accountLinked });

    const now = new Date().toISOString();

    console.log('[POST /api/jobs] Generating order number...');
    // 🔧 FIX: Improved order number generation with better validation and error handling
    let orderNumber = '';
    let accountOrderNumberToSave: string | null = null;
    
    if (isAccountContext) {
      // For account clients, they MUST provide an external order number
      const provided = typeof accountOrderNumber === 'string' ? accountOrderNumber.trim() : '';
      if (!provided) {
        return NextResponse.json({
          error: 'Order Number is required for account-linked orders. Please provide your external order number (e.g., EP2025001).',
          code: 'MISSING_ACCOUNT_ORDER_NUMBER'
        }, { status: 400 });
      }
      
      // Store external account order number in accountOrderNumber field
      accountOrderNumberToSave = provided;
      
      // Generate internal order number based on client name for tracking
      const clientName = ((client as any).name || 'Account').trim();
      const firstName = clientName.split(/\s+/)[0] || 'ACC';
      const alphaOnly = firstName.replace(/[^A-Za-z]/g, '');
      const basePrefix = (alphaOnly && alphaOnly.length >= 3) ? alphaOnly.toUpperCase().slice(0, 3) : 'ACC';

      // Find next available sequence number for this prefix
      const existing = await db
        .select({ orderNumber: jobs.orderNumber })
        .from(jobs)
        .where(sql`${jobs.orderNumber} LIKE ${basePrefix + '%'}`);

      let maxSuffix = 0;
      for (const row of existing) {
        const match = row.orderNumber?.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num)) maxSuffix = Math.max(maxSuffix, num);
        }
      }
      
      orderNumber = `${basePrefix}${String(maxSuffix + 1).padStart(4, '0')}`;
      console.log('[Order Creation] Account order - Internal:', orderNumber, 'External:', provided);
    } else {
      // 🔧 FIX: For regular clients, use provided order number or auto-generate from name
      if (accountOrderNumber && typeof accountOrderNumber === 'string' && accountOrderNumber.trim()) {
        // Client provided an order number (from frontend auto-generation)
        orderNumber = accountOrderNumber.trim().toUpperCase();
        accountOrderNumberToSave = null;
        console.log('[Order Creation] Regular client with provided order number:', orderNumber);
      } else {
        // Fallback: auto-generate from client name
        const clientName = ((client as any).name || 'Client').trim();
        const firstName = clientName.split(/\s+/)[0] || 'USER';
        const alphaOnly = firstName.replace(/[^A-Za-z]/g, '');
        const basePrefix = (alphaOnly && alphaOnly.length >= 3) ? alphaOnly.toUpperCase().slice(0, 3) : 'USR';

        // Find next available sequence number for this prefix
        const existing = await db
          .select({ orderNumber: jobs.orderNumber })
          .from(jobs)
          .where(sql`${jobs.orderNumber} LIKE ${basePrefix + '%'}`);

        let maxSuffix = 0;
        for (const row of existing) {
          const match = row.orderNumber?.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num)) maxSuffix = Math.max(maxSuffix, num);
          }
        }
        
        orderNumber = `${basePrefix}${String(maxSuffix + 1).padStart(4, '0')}`;
        accountOrderNumberToSave = null;
        console.log('[Order Creation] Regular client auto-generated order number:', orderNumber);
      }
    }

    console.log('[POST /api/jobs] Validating order number uniqueness...');
    // Validate order number uniqueness
    const existingOrder = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.orderNumber, orderNumber)).limit(1);
    if (existingOrder.length > 0) {
      console.error('[POST /api/jobs] Order number already exists:', orderNumber);
      return NextResponse.json({
        error: `Order number ${orderNumber} already exists. Please try again.`,
        code: 'ORDER_NUMBER_EXISTS'
      }, { status: 409 });
    }
    console.log('[POST /api/jobs] Order number is unique:', orderNumber);

    console.log('[POST /api/jobs] Calculating pricing and metadata...');
    // Calculate urgency metadata but keep client-stated amount as final authority
    const urgentSurcharge = calculateUrgentSurcharge(parsedDeadlineDate, parsedAmount);
    const isUrgent = isUrgentOrder(parsedDeadlineDate);
    const finalAmount = Math.round(Math.max(parsedAmount, 0) * 100) / 100;
    const urgencyMultiplier = isUrgent && parsedAmount > 0
      ? (urgentSurcharge / parsedAmount) + 1
      : 1.0;
    console.log('[POST /api/jobs] Pricing calculated:', { 
      originalAmount: parsedAmount,
      finalAmount,
      isUrgent,
      urgentSurcharge,
      urgencyMultiplier 
    });

    // 🟠 CPP Calculation: Prefer client-provided CPP, fall back to submitted base CPP or derived average
    const totalUnits = (parsedPages || 0) + (parsedSlides || 0);
    let storedClientCpp = parsedClientCpp !== null ? parsedClientCpp : normalizedBaseCpp;
    if ((storedClientCpp === null || isNaN(storedClientCpp)) && totalUnits > 0) {
      storedClientCpp = Math.round((finalAmount / totalUnits) * 100) / 100;
    }
    
    console.log('[POST /api/jobs] Calculating CPP and service type...');
    // Determine service type based on work type
    let serviceType = 'writing_page';
    const workTypeLower = normalizedWorkType.toLowerCase();
    if (workTypeLower.includes('slide') || workTypeLower.includes('presentation') || workTypeLower.includes('powerpoint')) {
      serviceType = 'slide';
    } else if (workTypeLower.includes('technical') || workTypeLower.includes('data') || workTypeLower.includes('programming') || 
               workTypeLower.includes('excel') || workTypeLower.includes('spss') || workTypeLower.includes('stata')) {
      serviceType = 'technical_page';
    }
    console.log('[POST /api/jobs] Service type determined:', { workType: normalizedWorkType, serviceType });

    console.log('[POST /api/jobs] Starting database insertion with retry logic...');
    // 🔧 FIX: Retry logic for display ID generation to handle race conditions
    let newJob;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`[POST /api/jobs] Insertion attempt ${retryCount + 1}/${maxRetries}...`);
        
        console.log('[POST /api/jobs] Generating display ID...');
        // Generate unique display ID
        const displayIdCurrent = await generateJobDisplayId();
        console.log('[POST /api/jobs] Display ID generated:', displayIdCurrent);
        
        // 🔧 FIX: Do NOT include 'id' field - it's auto-generated by database
        // Build insert data without id field to prevent "null" insertion
        // Note: Boolean fields must be true/false (not 1/0) for TypeScript compatibility
        // CRITICAL: ALL fields with .notNull() MUST have explicit values, even if they have schema defaults
        const insertData = {
          // Core identification fields
          displayId: displayIdCurrent,
          orderId: displayIdCurrent,
          orderNumber,
          accountOrderNumber: accountOrderNumberToSave,
          accountLinked: isAccountContext,
          
          // User relationships
          clientId: parsedClientId,
          assignedFreelancerId: null,
          managerId: null,
          assignedEditorId: null,
          
          // Job details
          title: String(title).trim(),
          instructions: String(instructions).trim(),
          workType: normalizedWorkType,
          pages: parsedPages,
          slides: parsedSlides,
          problems: parsedProblems,
          
          // Financial calculations
          amount: finalAmount,
          managerEarnings: 0,
          freelancerEarnings: 0,
          adminProfit: 0,
          
          // Deadlines (all required)
          deadline: parsedDeadlineDate.toISOString(),
          actualDeadline: actualDeadline || parsedDeadlineDate.toISOString(),
          freelancerDeadline: freelancerDeadline || parsedDeadlineDate.toISOString(),
          
          // Request flags (all .notNull() with defaults)
          requestDraft: Boolean(requestDraft),
          draftDelivered: false,
          requestPrintableSources: Boolean(requestPrintableSources),
          singleSpaced: Boolean(singleSpaced),
          
          // CPP fields
          baseCpp: normalizedBaseCpp,
          effectiveCpp: normalizedEffectiveCpp,
          clientCpp: storedClientCpp,
          clientCppConfirmed: false,
          
          // Service configuration
          serviceType,
          
          // Manager additional fees
          managerAdditional: 0,
          managerAdditionalNote: null,
          managerAdditionalStatus: 'none' as const,
          
          // Client bonus and totals
          clientBonus: 0,
          statusTotalAmount: finalAmount,
          cppPaymentStatus: 'unpaid' as const,
          lastAmountUpdateAt: now,
          
          // Order status
          status: 'pending' as const,
          
          // Approval gates (all .notNull() with defaults)
          managerApproved: false,
          managerApprovedAt: null,
          managerApprovalNotes: null,
          editorApproved: false,
          editorApprovedAt: null,
          editorApprovalNotes: null,
          adminApproved: false,
          clientApproved: false,
          approvedByClientAt: null,
          
          // Revision tracking
          revisionRequested: false,
          revisionNotes: null,
          
          // Payment tracking
          paymentConfirmed: false,
          paidOrderConfirmedAt: null,
          invoiceGenerated: false,
          
          // Ratings
          clientRating: null,
          writerRating: null,
          reviewComment: null,
          
          // Priority and pricing
          placementPriority: 0,
          urgencyMultiplier,
          calculatedPrice: finalAmount,
          isRealOrder: true,
          
          // Submission tracking
          requiresReports: true,
          finalSubmissionComplete: false,
          revisionSubmissionComplete: false,
          
          // Freelancer response tracking (all .notNull() with defaults)
          freelancerAccepted: false,
          freelancerAcceptedAt: null,
          freelancerRejected: false,
          freelancerRejectedAt: null,
          freelancerRejectionReason: null,
          freelancerResponsePending: false,
          
          // Workflow timestamps
          assignedAt: null,
          submittedAt: null,
          deliveredAt: null,
          approvedAt: null,
          paidAt: null,
          completedAt: null,
          
          // Financial fields
          isInvoiced: false,
          orderType: null,
          managerAssignedFee: null,
          managerDeliveryFee: null,
          freelancerAmount: null,
          totalAmount: null,
          invoicedAt: null,
          
          // Internal revision tracking (all .notNull() with defaults)
          hasOpenInternalRevision: false,
          internalRevisionCount: 0,
          clientRequestedRevision: false,
          
          // Timestamps (required)
          createdAt: now,
          updatedAt: now,
        };

        // 🔧 CRITICAL FIX: Use raw SQL with explicit columns to avoid id=null insertion by Drizzle+LibSQL
        // Helper: camelCase to snake_case
        const camelToSnake = (s: string) => s
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .replace(/__/g, '_')
          .toLowerCase();

        // 🔴 FIX: Include ALL critical fields, especially pages/slides for calculations
        const minimalInsertData = {
          displayId: displayIdCurrent,
          orderId: displayIdCurrent,
          orderNumber,
          accountOrderNumber: accountOrderNumberToSave,
          accountLinked: isAccountContext,
          clientId: parsedClientId,
          title: String(title).trim(),
          instructions: String(instructions).trim(),
          workType: normalizedWorkType,
          pages: parsedPages,  // 🔴 CRITICAL: Include pages for manager fee calculations
          slides: parsedSlides,  // 🔴 CRITICAL: Include slides for manager fee calculations
          problems: parsedProblems,
          amount: finalAmount,
          managerEarnings: 0,
          freelancerEarnings: 0,
          adminProfit: 0,
          deadline: parsedDeadlineDate.toISOString(),
          actualDeadline: actualDeadline || parsedDeadlineDate.toISOString(),
          freelancerDeadline: freelancerDeadline || parsedDeadlineDate.toISOString(),
          requestDraft: Boolean(requestDraft),
          requestPrintableSources: Boolean(requestPrintableSources),
          singleSpaced: Boolean(singleSpaced),
          baseCpp: normalizedBaseCpp,
          effectiveCpp: normalizedEffectiveCpp,
          clientCpp: storedClientCpp,
          serviceType,
          urgencyMultiplier,
          statusTotalAmount: finalAmount,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        } as const;

        console.log('[POST /api/jobs] Preparing database insertion...', {
          displayId: displayIdCurrent,
          orderNumber,
          clientId: parsedClientId,
          amount: finalAmount,
          pages: parsedPages,
          slides: parsedSlides
        });

        // Build columns/values excluding id
        const entries = Object.entries(minimalInsertData)
          .filter(([k]) => k !== 'id')
          .map(([k, v]) => [k, v === undefined ? null : v] as const);
        const columnSql = sql.raw(entries.map(([k]) => `"${camelToSnake(k)}"`).join(', '));
        const valuesSql = sql.join(entries.map(([, v]) => sql`${v}`), sql`, `);

        console.log('[POST /api/jobs] Executing database insertion...');
        await db.execute(sql`insert into "jobs" (${columnSql}) values (${valuesSql})`);
        console.log('[POST /api/jobs] Database insertion successful');

        console.log('[POST /api/jobs] Retrieving created job...');
        // Fetch the created job by unique displayId
        const createdJobs = await db
          .select()
          .from(jobs)
          .where(eq(jobs.displayId, displayIdCurrent))
          .limit(1);
        
        if (createdJobs.length === 0) {
          console.error('[POST /api/jobs] Job not found after insertion');
          throw new Error('Job was inserted but could not be retrieved');
        }
        console.log('[POST /api/jobs] Job retrieved successfully:', { id: createdJobs[0].id, displayId: createdJobs[0].displayId });
        
        newJob = createdJobs;
        
        console.log('[POST /api/jobs] Insertion successful on attempt', retryCount + 1);
        // Success - break out of retry loop
        break;
      } catch (err: any) {
        console.error(`[POST /api/jobs] Database insertion error on attempt ${retryCount + 1}:`, {
          message: err?.message,
          code: err?.code,
          errno: err?.errno,
          constraint: err?.constraint
        });
        
        const errorMessage = (err?.message || '').toLowerCase();
        
        // Check if it's a duplicate key error for display_id or order_id
        if (errorMessage.includes('unique') && (errorMessage.includes('display_id') || errorMessage.includes('order_id'))) {
          retryCount++;
          console.log(`Display ID collision detected, retry ${retryCount}/${maxRetries}`);
          
          if (retryCount >= maxRetries) {
            return NextResponse.json({
              error: 'Failed to generate unique job ID after multiple attempts. Please try again.',
              code: 'ID_GENERATION_FAILED'
            }, { status: 500 });
          }
          
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, retryCount)));
          continue;
        }
        
        // Different error - throw it
        throw err;
      }
    }

    console.log('[POST /api/jobs] Retry loop completed, checking job creation result...');
    if (!newJob || newJob.length === 0) {
      console.error('[POST /api/jobs] Job creation failed - no job returned');
      return NextResponse.json({ 
        error: 'Failed to create job',
        code: 'JOB_CREATE_FAILED' 
      }, { status: 500 });
    }

    console.log('[POST /api/jobs] Job creation successful, preparing response...');
    console.log('[Order Created Successfully]', {
      jobId: newJob[0].id,
      displayId: newJob[0].displayId,
      orderId: newJob[0].orderId,
      orderNumber: newJob[0].orderNumber,
      accountOrderNumber: newJob[0].accountOrderNumber,
      clientId: parsedClientId,
      amount: finalAmount,
      serviceType,
      status: newJob[0].status
    });

    // Update client's role grouping if needed
    try {
      if (isAccountContext && (client as any).role !== 'account_owner') {
        await db.update(users).set({ role: 'account_owner', updatedAt: new Date().toISOString() }).where(eq(users.id, parsedClientId));
      }
    } catch (roleErr) {
      console.error('Role update error (non-fatal):', roleErr);
    }

    // Send notification to admins
    try {
      // 1. Send Email
      sendEmailToAdmins({
        subject: `[Order ${newJob[0].displayId}] New Job Posted`,
        html: getNewJobPostingAdminHTML(
          (client as any).name,
          (client as any).email,
          String(title).trim(),
          newJob[0].id,
          newJob[0].displayId,
          normalizedWorkType,
          parsedAmount,
          parsedDeadlineDate.toISOString()
        )
      }).catch(err => console.error('Failed to send admin notification:', err));

      // 2. Create In-App Notification for Admins and Managers
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
      const managers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'manager'));
      
      // Notify all admins and managers using enhanced notification function
      for (const admin of admins) {
        await notifyOrderCreated(admin.id, newJob[0].id, orderNumber, (client as any).name);
      }
      for (const manager of managers) {
        await notifyOrderCreated(manager.id, newJob[0].id, orderNumber, (client as any).name);
      }
    } catch (err) {
      console.error('Admin notification error:', err);
    }

    return NextResponse.json(newJob[0], { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/jobs] FATAL ERROR - Detailed analysis:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name,
      constraint: error?.constraint,
      table: error?.table,
      column: error?.column,
      sqliteCode: error?.sqliteCode,
      errno: error?.errno,
      timestamp: new Date().toISOString()
    });
    
    console.error('[POST /api/jobs] Error stack trace:', error?.stack);
    
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error?.message || 'Unknown error'),
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error?.stack : 'Contact support'
    }, { status: 500 });
  }
}

