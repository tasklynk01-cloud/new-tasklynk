import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { db } from '@/db'
import { payments, notifications, users, jobs } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { isValidWalletTopup } from '@/lib/payment-policy'

// v2.0.1 - Fixed drizzle-orm imports and raw SQL insert
export const dynamic = 'force-dynamic'

/**
 * Till No payment request.
 * Client provides amount and mpesaCode (manually paid to Till).
 * Admin must confirm the payment later.
 */
type Body = {
  jobId?: number
  amount: number
  mpesaCode: string // M-Pesa confirmation code from client
  phoneNumber?: string
}

export async function POST(request: NextRequest) {
  const authCheck = await requireRole(request, ['client', 'account_owner'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }
  const user = (authCheck as any).user

  try {
    const body = (await request.json()) as Body
    if (!body?.amount || !body?.mpesaCode) {
      return NextResponse.json({ error: 'amount and mpesaCode are required' }, { status: 400 })
    }

    const resolvedJobId = typeof body.jobId === 'number' && Number.isFinite(body.jobId) && body.jobId > 0
      ? body.jobId
      : null
    const now = new Date().toISOString()
    if (!resolvedJobId && !isValidWalletTopup(Number(body.amount))) {
      return NextResponse.json({ error: 'Wallet top-ups must be whole shillings of at least KSh 100' }, { status: 400 })
    }
    
    // Check for existing confirmed payment for this job
    if (resolvedJobId) {
      const existingPayment = await db.select().from(payments)
        .where(and(eq(payments.jobId, resolvedJobId), eq(payments.status, 'confirmed')))
        .limit(1)
      
      if (existingPayment.length > 0) {
        return NextResponse.json({ 
          error: 'Payment already confirmed for this order',
          code: 'DUPLICATE_PAYMENT' 
        }, { status: 400 })
      }
    }

    // Get order details for notification message
    let orderDisplayId = resolvedJobId ? `#${resolvedJobId}` : 'wallet top-up';
    if (resolvedJobId) {
      const [job] = await db.select({ displayId: jobs.displayId, orderNumber: jobs.orderNumber })
        .from(jobs)
        .where(eq(jobs.id, resolvedJobId))
        .limit(1);
      if (job) {
        orderDisplayId = job.displayId || job.orderNumber || `#${resolvedJobId}`;
      }
    }

    // Insert payment using Drizzle SQL to avoid schema drift issues (older DBs may lack newer columns)
    const insertResult = await db.execute(sql`
      INSERT INTO payments (
        job_id,
        client_id,
        amount,
        payment_method,
        status,
        mpesa_code,
        phone_number,
        confirmed_by_admin,
        created_at,
        updated_at
      ) VALUES (
        ${resolvedJobId},
        ${user.id},
        ${body.amount},
        ${'till'},
        ${'pending'},
        ${body.mpesaCode.trim().toUpperCase()},
        ${body.phoneNumber || null},
        ${0},
        ${now},
        ${now}
      )
      RETURNING id
    `)

    const insertedId = Number((insertResult.rows[0] as any)?.id)
    const [newPayment] = insertedId
      ? await db.select().from(payments).where(eq(payments.id, insertedId)).limit(1)
      : []

    // Create notification for the client
    try {
      await db.insert(notifications).values({
        userId: user.id,
        jobId: resolvedJobId,
        type: 'payment_pending',
        title: 'Payment Submitted - Awaiting Verification',
        message: `Your payment of KSh ${body.amount.toLocaleString()} for ${orderDisplayId} has been submitted. M-Pesa code: ${body.mpesaCode.toUpperCase()}. Admin will verify and confirm within 24 hours.`,
        createdAt: now,
      });
    } catch (notifError) {
      console.warn('Failed to create client notification:', notifError);
    }

    // Notify all admins about the new payment to verify
    try {
      const admins = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));

      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          jobId: resolvedJobId,
          type: 'payment_pending_verification',
          title: 'New Payment Awaiting Verification',
          message: `${user.name} submitted a payment of KSh ${body.amount.toLocaleString()} for ${orderDisplayId}. M-Pesa code: ${body.mpesaCode.toUpperCase()}. Please verify.`,
          createdAt: now,
        });
      }
    } catch (adminNotifError) {
      console.warn('Failed to create admin notifications:', adminNotifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully. Awaiting admin verification.',
      paymentId: newPayment?.id || insertedId,
      mpesaCode: body.mpesaCode.toUpperCase(),
    })
  } catch (error: any) {
    console.error('Till initiate error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return NextResponse.json({ 
      error: error?.message || 'Server error',
      code: 'SERVER_ERROR'
    }, { status: 500 })
  }
}

