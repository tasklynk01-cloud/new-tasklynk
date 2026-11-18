"use client"
import { safeApiFetch } from '@/lib/client-api-helpers';
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

type Invoice = {
  id: number
  invoiceNumber: string
  recipientId: number
  recipientName: string
  recipientEmail: string | null
  periodStart: string
  periodEnd: string
  orderCount: number
  totalAmount: number
  status: string
  sentAt: string | null
  confirmedAt: string | null
  createdAt: string
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      const res = await safeApiFetch('/api/v2/invoices?role=admin', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Failed to fetch invoices', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendInvoice(id: number) {
    try {
      const res = await safeApiFetch(`/api/v2/invoices/${id}/send`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Invoice sent')
        fetchInvoices()
      } else {
        toast.error('Failed to send invoice')
      }
    } catch {
      toast.error('Error sending invoice')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Invoices</h1>
        <Link href="/admin/invoices/admin/generate" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Generate Invoice
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  <Link href={`/admin/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{inv.recipientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {inv.periodStart.slice(0, 10)} - {inv.periodEnd.slice(0, 10)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{inv.orderCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">KES {inv.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    inv.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link href={`/admin/invoices/${inv.id}`} className="text-blue-600 hover:underline mr-3">View</Link>
                  {inv.status === 'draft' && (
                    <button onClick={() => sendInvoice(inv.id)} className="text-green-600 hover:underline">Send</button>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">No invoices found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
