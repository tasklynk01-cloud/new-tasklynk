import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { db } from '@/db'
import { billingInvoices, billingInvoiceItems, jobs } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET: Fetch single invoice with items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'freelancer', 'editor'])
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

    // Non-admin can only view their own invoices
    if (user.role !== 'admin' && user.role !== 'manager' && invoice.recipientId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const items = await db.select().from(billingInvoiceItems).where(eq(billingInvoiceItems.invoiceId, invoiceId))

    return NextResponse.json({ invoice, items })
  } catch (error) {
    console.error('GET invoice error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH: Update invoice (status, payment info, etc.)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'freelancer', 'editor'])
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

    const body = await request.json()
    const now = new Date().toISOString()

    // Confirmation by recipient
    if (body.action === 'confirm') {
      if (invoice.recipientId !== user.id && user.role !== 'admin') {
        return NextResponse.json({ error: 'Only recipient can confirm' }, { status: 403 })
      }
      await db.update(billingInvoices).set({
        status: 'confirmed',
        confirmedAt: now,
        confirmedBy: user.id,
        updatedAt: now,
      }).where(eq(billingInvoices.id, invoiceId))
      return NextResponse.json({ success: true, message: 'Invoice confirmed' })
    }

    // Admin approves Till payment by matching mpesaCode
    if (body.action === 'approve_till') {
      if (user.role !== 'admin' && user.role !== 'manager') {
        return NextResponse.json({ error: 'Only admin/manager can approve' }, { status: 403 })
      }
      const { mpesaCode } = body
      if (!mpesaCode) {
        return NextResponse.json({ error: 'mpesaCode required' }, { status: 400 })
      }
      // Check if codes match (admin enters the code they received)
      if (invoice.mpesaCode && invoice.mpesaCode.toUpperCase() !== mpesaCode.toUpperCase()) {
        return NextResponse.json({ error: 'M-Pesa code does not match', match: false }, { status: 400 })
      }
      await db.update(billingInvoices).set({
        status: 'paid',
        mpesaCode: mpesaCode.toUpperCase(),
        paidAt: now,
        updatedAt: now,
      }).where(eq(billingInvoices.id, invoiceId))
      return NextResponse.json({ success: true, message: 'Payment approved' })
    }

    // Mark as sent
    if (body.action === 'mark_sent') {
      if (user.role !== 'admin' && user.role !== 'manager') {
        return NextResponse.json({ error: 'Only admin/manager can mark sent' }, { status: 403 })
      }
      await db.update(billingInvoices).set({
        status: 'sent',
        sentAt: now,
        sentBy: user.id,
        updatedAt: now,
      }).where(eq(billingInvoices.id, invoiceId))
      return NextResponse.json({ success: true, message: 'Invoice marked as sent' })
    }

    // Generic update (admin only)
    if (user.role === 'admin' || user.role === 'manager') {
      const updates: Record<string, any> = { updatedAt: now }
      if (body.status) updates.status = body.status
      if (body.mpesaCode) updates.mpesaCode = body.mpesaCode
      if (body.transactionId) updates.transactionId = body.transactionId
      if (body.merchantReference) updates.merchantReference = body.merchantReference
      if (body.orderTrackingId) updates.orderTrackingId = body.orderTrackingId
      if (body.pdfUrl) updates.pdfUrl = body.pdfUrl
      if (body.notes !== undefined) updates.notes = body.notes

      await db.update(billingInvoices).set(updates).where(eq(billingInvoices.id, invoiceId))
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No valid action' }, { status: 400 })
  } catch (error) {
    console.error('PATCH invoice error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE: Remove draft invoice
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCheck = await requireRole(request, ['admin'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }
  const { id } = await params
  const invoiceId = Number(id)

  try {
    const [invoice] = await db.select().from(billingInvoices).where(eq(billingInvoices.id, invoiceId)).limit(1)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (invoice.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft invoices can be deleted' }, { status: 400 })
    }

    await db.delete(billingInvoiceItems).where(eq(billingInvoiceItems.invoiceId, invoiceId))
    await db.delete(billingInvoices).where(eq(billingInvoices.id, invoiceId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE invoice error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
