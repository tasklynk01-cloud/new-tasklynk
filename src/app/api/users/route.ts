import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users as usersTable } from '@/db/schema'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { requireRole } from '@/lib/admin-auth'
import { handleOptions, createErrorResponse, handleDatabaseError } from '@/lib/api-helpers'
import { withRetry } from '@/lib/db-retry'
import { logApiError } from '@/lib/error-logger'

const ROLE_NAMES: Record<number, string> = {
  1: 'admin',
  2: 'client',
  3: 'manager',
  4: 'freelancer',
  5: 'editor',
  6: 'account_owner',
}

function normalizeStatus(raw: unknown): 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'blacklisted' {
  const s = String(raw || '').trim().toLowerCase()
  if (['approved', 'active'].includes(s)) return s as 'approved' | 'active'
  if (['pending', 'awaiting_approval', 'awaiting-approval', 'unverified', 'new', 'inactive', 'not_approved'].includes(s)) return 'pending'
  if (s === 'rejected') return 'rejected'
  if (s === 'suspended') return 'suspended'
  if (s === 'blacklisted') return 'blacklisted'
  return 'pending'
}

type FreelancerBadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'elite'
type ClientTierLevel = 'basic' | 'silver' | 'gold' | 'platinum'
type ClientPriorityLevel = 'regular' | 'priority' | 'vip'

function normalizeFreelancerBadge(raw: unknown): FreelancerBadgeLevel | null {
  if (!raw) return null
  const value = String(raw).trim().toLowerCase()
  const sanitized = value
    .replace(/badge|level|tier/g, '')
    .replace(/[_\-\s]+/g, '')

  const map: Record<string, FreelancerBadgeLevel> = {
    bronze: 'bronze',
    bronzeplus: 'bronze',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
    elite: 'elite',
    eliteplus: 'elite',
  }

  return map[sanitized] ?? null
}

function normalizeClientTier(raw: unknown): ClientTierLevel | null {
  if (!raw) return null
  const value = String(raw).trim().toLowerCase()
  const sanitized = value.replace(/[_\-\s]+/g, '')

  const map: Record<string, ClientTierLevel> = {
    basic: 'basic',
    standard: 'basic',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
    premium: 'platinum',
  }

  return map[sanitized] ?? 'basic'
}

function normalizeClientPriority(raw: unknown): ClientPriorityLevel {
  if (!raw) return 'regular'
  const value = String(raw).trim().toLowerCase()
  const sanitized = value.replace(/[_\-\s]+/g, '')

  const map: Record<string, ClientPriorityLevel> = {
    regular: 'regular',
    standard: 'regular',
    priority: 'priority',
    high: 'priority',
    vip: 'vip',
    premium: 'vip',
  }

  return map[sanitized] ?? 'regular'
}

export async function GET(request: NextRequest) {
  // 🔒 AUTHENTICATION: Require admin or manager role
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return createErrorResponse(authCheck.error, 'UNAUTHORIZED', authCheck.status || 401);
  }

  const { searchParams } = new URL(request.url)
  const roleParam = searchParams.get('role')
  const approvedParam = searchParams.get('approved')
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam) || 500, 1000) : 500
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const conditions: any[] = []

  if (roleParam) {
    const roles = roleParam
      .split(',')
      .map((r) => r.trim().toLowerCase())
      .filter((r) => ['admin', 'client', 'freelancer', 'manager', 'account_owner', 'editor'].includes(r))

    if (roles.length > 0) {
      // Special handling: if asking for account_owner in some pages, include clients too when needed
      const includeClientsWithAccountOwners = roles.length === 1 && roles[0] === 'account_owner'
      if (includeClientsWithAccountOwners) {
        conditions.push(or(eq(usersTable.role, 'account_owner'), eq(usersTable.role, 'client')))
      } else {
        conditions.push(inArray(usersTable.role, roles as any))
      }
    }
  }

  if (approvedParam !== null) {
    const approved = approvedParam === 'true'
    conditions.push(eq(usersTable.approved, approved))
  }

  const rows = await db
    .select({
      id: usersTable.id,
      displayId: usersTable.displayId,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      phone: usersTable.phone,
      status: usersTable.status,
      approved: usersTable.approved,
      rating: usersTable.rating,
      assignedManagerId: usersTable.assignedManagerId,
      balance: usersTable.balance,
      totalSpent: usersTable.totalSpent,
      completedJobs: usersTable.completedJobs,
      clientTier: usersTable.clientTier,
      clientPriority: usersTable.clientPriority,
      freelancerBadge: usersTable.freelancerBadge,
      accountName: usersTable.accountName,
      paymentTerms: usersTable.paymentTerms,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.id))
    .limit(limit)
    .offset(offset)

  const data = rows.map((row) => {
    const statusNorm = normalizeStatus(row.status)

    let displayStatus: string = statusNorm;
    if (statusNorm === 'suspended' || statusNorm === 'rejected' || statusNorm === 'blacklisted') {
      displayStatus = statusNorm;
    } else {
      const isApproved = Boolean(row.approved) || statusNorm === 'active' || statusNorm === 'approved'
      displayStatus = isApproved && statusNorm !== 'pending' ? 'approved' : statusNorm;
    }

    const isApproved = displayStatus === 'approved' || displayStatus === 'active' || Boolean(row.approved && statusNorm !== 'pending')

    return {
      id: row.id,
      displayId: row.displayId || `U-${row.id}`,
      email: row.email,
      name: row.name,
      role: String(row.role || 'client'),
      approved: Boolean(row.approved),
      balance: row.balance ?? 0,
      rating: Number(row.rating ?? 0),
      phone: row.phone ?? null,
      status: statusNorm,
      assignedManagerId: row.assignedManagerId ?? null,
      totalSpent: row.totalSpent ?? 0,
      completedJobs: row.completedJobs ?? 0,
      clientTier: normalizeClientTier(row.clientTier),
      clientPriority: normalizeClientPriority(row.clientPriority),
      freelancerBadge: normalizeFreelancerBadge(row.freelancerBadge),
      accountName: row.accountName ?? null,
      paymentTerms: row.paymentTerms || 'pod',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })

  return NextResponse.json(data, { status: 200 })
}

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions();
}

