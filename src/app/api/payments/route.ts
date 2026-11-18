import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { handleOptions, createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-helpers';
import { withRetry } from '@/lib/db-retry';
import { logApiError } from '@/lib/error-logger';
import { getManagerScopedJobIds } from '@/lib/manager-job-scope';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const jobId = searchParams.get('jobId');
    const clientId = searchParams.get('clientId');
    const freelancerId = searchParams.get('freelancerId');
    const managerId = searchParams.get('managerId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const conditions: any[] = [];
    
    if (jobId) {
      const parsedJobId = parseInt(jobId);
      if (isNaN(parsedJobId)) {
        return createErrorResponse('Invalid jobId parameter', 'INVALID_JOB_ID', 400);
      }
      conditions.push(eq(payments.jobId, parsedJobId));
    }

    if (clientId) {
      const parsedClientId = parseInt(clientId);
      if (isNaN(parsedClientId)) {
        return NextResponse.json({ 
          error: 'Invalid clientId parameter',
          code: 'INVALID_CLIENT_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(payments.clientId, parsedClientId));
    }

    if (freelancerId) {
      const parsedFreelancerId = parseInt(freelancerId);
      if (isNaN(parsedFreelancerId)) {
        return NextResponse.json({ 
          error: 'Invalid freelancerId parameter',
          code: 'INVALID_FREELANCER_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(payments.freelancerId, parsedFreelancerId));
    }

    if (managerId) {
      const parsedManagerId = parseInt(managerId);
      if (isNaN(parsedManagerId)) {
        return NextResponse.json({
          error: 'Invalid managerId parameter',
          code: 'INVALID_MANAGER_ID'
        }, { status: 400 });
      }

      const managerJobIds = await getManagerScopedJobIds(parsedManagerId);
      if (managerJobIds.length === 0) {
        return createSuccessResponse([]);
      }

      conditions.push(inArray(payments.jobId, managerJobIds));
    }

    if (status) {
      if (!['pending', 'processing', 'confirmed', 'failed'].includes(status)) {
        return createErrorResponse('Invalid status. Must be: pending, processing, confirmed, or failed', 'INVALID_STATUS', 400);
      }
      conditions.push(eq(payments.status, status));
    }

    const baseQuery = db.select().from(payments);
    
    const results = await withRetry(
      async () => {
        return conditions.length > 0 
          ? await baseQuery.where(and(...conditions)).orderBy(desc(payments.createdAt)).limit(limit).offset(offset)
          : await baseQuery.orderBy(desc(payments.createdAt)).limit(limit).offset(offset);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    if (results.length === 0) {
      return createSuccessResponse(results);
    }

    const jobIds = [...new Set(results.map((payment) => payment.jobId).filter((value): value is number => typeof value === 'number'))];
    const clientIds = [...new Set(results.map((payment) => payment.clientId))];

    const [jobRows, clientRows] = await Promise.all([
      jobIds.length > 0
        ? db.select({
            id: jobs.id,
            title: jobs.title,
            displayId: jobs.displayId,
            orderNumber: jobs.orderNumber,
            managerId: jobs.managerId,
          }).from(jobs).where(inArray(jobs.id, jobIds))
        : Promise.resolve([]),
      clientIds.length > 0
        ? db.select({
            id: users.id,
            name: users.name,
          }).from(users).where(inArray(users.id, clientIds))
        : Promise.resolve([]),
    ]);

    const jobMap = new Map(jobRows.map((job) => [job.id, job]));
    const clientMap = new Map(clientRows.map((client) => [client.id, client]));

    return createSuccessResponse(results.map((payment) => {
      const job = payment.jobId ? jobMap.get(payment.jobId) : undefined;
      const client = clientMap.get(payment.clientId);

      return {
        ...payment,
        orderId: payment.jobId,
        orderTitle: job?.title ?? null,
        orderDisplayId: job?.displayId ?? job?.orderNumber ?? null,
        managerId: job?.managerId ?? null,
        clientName: client?.name ?? null,
      };
    }));
  } catch (error) {
    logApiError(error, {
      url: request.url,
      method: request.method,
    });
    return handleDatabaseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, clientId, freelancerId, amount, mpesaCode, phoneNumber, paymentMethod } = body;

    if (!jobId) {
      return createErrorResponse('jobId is required', 'MISSING_JOB_ID', 400);
    }

    if (!clientId) {
      return createErrorResponse('clientId is required', 'MISSING_CLIENT_ID', 400);
    }

    if (!freelancerId) {
      return createErrorResponse('freelancerId is required', 'MISSING_FREELANCER_ID', 400);
    }

    if (!amount) {
      return createErrorResponse('amount is required', 'MISSING_AMOUNT', 400);
    }

    // Validate paymentMethod
    if (!paymentMethod) {
      return createErrorResponse('paymentMethod is required', 'MISSING_PAYMENT_METHOD', 400);
    }

    if (!['pochi', 'direct'].includes(paymentMethod)) {
      return createErrorResponse('paymentMethod must be either "pochi" or "direct"', 'INVALID_PAYMENT_METHOD', 400);
    }

    const parsedJobId = parseInt(jobId);
    if (isNaN(parsedJobId)) {
      return createErrorResponse('jobId must be a valid number', 'INVALID_JOB_ID', 400);
    }

    const parsedClientId = parseInt(clientId);
    if (isNaN(parsedClientId)) {
      return createErrorResponse('clientId must be a valid number', 'INVALID_CLIENT_ID', 400);
    }

    const parsedFreelancerId = parseInt(freelancerId);
    if (isNaN(parsedFreelancerId)) {
      return createErrorResponse('freelancerId must be a valid number', 'INVALID_FREELANCER_ID', 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return createErrorResponse('amount must be a positive number', 'INVALID_AMOUNT', 400);
    }

    // Validate payment method specific fields
    if (paymentMethod === 'pochi') {
      // Manual code entry - require mpesaCode
      if (!mpesaCode || typeof mpesaCode !== 'string' || mpesaCode.trim() === '') {
        return NextResponse.json({ 
          error: 'M-Pesa code is required for Pochi payment method',
          code: 'MISSING_MPESA_CODE' 
        }, { status: 400 });
      }
    } else if (paymentMethod === 'direct') {
      // Direct (Paystack/STK) - phone number helpful but not required
      // Payment details will be added later via Paystack callback
    }

    // Use ISO string for text timestamp fields
    const now = new Date().toISOString();

    // Determine initial status based on payment method
    const initialStatus = paymentMethod === 'pochi' ? 'pending' : 'processing';

    // Build insert data - Use ISO strings for text timestamp fields
    const insertData: {
      jobId: number;
      clientId: number;
      freelancerId: number | null;
      amount: number;
      status: string;
      paymentMethod: string;
      createdAt: string;
      updatedAt: string;
      mpesaCode?: string | null;
      phoneNumber?: string | null;
    } = {
      jobId: parsedJobId,
      clientId: parsedClientId,
      freelancerId: parsedFreelancerId,
      amount: parsedAmount,
      status: initialStatus,
      paymentMethod,
      createdAt: now,
      updatedAt: now,
    };

    // Add method-specific fields
    if (paymentMethod === 'pochi') {
      insertData.mpesaCode = mpesaCode.trim();
      if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim()) {
        insertData.phoneNumber = phoneNumber.trim();
      }
    } else if (paymentMethod === 'direct') {
      // Store phone number if provided (for mobile money)
      if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim()) {
        insertData.phoneNumber = phoneNumber.trim();
      }
      // Direct payment details (Paystack reference) will be added later via callback
    }

    // Insert payment without .returning() to avoid auto-increment issues
    await withRetry(
      async () => {
        return await db.insert(payments)
          .values(insertData);
      },
      { maxRetries: 3, initialDelay: 500 }
    );

    // Fetch the payment back using unique identifiers
    const [newPayment] = await db.select().from(payments)
      .where(
        and(
          eq(payments.jobId, parsedJobId),
          eq(payments.clientId, parsedClientId)
        )
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return createSuccessResponse({
      ...newPayment,
      paymentMethod
    }, 201);
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

