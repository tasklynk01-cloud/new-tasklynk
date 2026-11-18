"use client"
import { safeApiFetch } from '@/lib/client-api-helpers';
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
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

export default function ConfirmInvoicePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = Number(params.id)
  const token = searchParams.get('token')

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  async function fetchInvoice() {
    try {
      const res = await safeApiFetch(`/api/v2/invoices/${invoiceId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice)
        if (data.invoice.status === 'confirmed' || data.invoice.status === 'paid') {
          setConfirmed(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch invoice', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setConfirming(true)
    try {
      const res = await safeApiFetch(`/api/v2/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'confirm' }),
      })
      if (res.ok) {
        toast.success('Invoice confirmed')
        setConfirmed(true)
      } else {
        const err = await res.json()
        toast.error(extractErrorMessage(err, 'Failed to confirm'))
      }
    } catch {
      toast.error('Error confirming invoice')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>
  if (!invoice) return <div className="p-6 text-center">Invoice not found</div>

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h1 className="text-2xl font-bold mb-4">Confirm Invoice</h1>
        <div className="space-y-2 mb-6">
          <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Period:</strong> {invoice.periodStart.slice(0, 10)} to {invoice.periodEnd.slice(0, 10)}</p>
          <p><strong>Orders:</strong> {invoice.orderCount}</p>
          <p><strong>Total Amount:</strong> KES {invoice.totalAmount.toLocaleString()}</p>
          <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${
            invoice.status === 'confirmed' || invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>{invoice.status.toUpperCase()}</span></p>
        </div>

        {confirmed ? (
          <div className="text-center text-green-600 font-medium">
            ✓ Invoice has been confirmed
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {confirming ? 'Confirming...' : 'Confirm Invoice'}
          </button>
        )}
      </div>
    </div>
  )
}
