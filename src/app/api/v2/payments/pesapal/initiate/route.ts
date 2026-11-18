import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { getAccessToken, submitOrder } from '@/lib/pesapal'
import { db } from '@/db'
import { payments } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { isValidWalletTopup } from '@/lib/payment-policy'

// v2.0.1 - Fixed drizzle-orm imports
export const dynamic = 'force-dynamic'

type Body = {
  jobId?: number // 0 or undefined for wallet top-ups
  amount: number
  phoneNumber: string
  description?: string
}

export async function POST(request: NextRequest) {
  // Auth: client or account_owner must be logged in
  const authCheck = await requireRole(request, ['client', 'account_owner'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }
  const user = (authCheck as any).user

  try {
    const body = (await request.json()) as Body
    if (!body?.amount || !body?.phoneNumber) {
      return NextResponse.json({ error: 'amount and phoneNumber are required' }, { status: 400 })
    }
    
    if (!body.jobId && !isValidWalletTopup(Number(body.amount))) {
      return NextResponse.json({ error: 'Wallet top-ups must be whole shillings of at least KSh 100' }, { status: 400 })
    }
    if (!Number.isFinite(Number(body.amount))) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    // Validate amount is within Pesapal limits
    const amount = Math.round(body.amount)
    if (amount < 10) {
      return NextResponse.json({ 
        error: 'Amount must be at least KSh 10 for M-Pesa payments',
        code: 'AMOUNT_TOO_LOW'
      }, { status: 400 })
    }
    if (amount > 999999) {
      return NextResponse.json({ 
        error: 'Amount exceeds maximum limit of KSh 999,999',
        code: 'AMOUNT_TOO_HIGH'
      }, { status: 400 })
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke').replace(/\/$/, '')
    const callbackUrl = process.env.PESAPAL_CALLBACK_URL || `${baseUrl}/api/v2/payments/pesapal/callback`
    const notificationId = process.env.PESAPAL_IPN_ID

    if (!notificationId) {
      return NextResponse.json({
        error: 'Pesapal IPN ID not configured',
        code: 'PESAPAL_CONFIG_MISSING',
      }, { status: 500 })
    }

    const accessToken = await getAccessToken()

    const jobId = body.jobId && body.jobId > 0 ? body.jobId : null
    
    // Check for existing confirmed payment for this job
    if (jobId) {
      const existingPayment = await db.select().from(payments)
        .where(and(eq(payments.jobId, jobId), eq(payments.status, 'confirmed')))
        .limit(1)
      
      if (existingPayment.length > 0) {
        return NextResponse.json({ 
          error: 'Payment already confirmed for this order',
          code: 'DUPLICATE_PAYMENT' 
        }, { status: 400 })
      }
    }
    
    const merchantReference = jobId ? `TL-${jobId}-${Date.now()}` : `TL-TOPUP-${user.id}-${Date.now()}`
    
    // Build complete payload with all Pesapal required/recommended fields
    const payload = {
      id: merchantReference,
      currency: 'KES' as const,
      amount: amount, // Use validated amount
      description: body.description || (jobId ? `Payment for job ${jobId}` : 'Account top-up'),
      callback_url: callbackUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: user.email || `client${user.id}@tasklynk.co.ke`,
        phone_number: body.phoneNumber,
        country_code: 'KE' as const,
        first_name: user.name?.split(' ')[0] || 'Client',
        last_name: user.name?.split(' ').slice(1).join(' ') || 'User',
      },
    }

    // Log payload for debugging INVALID status
    console.log('[Pesapal Initiate] Payload:', {
      merchantReference,
      amount: amount,
      phone: body.phoneNumber,
      email: payload.billing_address.email_address,
      countryCode: payload.billing_address.country_code,
      firstName: payload.billing_address.first_name,
      lastName: payload.billing_address.last_name,
      callbackUrl,
      notificationId,
      jobId,
    })

    const res = await submitOrder(payload, accessToken)

    // Log Pesapal response for debugging
    console.log('[Pesapal Initiate] Response:', {
      status: res.status,
      message: res.message,
      orderTrackingId: res.order_tracking_id,
      merchantReference: res.merchant_reference,
      redirectUrl: res.redirect_url,
      fullResponse: res,
    })

    // Check if Pesapal returned an error or invalid status
    if (res.status && (res.status.toLowerCase().includes('fail') || res.status.toLowerCase().includes('invalid'))) {
      console.error('[Pesapal Initiate] REJECTED - Full Response:', JSON.stringify(res, null, 2))
      console.error('[Pesapal Initiate] REJECTED - Payload Sent:', JSON.stringify(payload, null, 2))
      
      // Extract actual error message from Pesapal
      const pesapalError = res.message || res.error || res.status
      
      return NextResponse.json({ 
        error: `Pesapal Error: ${pesapalError}`,
        code: 'PESAPAL_REJECTED',
        pesapalStatus: res.status,
        pesapalMessage: res.message,
        pesapalError: res.error,
        payloadSent: {
          phone: body.phoneNumber,
          amount: amount,
          email: payload.billing_address.email_address,
          merchantRef: merchantReference,
        },
        hint: 'Check server logs for detailed Pesapal response'
      }, { status: 400 })
    }

    // Insert pending payment record using SQL to tolerate schema drift
    const now = new Date().toISOString()

    const tableInfo = await db.execute(sql`PRAGMA table_info(payments)`)
    const rows = (tableInfo as any)?.rows as Array<any> | undefined
    const columnNames = new Set(
      Array.isArray(rows)
        ? rows.map((r) => String(r?.name || '').toLowerCase()).filter(Boolean)
        : []
    )

    const hasMerchantReference = columnNames.has('merchant_reference')
    const hasOrderTrackingId = columnNames.has('order_tracking_id')

    const insertResult = (hasMerchantReference && hasOrderTrackingId)
      ? await db.execute(sql`
          INSERT INTO payments (
            job_id,
            client_id,
            amount,
            payment_method,
            status,
            phone_number,
            merchant_reference,
            order_tracking_id,
            confirmed_by_admin,
            created_at,
            updated_at
          ) VALUES (
            ${jobId},
            ${user.id},
            ${body.amount},
            ${'pesapal'},
            ${'pending'},
            ${body.phoneNumber},
            ${merchantReference},
            ${res.order_tracking_id},
            ${0},
            ${now},
            ${now}
          )
          RETURNING id
        `)
      : await db.execute(sql`
          INSERT INTO payments (
            job_id,
            client_id,
            amount,
            payment_method,
            status,
            phone_number,
            confirmed_by_admin,
            created_at,
            updated_at
          ) VALUES (
            ${jobId},
            ${user.id},
            ${body.amount},
            ${'pesapal'},
            ${'pending'},
            ${body.phoneNumber},
            ${0},
            ${now},
            ${now}
          )
          RETURNING id
        `)

    const insertedId = Number((insertResult.rows[0] as any)?.id)
    const [insertedPayment] = insertedId
      ? await db.select().from(payments).where(eq(payments.id, insertedId)).limit(1)
      : []

    console.log('[Pesapal Initiate] Payment record created:', {
      paymentId: insertedPayment?.id,
      merchantReference,
      orderTrackingId: res.order_tracking_id,
      amount: body.amount,
    })

    return NextResponse.json({
      success: true,
      merchantReference,
      orderTrackingId: res.order_tracking_id,
      message: res.message || 'STK Push sent successfully',
      redirectUrl: res.redirect_url,
      paymentId: insertedPayment?.id,
    })
  } catch (error: any) {
    console.error('[Pesapal Initiate] Error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json({ 
      error: error?.message || 'Server error',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

