import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/pesapal'
import { syncPesapalPaymentStatus } from '@/lib/pesapal-sync'

export const dynamic = 'force-dynamic'

function buildResponseBody(result?: Awaited<ReturnType<typeof syncPesapalPaymentStatus>>) {
  if (!result) return { status: 'success' }

  const body: Record<string, unknown> = { status: 'success', syncSuccess: result.success }

  if (result.status) body.paymentStatus = result.status
  if (result.pesapalStatus) body.pesapalStatus = result.pesapalStatus
  if (typeof result.statusChanged === 'boolean') body.statusChanged = result.statusChanged
  if (result.orderTrackingId) body.orderTrackingId = result.orderTrackingId
  if (result.merchantReference) body.merchantReference = result.merchantReference

  if (!result.success) {
    body.syncReason = result.reason || result.error || 'UNKNOWN'
  }

  return body
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-pesapal-signature') || request.headers.get('x-webhook-signature')
    const raw = await request.text()

    if (process.env.PESAPAL_WEBHOOK_SECRET) {
      if (!verifyWebhookSignature(signature, raw)) {
        console.error('Pesapal IPN: Invalid signature', { hasSignature: !!signature })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn('Pesapal IPN: No webhook secret configured - signature verification disabled')
    }

    const payload = raw ? JSON.parse(raw) : {}

    const result = await syncPesapalPaymentStatus({
      orderTrackingId: payload?.order_tracking_id || payload?.OrderTrackingId,
      merchantReference: payload?.merchant_reference || payload?.OrderMerchantReference,
    })

    if (!result.success) {
      console.warn('Pesapal IPN sync warning', {
        reason: result.reason,
        error: result.error,
        orderTrackingId: payload?.order_tracking_id,
        merchantReference: payload?.merchant_reference,
      })
    }

    return NextResponse.json(buildResponseBody(result))
  } catch (error) {
    console.error('Pesapal IPN error', error)
    return NextResponse.json({ status: 'success' }, { status: 200 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const result = await syncPesapalPaymentStatus({
      orderTrackingId: searchParams.get('OrderTrackingId') || searchParams.get('orderTrackingId'),
      merchantReference: searchParams.get('OrderMerchantReference') || searchParams.get('merchantReference'),
    })

    if (!result.success) {
      console.warn('Pesapal IPN GET sync warning', {
        reason: result.reason,
        error: result.error,
        orderTrackingId: result.orderTrackingId,
        merchantReference: result.merchantReference,
      })
    }

    return NextResponse.json(buildResponseBody(result))
  } catch (error) {
    console.error('Pesapal IPN GET error', error)
    return NextResponse.json({ status: 'success' }, { status: 200 })
  }
}

