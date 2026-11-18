import { NextRequest, NextResponse } from 'next/server'
import { syncPesapalPaymentStatus } from '@/lib/pesapal-sync'

export const dynamic = 'force-dynamic'

function resolveRedirectBase() {
  const explicit = process.env.PESAPAL_CALLBACK_REDIRECT_URL
  if (explicit) return explicit

  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke').replace(/\/$/, '')
  return `${base}/client/financial-overview`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const result = await syncPesapalPaymentStatus({
    orderTrackingId: searchParams.get('OrderTrackingId') || searchParams.get('orderTrackingId'),
    merchantReference: searchParams.get('OrderMerchantReference') || searchParams.get('merchantReference'),
  })

  let redirectTarget = resolveRedirectBase()
  try {
    const url = new URL(redirectTarget)
    const status = result.status || 'pending'

    url.searchParams.set('pesapalStatus', status)
    if (result.merchantReference) url.searchParams.set('merchantReference', result.merchantReference)
    if (result.orderTrackingId) url.searchParams.set('orderTrackingId', result.orderTrackingId)

    if (!result.success) {
      if (result.reason) url.searchParams.set('pesapalReason', result.reason)
      if (result.error) url.searchParams.set('pesapalError', result.error)
    }

    redirectTarget = url.toString()
  } catch (error) {
    console.error('Pesapal callback redirect error', error)
  }

  return NextResponse.redirect(redirectTarget, { status: 302 })
}

