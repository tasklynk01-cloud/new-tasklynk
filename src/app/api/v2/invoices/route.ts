import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { db } from '@/db'
import { billingInvoices, billingInvoiceItems, users, jobs, invoices } from '@/db/schema'
import { eq, and, gte, lte, desc, inArray, sql } from 'drizzle-orm'
import { getManagerScopedJobIds } from '@/lib/manager-job-scope'

export const dynamic = 'force-dynamic'

// GET: List invoices with optional filters
export async function GET(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin', 'manager'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const recipientRole = searchParams.get('role') // client, freelancer, manager, editor, admin
    const recipientId = searchParams.get('recipientId')
    const status = searchParams.get('status')

    let query = db.select().from(billingInvoices).orderBy(desc(billingInvoices.createdAt))

    const conditions = []
    if (recipientRole) conditions.push(eq(billingInvoices.recipientRole, recipientRole))
    if (recipientId) conditions.push(eq(billingInvoices.recipientId, Number(recipientId)))
    if (status) conditions.push(eq(billingInvoices.status, status))

    const results = conditions.length > 0
      ? await db.select().from(billingInvoices).where(and(...conditions)).orderBy(desc(billingInvoices.createdAt))
      : await db.select().from(billingInvoices).orderBy(desc(billingInvoices.createdAt))

    return NextResponse.json(results)
  } catch (error) {
    console.error('GET invoices error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: Generate invoice(s) for a recipient
export async function POST(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin', 'manager'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }
  const adminUser = (authCheck as any).user

  try {
    const body = await request.json()
    const { recipientId, recipientRole, periodStart, periodEnd, jobIds, notes } = body

    if (!recipientId || !recipientRole || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'recipientId, recipientRole, periodStart, periodEnd required' }, { status: 400 })
    }

    // Fetch recipient
    const [recipient] = await db.select().from(users).where(eq(users.id, recipientId)).limit(1)
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Fetch jobs for this recipient within period
    let jobsForInvoice: (typeof jobs.$inferSelect)[] = []
    if (jobIds && jobIds.length > 0) {
      jobsForInvoice = await db.select().from(jobs).where(inArray(jobs.id, jobIds))
    } else {
      // Auto-select based on role
      // FIXED: Include delivered and accepted orders for clients, paid status for freelancers
      const eligibleClientStatuses = ['delivered', 'accepted', 'approved', 'paid', 'completed'] as const
      const eligibleFreelancerStatuses = ['approved', 'paid', 'completed'] as const
      const eligibleManagerStatuses = ['approved', 'paid', 'completed'] as const

      if (recipientRole === 'client') {
        jobsForInvoice = await db.select().from(jobs).where(
          and(
            eq(jobs.clientId, recipientId),
            gte(jobs.createdAt, periodStart),
            lte(jobs.createdAt, periodEnd),
            inArray(jobs.status, eligibleClientStatuses)
          )
        )
      } else if (recipientRole === 'freelancer') {
        jobsForInvoice = await db.select().from(jobs).where(
          and(
            eq(jobs.assignedFreelancerId, recipientId),
            gte(jobs.createdAt, periodStart),
            lte(jobs.createdAt, periodEnd),
            inArray(jobs.status, eligibleFreelancerStatuses)
          )
        )
      } else if (recipientRole === 'manager') {
        const managerJobIds = await getManagerScopedJobIds(recipientId)
        jobsForInvoice = managerJobIds.length === 0
          ? []
          : await db.select().from(jobs).where(
              and(
                inArray(jobs.id, managerJobIds),
                gte(jobs.createdAt, periodStart),
                lte(jobs.createdAt, periodEnd),
                inArray(jobs.status, eligibleManagerStatuses)
              )
            )
      } else {
        jobsForInvoice = []
      }
    }

    // Calculate total
    let totalAmount = 0
    const lineItems: { jobId: number; orderNumber: string; description: string; amount: number }[] = []

    for (const job of jobsForInvoice) {
      let amount = 0
      if (recipientRole === 'client') {
        amount = job.amount || 0
      } else if (recipientRole === 'freelancer') {
        amount = job.freelancerEarnings || 0
      } else if (recipientRole === 'manager') {
        amount = job.managerEarnings || 0
      }
      totalAmount += amount
      lineItems.push({
        jobId: job.id,
        orderNumber: job.orderNumber || job.displayId,
        description: job.title || `Order ${job.orderNumber}`,
        amount,
      })
    }

    // Generate invoice number
    const year = new Date().getFullYear()
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(billingInvoices)
    const count = countResult[0]?.count || 0
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`

    const now = new Date().toISOString()

    // Insert invoice
    const [newInvoice] = await db.insert(billingInvoices).values({
      invoiceNumber,
      recipientId,
      recipientRole,
      recipientName: recipient.name || recipient.email || '',
      recipientEmail: recipient.email,
      periodStart,
      periodEnd,
      orderCount: lineItems.length,
      totalAmount,
      currency: 'KES',
      status: 'draft',
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Insert line items
    for (const item of lineItems) {
      await db.insert(billingInvoiceItems).values({
        invoiceId: newInvoice.id,
        jobId: item.jobId,
        orderNumber: item.orderNumber,
        description: item.description,
        quantity: 1,
        unitPrice: item.amount,
        amount: item.amount,
        createdAt: now,
      })
    }

    // ✅ LINK LEGACY INVOICES: Mark per-order invoices with billing invoice ID
    const linkedJobIds = lineItems.map(item => item.jobId)
    if (linkedJobIds.length > 0) {
      await db.update(invoices)
        .set({ 
          billingInvoiceId: newInvoice.id, 
          updatedAt: now 
        })
        .where(inArray(invoices.jobId, linkedJobIds))
    }

    return NextResponse.json({ success: true, invoice: newInvoice })
  } catch (error) {
    console.error('POST invoice error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

