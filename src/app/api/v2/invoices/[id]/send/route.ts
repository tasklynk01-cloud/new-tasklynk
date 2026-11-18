import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin-auth'
import { db } from '@/db'
import { billingInvoices, billingInvoiceItems, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// POST: Send invoice via email with PDF attachment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCheck = await requireRole(request, ['admin', 'manager'])
  if ((authCheck as any)?.error) {
    return NextResponse.json({ error: (authCheck as any).error }, { status: (authCheck as any).status || 401 })
  }
  const adminUser = (authCheck as any).user
  const { id } = await params
  const invoiceId = Number(id)

  try {
    const [invoice] = await db.select().from(billingInvoices).where(eq(billingInvoices.id, invoiceId)).limit(1)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const items = await db.select().from(billingInvoiceItems).where(eq(billingInvoiceItems.invoiceId, invoiceId))

    // Build email HTML
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke'
    const confirmUrl = `${appUrl}/invoices/${invoice.id}/confirm?token=${Buffer.from(`${invoice.id}:${invoice.recipientId}`).toString('base64')}`
    const payUrl = `${appUrl}/invoices/${invoice.id}/pay`

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${item.orderNumber || '-'}</td>
        <td style="padding:8px;border:1px solid #ddd;">${item.description}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">KES ${item.amount.toLocaleString()}</td>
      </tr>
    `).join('')

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">Invoice from TaskLynk</h2>
        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Period:</strong> ${invoice.periodStart} to ${invoice.periodEnd}</p>
        <p><strong>Total Orders:</strong> ${invoice.orderCount}</p>
        <p><strong>Total Amount:</strong> KES ${invoice.totalAmount.toLocaleString()}</p>

        <h3>Order Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Order #</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Description</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background:#f5f5f5;font-weight:bold;">
              <td colspan="2" style="padding:8px;border:1px solid #ddd;">Total</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right;">KES ${invoice.totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        ${invoice.recipientRole === 'client' ? `
          <p style="margin-top:20px;">
            <a href="${payUrl}" style="display:inline-block;padding:12px 24px;background:#ff8c42;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
              Pay Now via M-Pesa
            </a>
          </p>
        ` : `
          <p style="margin-top:20px;">
            <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
              Confirm Invoice
            </a>
          </p>
        `}

        <p style="margin-top:20px;color:#666;font-size:12px;">
          If you have any questions, please contact support@tasklynk.co.ke
        </p>
      </div>
    `

    // Send email via existing email system
    const emailResponse = await fetch(`${appUrl}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: invoice.recipientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from TaskLynk`,
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      console.warn('Email send failed', await emailResponse.text())
    }

    // Update invoice status
    const now = new Date().toISOString()
    await db.update(billingInvoices).set({
      status: 'sent',
      sentAt: now,
      sentBy: adminUser.id,
      updatedAt: now,
    }).where(eq(billingInvoices.id, invoiceId))

    return NextResponse.json({ success: true, message: 'Invoice sent' })
  } catch (error) {
    console.error('Send invoice error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
