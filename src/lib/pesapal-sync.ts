import { db } from '@/db'
import { payments, jobs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getAccessToken, getTransactionStatus } from './pesapal'
import { notifyPaymentReceived } from './notifications'

type PaymentRecord = typeof payments.$inferSelect

export type PesapalSyncParams = {
  orderTrackingId?: string | null
  merchantReference?: string | null
  paymentId?: number | null
}

export type PesapalSyncResult = {
  success: boolean
  reason?: 'MISSING_IDENTIFIERS' | 'PAYMENT_NOT_FOUND' | 'MISSING_TRACKING_ID' | 'STATUS_LOOKUP_FAILED'
  error?: string
  status?: 'pending' | 'completed' | 'failed'
  pesapalStatus?: string
  statusChanged?: boolean
  payment?: PaymentRecord
  statusData?: unknown
  orderTrackingId?: string
  merchantReference?: string | null
}

function normaliseIdentifier(value?: string | null) {
  return value?.trim() ? value.trim() : undefined
}

function normaliseStatus(status: string) {
  const upper = status.toUpperCase()
  if (upper === 'COMPLETED') return 'completed'
  if (['FAILED', 'CANCELLED', 'REVERSED', 'INVALID'].includes(upper)) return 'failed'
  return 'pending'
}

export async function syncPesapalPaymentStatus(params: PesapalSyncParams): Promise<PesapalSyncResult> {
  const orderTrackingId = normaliseIdentifier(params.orderTrackingId)
  const merchantReference = normaliseIdentifier(params.merchantReference)
  const paymentId = params.paymentId

  if (!orderTrackingId && !merchantReference && !paymentId) {
    return { success: false, reason: 'MISSING_IDENTIFIERS' }
  }

  try {
    let payment: PaymentRecord | undefined

    // Try payment ID first (works without schema migration)
    if (paymentId) {
      const result = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1)
      payment = result[0]
    }

    // Fallback to merchant reference
    if (!payment && merchantReference) {
      try {
        const result = await db
          .select()
          .from(payments)
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
        const result = await db
          .select()
          .from(payments)
          .where(eq(payments.orderTrackingId, orderTrackingId))
          .limit(1)
        payment = result[0]
      } catch (e) {
        console.warn('orderTrackingId column may not exist:', e)
      }
    }

    if (!payment) {
      return { success: false, reason: 'PAYMENT_NOT_FOUND', merchantReference, orderTrackingId }
    }

    const trackingId = orderTrackingId || payment.orderTrackingId
    if (!trackingId) {
      return { success: false, reason: 'MISSING_TRACKING_ID', merchantReference: payment.merchantReference }
    }

    const accessToken = await getAccessToken()
    const statusData = await getTransactionStatus(trackingId, accessToken)

    const rawStatus = statusData?.payment_status_description || statusData?.status || 'PENDING'
    const pesapalStatus = String(rawStatus)
    const newStatus = normaliseStatus(pesapalStatus)

    const parsedAmount = Number(statusData?.amount)
    const resolvedAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : Number(payment.amount || 0)

    const now = new Date().toISOString()
    const statusChanged = payment.status !== newStatus || payment.orderTrackingId !== trackingId || Number(payment.amount || 0) !== resolvedAmount

    const updateData: Record<string, unknown> = {
      status: newStatus,
      orderTrackingId: trackingId,
      amount: resolvedAmount,
      updatedAt: now,
    }

    if (newStatus === 'completed' && !payment.confirmedAt) {
      updateData.confirmedAt = now
    }

    const [updatedPayment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, payment.id))
      .returning()

    const finalPayment = updatedPayment || { ...payment, ...updateData }

    if (newStatus === 'completed' && payment.jobId) {
      await db
        .update(jobs)
        .set({ status: 'paid', paymentConfirmed: true, updatedAt: now, paidAt: now })
        .where(eq(jobs.id, payment.jobId))

      if (statusChanged) {
        try {
          const amount = Number(finalPayment.amount || resolvedAmount || 0)
          await notifyPaymentReceived(payment.clientId, amount, payment.jobId)
        } catch (notificationError) {
          console.warn('Pesapal notification error', notificationError)
        }
      }
    }

    return {
      success: true,
      status: newStatus,
      pesapalStatus,
      statusChanged,
      statusData,
      payment: finalPayment,
      orderTrackingId: trackingId,
      merchantReference: finalPayment.merchantReference || merchantReference,
    }
  } catch (error: any) {
    console.error('Pesapal sync error', error)
    return {
      success: false,
      reason: 'STATUS_LOOKUP_FAILED',
      error: error?.message || 'Unknown error',
      merchantReference,
      orderTrackingId,
    }
  }
}

