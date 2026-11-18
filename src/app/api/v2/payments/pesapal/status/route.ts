import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { syncPesapalPaymentStatus } from '@/lib/pesapal-sync'
import { db } from '@/db'
import { payments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v2/payments/pesapal/status?orderTrackingId=xxx&merchantReference=xxx
 * Check payment status from Pesapal and update database
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['client', 'admin', 'manager'])
    if ((authCheck as any)?.error) {
      return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
    }
    const user = (authCheck as any).user

    const { searchParams } = new URL(request.url)
    const orderTrackingId = searchParams.get('orderTrackingId')
    const merchantReference = searchParams.get('merchantReference')
    const paymentId = searchParams.get('paymentId')

    if (!orderTrackingId && !merchantReference && !paymentId) {
      return NextResponse.json({ 
        error: 'orderTrackingId, merchantReference, or paymentId required' 
      }, { status: 400 })
    }

    // First, find payment to verify user access
    let payment
    
    // Try by payment ID first (works without schema migration)
    if (paymentId) {
      const result = await db.select().from(payments)
        .where(eq(payments.id, parseInt(paymentId)))
        .limit(1)
      payment = result[0]
    }
    
    // Fallback to merchant reference
    if (!payment && merchantReference) {
      try {
        const result = await db.select().from(payments)
          .where(eq(payments.merchantReference, merchantReference))
          .limit(1)
        payment = result[0]
      } catch (e) {
        console.warn('merchantReference column may not exist:', e)
      }
    }
    
    // Fallback to order tracking ID
    if (!payment && orderTrackingId) {
      try {
        const result = await db.select().from(payments)
          .where(eq(payments.orderTrackingId, orderTrackingId))
          .limit(1)
        payment = result[0]
      } catch (e) {
        console.warn('orderTrackingId column may not exist:', e)
      }
    }

    if (!payment) {
      return NextResponse.json({ 
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND',
        hint: 'Database schema may be missing columns. Please apply the Drizzle migrations (drizzle/0000_fine_randall_flagg.sql, drizzle/0001_sudden_shaman.sql) via `npx drizzle-kit migrate` or `npx drizzle-kit push`'
      }, { status: 404 })
    }

    // Verify user has access to this payment
    if (user.role === 'client' && payment.clientId !== user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized access to payment',
        code: 'UNAUTHORIZED'
      }, { status: 403 })
    }

    // Use centralized sync utility to update payment status
    const result = await syncPesapalPaymentStatus({
      orderTrackingId: orderTrackingId || payment.orderTrackingId,
      merchantReference: merchantReference || payment.merchantReference,
      paymentId: payment.id,
    })

    console.log('[Pesapal Status Check]', {
      success: result.success,
      status: result.status,
      reason: result.reason,
      statusChanged: result.statusChanged,
    })

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to check payment status',
        code: result.reason || 'STATUS_CHECK_FAILED',
        details: {
          orderTrackingId: result.orderTrackingId,
          merchantReference: result.merchantReference,
        },
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: result.payment?.id,
        status: result.status,
        amount: result.payment?.amount,
        merchantReference: result.merchantReference,
        orderTrackingId: result.orderTrackingId,
        pesapalStatus: result.pesapalStatus,
        confirmedAt: result.payment?.confirmedAt,
        statusChanged: result.statusChanged,
      },
      pesapalResponse: result.statusData,
    })
  } catch (error: any) {
    console.error('[Pesapal Status Check] Error:', {
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json({ 
      error: error?.message || 'Server error',
      code: 'SERVER_ERROR'
    }, { status: 500 })
  }
}

