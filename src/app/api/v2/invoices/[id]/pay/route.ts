import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { db } from '@/db'
import { billingInvoices } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getAccessToken, submitOrder } from '@/lib/pesapal'

export const dynamic = 'force-dynamic'

// POST: Initiate Pesapal STK push for invoice payment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCheck = await requireRole(request, ['client'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }
  const user = (authCheck as any).user
  const { id } = await params
  const invoiceId = Number(id)

  try {
    const [invoice] = await db.select().from(billingInvoices).where(eq(billingInvoices.id, invoiceId)).limit(1)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only the recipient can pay
    if (invoice.recipientId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    const body = await request.json()
    const { phoneNumber } = body
    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber required' }, { status: 400 })
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

    const access = await getAccessToken()
    const merchantReference = `INV-${invoice.invoiceNumber}-${Date.now()}`

    const payload = {
      id: merchantReference,
      currency: 'KES' as const,
      amount: invoice.totalAmount,
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      callback_url: callbackUrl,
      notification_id: notificationId,
      billing_address: {
        phone_number: phoneNumber,
        email_address: user.email,
        first_name: user.name?.split(' ')[0] || '',
        last_name: user.name?.split(' ').slice(1).join(' ') || '',
        country_code: 'KE' as const,
      },
    }

    const res = await submitOrder(payload, access)

    // Update invoice with Pesapal refs
    const now = new Date().toISOString()
    await db.update(billingInvoices).set({
      merchantReference,
      orderTrackingId: res.order_tracking_id,
      paymentMethod: 'pesapal',
      updatedAt: now,
    }).where(eq(billingInvoices.id, invoiceId))

    return NextResponse.json({
      success: true,
      merchantReference,
      orderTrackingId: res.order_tracking_id,
      message: res.message,
    })
  } catch (error) {
    console.error('Invoice pay error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
