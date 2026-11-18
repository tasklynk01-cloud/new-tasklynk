"use client"
import { safeApiFetch } from '@/lib/client-api-helpers';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/lib/client-api-helpers';

type User = {
  id: number
  name: string
  email: string
}

export default function GenerateEditorInvoicePage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await safeApiFetch('/api/users?role=editor', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || data)
      }
    } catch (error) {
      console.error('Failed to fetch users', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser || !periodStart || !periodEnd) {
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
          recipientId: selectedUser,
          recipientRole: 'editor',
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

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Generate Editor Invoice</h1>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Editor</label>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(Number(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-input/30"
            required
          >
            <option value="">-- Select --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
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
