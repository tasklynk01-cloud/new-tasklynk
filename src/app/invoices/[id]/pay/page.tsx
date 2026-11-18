"use client"
import { safeApiFetch } from '@/lib/client-api-helpers';
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/lib/client-api-helpers';

type Invoice = {
  id: number
  invoiceNumber: string
  recipientRole: string
  recipientName: string
  periodStart: string
  periodEnd: string
  orderCount: number
  totalAmount: number
  status: string
}

export default function PayInvoicePage() {
  const params = useParams()
  const invoiceId = Number(params.id)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  async function fetchInvoice() {
    try {
      const res = await safeApiFetch(`/api/v2/invoices/${invoiceId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice)
      }
    } catch (error) {
      console.error('Failed to fetch invoice', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!phone) {
      toast.error('Please enter your phone number')
      return
    }

    setPaying(true)
    setMessage('')

    try {
      const res = await safeApiFetch(`/api/v2/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: phone }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`STK Push sent! Reference: ${data.merchantReference}`)
        toast.success('Check your phone for M-Pesa prompt')
      } else {
        toast.error(extractErrorMessage(data, 'Failed to initiate payment'))
      }
    } catch {
      toast.error('Error initiating payment')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>
  if (!invoice) return <div className="p-6 text-center">Invoice not found</div>

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Invoice Paid</h1>
          <p className="text-gray-600">Thank you for your payment!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h1 className="text-2xl font-bold mb-4">Pay Invoice</h1>
        <div className="space-y-2 mb-6">
          <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Period:</strong> {invoice.periodStart.slice(0, 10)} to {invoice.periodEnd.slice(0, 10)}</p>
          <p><strong>Orders:</strong> {invoice.orderCount}</p>
          <p className="text-xl font-bold">Amount: KES {invoice.totalAmount.toLocaleString()}</p>
        </div>

        <form onSubmit={handlePay}>
          <label className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="2547XXXXXXXX"
            className="w-full border rounded-lg px-3 py-2 mb-4"
            required
          />
          <button
            type="submit"
            disabled={paying}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {paying ? 'Processing...' : `Pay KES ${invoice.totalAmount.toLocaleString()} via M-Pesa`}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-green-600">{message}</p>
        )}
      </div>
    </div>
  )
}
