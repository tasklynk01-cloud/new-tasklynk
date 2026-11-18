"use client"
import { safeApiFetch } from '@/lib/client-api-helpers';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/lib/client-api-helpers';

type Client = {
  id: number
  name: string
  email: string
  paymentTerms: string
}

export default function GenerateClientInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [selectedClient, setSelectedClient] = useState<number | null>(null)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const res = await safeApiFetch('/api/users?role=client', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setClients(data.users || data)
      }
    } catch (error) {
      console.error('Failed to fetch clients', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient || !periodStart || !periodEnd) {
      toast.error('Please fill all required fields')
      return
    }

    setGenerating(true)
    try {
      const res = await safeApiFetch('/api/v2/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: selectedClient,
          recipientRole: 'client',
          periodStart,
          periodEnd,
          notes,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Invoice generated')
        router.push(`/admin/invoices/${data.invoice.id}`)
      } else {
        const err = await res.json()
        toast.error(extractErrorMessage(err, 'Failed to generate invoice'))
      }
    } catch {
      toast.error('Error generating invoice')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="p-6">Loading clients...</div>

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Generate Client Invoice</h1>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Client</label>
          <select
            value={selectedClient || ''}
            onChange={(e) => setSelectedClient(Number(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-input/30"
            required
          >
            <option value="">-- Select --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.email} ({c.paymentTerms?.toUpperCase() || 'POD'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Period Start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-input/30"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-input/30"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-input/30"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Invoice'}
        </button>
      </form>
    </div>
  )
}
