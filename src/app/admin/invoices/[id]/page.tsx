"use client"
import { safeApiFetch } from '@/lib/client-api-helpers';
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/lib/client-api-helpers';

type InvoiceItem = {
  id: number
  orderNumber: string | null
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

type Invoice = {
  id: number
  invoiceNumber: string
  recipientId: number
  recipientRole: string
  recipientName: string
  recipientEmail: string | null
  periodStart: string
  periodEnd: string
  orderCount: number
  totalAmount: number
  currency: string
  status: string
  paymentMethod: string | null
  mpesaCode: string | null
  transactionId: string | null
  merchantReference: string | null
  confirmedAt: string | null
  paidAt: string | null
  sentAt: string | null
  notes: string | null
  createdAt: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = Number(params.id)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mpesaInput, setMpesaInput] = useState('')
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  async function fetchInvoice() {
    try {
      const res = await safeApiFetch(`/api/v2/invoices/${invoiceId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice)
        setItems(data.items)
        setMpesaInput(data.invoice.mpesaCode || '')
      } else {
        toast.error('Invoice not found')
        router.push('/admin/invoices/clients')
      }
    } catch (error) {
      console.error('Failed to fetch invoice', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendInvoice() {
    try {
      const res = await safeApiFetch(`/api/v2/invoices/${invoiceId}/send`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Invoice sent to recipient')
        fetchInvoice()
      } else {
        toast.error('Failed to send invoice')
      }
    } catch {
      toast.error('Error sending invoice')
    }
  }

  async function approveTillPayment() {
    if (!mpesaInput.trim()) {
      toast.error('Please enter the M-Pesa code')
      return
    }
    setApproving(true)
    try {
      const res = await safeApiFetch(`/api/v2/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve_till', mpesaCode: mpesaInput }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Payment approved')
        fetchInvoice()
      } else {
        toast.error(extractErrorMessage(data, 'Approval failed'))
      }
    } catch {
      toast.error('Error approving payment')
    } finally {
      setApproving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!invoice) return <div className="p-6">Invoice not found</div>

  const codeMatch = invoice.mpesaCode && mpesaInput.toUpperCase() === invoice.mpesaCode.toUpperCase()

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">To: {invoice.recipientName} ({invoice.recipientRole})</p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-medium ${
          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
          invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
          invoice.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
        }`}>
          {invoice.status.toUpperCase()}
        </span>
      </div>

      <div className="bg-card rounded-lg shadow p-6 mb-6 border border-border">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="font-medium">{invoice.periodStart.slice(0, 10)} to {invoice.periodEnd.slice(0, 10)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="font-medium">{invoice.orderCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-medium text-xl">KES {invoice.totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sent At</p>
            <p className="font-medium">{invoice.sentAt ? new Date(invoice.sentAt).toLocaleString() : '-'}</p>
          </div>
        </div>

        {invoice.notes && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden mb-6 border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm">{item.orderNumber || '-'}</td>
                <td className="px-6 py-4 text-sm">{item.description}</td>
                <td className="px-6 py-4 text-sm text-right">KES {item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 font-bold">
              <td colSpan={2} className="px-6 py-4">Total</td>
              <td className="px-6 py-4 text-right">KES {invoice.totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-lg shadow p-6 space-y-4 border border-border">
        {invoice.status === 'draft' && (
          <button onClick={sendInvoice} className="w-full py-2 bg-green-600 text-white rounded-lg">
            Send Invoice
          </button>
        )}

        {invoice.recipientRole === 'client' && invoice.status !== 'paid' && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Approve Till/POD Payment</h3>
            <p className="text-sm text-muted-foreground mb-2">Enter the M-Pesa code from the client. If it matches the code they submitted, the button will activate.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={mpesaInput}
                onChange={(e) => setMpesaInput(e.target.value.toUpperCase())}
                placeholder="Enter M-Pesa code"
                className="flex-1 border border-input bg-background rounded-lg px-3 py-2"
              />
              <button
                onClick={approveTillPayment}
                disabled={!codeMatch && !!invoice.mpesaCode || approving}
                className={`px-4 py-2 rounded-lg text-white ${
                  codeMatch || !invoice.mpesaCode ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
            </div>
            {invoice.mpesaCode && !codeMatch && (
              <p className="text-sm text-red-500 mt-1">Code does not match client's submitted code</p>
            )}
            {codeMatch && (
              <p className="text-sm text-green-600 mt-1">✓ Code matches</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
