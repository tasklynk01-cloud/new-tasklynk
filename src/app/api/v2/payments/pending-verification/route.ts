import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments, jobs, users } from '@/db/schema';
import { eq, or, and, desc, sql } from 'drizzle-orm';

/**
 * GET /api/v2/payments/pending-verification
 * 
 * Fetch all Paystack payments pending admin verification
 * 
 * Auth: Requires admin or manager role
 * 
 * Query Parameters:
 * - limit: number (optional, default 100) - Max number of records
 * - offset: number (optional, default 0) - Pagination offset
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     payments: [
 *       {
 *         id: number,
 *         jobId: number | null,
 *         clientId: number,
 *         amount: number,
 *         paystackReference: string,
 *         status: 'pending_verification',
 *         createdAt: string,
 *         clientName: string,
 *         clientEmail: string,
 *         jobDisplayId: string | null,
 *         jobTitle: string | null,
 *         jobAmount: number | null,
 *         jobStatus: string | null
 *       }
 *     ],
 *     total: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin or manager
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch pending verification payments
    const pendingPayments = await db
      .select({
        // Payment data
        id: payments.id,
        jobId: payments.jobId,
        clientId: payments.clientId,
        amount: payments.amount,
        paystackReference: payments.paystackReference,
        paystackAccessCode: payments.paystackAccessCode,
        status: payments.status,
        confirmedByAdmin: payments.confirmedByAdmin,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        
        // Client data
        clientName: users.name,
        clientEmail: users.email,
        clientPhone: users.phone,
        
        // Job data (nullable - wallet top-ups have no job)
        jobDisplayId: jobs.displayId,
        jobTitle: jobs.title,
        jobAmount: jobs.amount,
        jobStatus: jobs.status,
        jobOrderNumber: jobs.orderNumber,
      })
      .from(payments)
      .innerJoin(users, eq(payments.clientId, users.id))
      .leftJoin(jobs, eq(payments.jobId, jobs.id))
      .where(
        and(
          eq(payments.paymentMethod, 'paystack'),
          or(
            eq(payments.status, 'pending_verification'),
            and(
              eq(payments.status, 'pending'),
              eq(payments.confirmedByAdmin, false)
            )
          )
        )
      )
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total pending payments
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(
        and(
          eq(payments.paymentMethod, 'paystack'),
          or(
            eq(payments.status, 'pending_verification'),
            and(
              eq(payments.status, 'pending'),
              eq(payments.confirmedByAdmin, false)
            )
          )
        )
      );

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        payments: pendingPayments,
        total,
        pagination: {
          limit,
          offset,
          hasMore: total > offset + limit,
        },
      },
    });
  } catch (error: any) {
    console.error('[GET /api/v2/payments/pending-verification] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}

