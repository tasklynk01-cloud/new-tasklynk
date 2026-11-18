import { db } from '@/db';
import { balances, jobs, users } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { SessionData, SessionAssignmentCounts, SessionApprovalInfo, UserRole } from '@/lib/session';

export type DbUserRecord = typeof users.$inferSelect;

const ACTIVE_FREELANCER_STATUSES = ['in_progress', 'editing', 'revision', 'on_hold', 'delivered'] as const;

export async function buildSessionUserData(
  user: DbUserRecord,
  sessionRole: UserRole
): Promise<SessionData> {
  // IMPORTANT: Use database role as source of truth, not session role
  // This ensures that if admin changes user role, it takes effect immediately
  const role = (user.role as UserRole) || sessionRole;
  
  const normalizedStatus = normalizeStatus(user, role);
  const approvalInfo: SessionApprovalInfo = {
    status: normalizedStatus.status,
    label: normalizedStatus.label,
    approved: Boolean(user.approved),
    emailVerified: Boolean(user.emailVerified),
    reason: user.rejectionReason || user.suspensionReason || user.blacklistReason || null,
    blocked: ['blacklisted', 'suspended'].includes(normalizedStatus.status),
  };

  const assignmentCounts = role === 'freelancer'
    ? await getFreelancerAssignmentCounts(Number(user.id))
    : undefined;

  // Single source of truth for worker payouts: balances.availableBalance
  // NOTE: Clients use users.balance as a budget-like field in parts of the UI.
  let sessionBalance = Number(user.balance || 0);
  if (role === 'freelancer' || role === 'manager') {
    const [balanceRow] = await db
      .select({ availableBalance: balances.availableBalance })
      .from(balances)
      .where(eq(balances.userId, Number(user.id)))
      .limit(1);
    sessionBalance = Number(balanceRow?.availableBalance || 0);
  }

  return {
    id: Number(user.id),
    email: String(user.email),
    name: String(user.name),
    role,
    approved: Boolean(user.approved),
    status: normalizedStatus.status,
    statusLabel: normalizedStatus.label,
    balance: sessionBalance,
    rating: typeof user.rating === 'number' ? Number(user.rating) : undefined,
    phone: user.phone ? String(user.phone) : undefined,
    profilePicture: user.profilePictureUrl || null,
    displayId: user.displayId || undefined,
    emailVerified: Boolean(user.emailVerified),
    approval: approvalInfo,
    assignmentCounts,
    hasPendingAssignments: assignmentCounts ? assignmentCounts.pendingResponse > 0 : false,
    clientTier: user.clientTier || null,
    clientPriority: user.clientPriority || null,
    freelancerBadge: user.freelancerBadge || null,
    accountName: user.accountName || null,
    presenceStatus: user.presenceStatus || null,
    assignedManagerId: user.assignedManagerId ? Number(user.assignedManagerId) : null,
    domainId: user.domainId ? Number(user.domainId) : null,
    accountId: user.accountId ? Number(user.accountId) : null,
  };
}

function normalizeStatus(user: DbUserRecord, role: UserRole) {
  const raw = String(user.status || '').trim().toLowerCase();
  let status = raw || 'pending';

  const blockedStatuses = ['blacklisted', 'suspended', 'rejected'];
  if (!blockedStatuses.includes(status)) {
    if (role === 'client' || role === 'account_owner') {
      if (user.approved) {
        status = 'active';
      } else if (user.emailVerified) {
        status = 'pending_verification';
      }
    }

    if (role === 'freelancer' && user.approved && ['pending', 'awaiting_approval'].includes(status)) {
      status = 'active';
    }
  }

  const label = status
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return { status, label };
}

async function getFreelancerAssignmentCounts(freelancerId: number): Promise<SessionAssignmentCounts> {
  // NOTE: Orders now go directly to in_progress with freelancerResponsePending=true when assigned
  const pendingPromise = db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(jobs)
    .where(
      and(
        eq(jobs.assignedFreelancerId, freelancerId),
        eq(jobs.status, 'in_progress'),
        eq(jobs.freelancerResponsePending, true)
      )
    );

  // Count of orders in progress that have been accepted
  const acceptedInProgressPromise = db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(jobs)
    .where(
      and(
        eq(jobs.assignedFreelancerId, freelancerId),
        eq(jobs.status, 'in_progress'),
        eq(jobs.freelancerResponsePending, false)
      )
    );

  const activePromise = db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(jobs)
    .where(
      and(
        eq(jobs.assignedFreelancerId, freelancerId),
        inArray(jobs.status, ACTIVE_FREELANCER_STATUSES)
      )
    );

  const [pendingRow, acceptedRow, activeRow] = await Promise.all([pendingPromise, acceptedInProgressPromise, activePromise]);
  const pending = pendingRow?.[0]?.count ?? 0;
  const acceptedInProgress = acceptedRow?.[0]?.count ?? 0;
  const activeWork = activeRow?.[0]?.count ?? 0;
  const active = acceptedInProgress + activeWork;

  return {
    pendingResponse: pending,
    active,
    total: pending + active,
  };
}

