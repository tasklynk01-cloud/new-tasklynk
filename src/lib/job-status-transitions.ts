/**
 * 🔄 FIX #22: Missing Job Status Validation
 * Validate job status transitions to prevent invalid state changes
 *
 * The transition table is derived from the single canonical source in
 * src/db/schema-order-flow-updates.ts (VALID_STATUS_TRANSITIONS), filtered
 * down to the subset of statuses this legacy module recognizes, so it can't
 * drift out of sync with the newer v2 order-lifecycle rules.
 */

import { VALID_STATUS_TRANSITIONS, type OrderStatus } from '@/db/schema-order-flow-updates';

export type JobStatus =
  | 'pending'
  | 'accepted'  // ✅ Added accepted status for manager/admin approval
  // 'assigned' removed - assignment goes directly to in_progress
  | 'in_progress'
  | 'delivered'
  | 'revision'
  | 'revision_pending'
  | 'approved'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'editing'; // QA/review stage

const JOB_STATUSES: JobStatus[] = [
  'pending', 'accepted', 'in_progress', 'delivered', 'revision',
  'revision_pending', 'approved', 'paid', 'completed', 'cancelled', 'editing',
];

/**
 * Valid job status transitions map - derived from the canonical source,
 * restricted to statuses this legacy module knows about.
 * Each key is a current status, and the array contains valid next statuses
 */
export const VALID_JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = JOB_STATUSES.reduce(
  (acc, status) => {
    const canonical = VALID_STATUS_TRANSITIONS[status as OrderStatus] || [];
    acc[status] = canonical.filter((s): s is JobStatus => JOB_STATUSES.includes(s as JobStatus));
    return acc;
  },
  {} as Record<JobStatus, JobStatus[]>
);

/**
 * Validate if a status transition is allowed
 * @param oldStatus Current job status
 * @param newStatus Desired new status
 * @returns true if transition is valid, false otherwise
 */
export function validateStatusTransition(
  oldStatus: string,
  newStatus: string
): boolean {
  // If statuses are the same, allow (idempotent)
  if (oldStatus === newStatus) {
    return true;
  }

  const validTransitions = VALID_JOB_STATUS_TRANSITIONS[oldStatus as JobStatus];

  if (!validTransitions) {
    console.error(`Invalid current status: ${oldStatus}`);
    return false;
  }

  return validTransitions.includes(newStatus as JobStatus);
}

/**
 * Get human-readable error message for invalid transition
 */
export function getTransitionError(
  oldStatus: string,
  newStatus: string
): string {
  const validTransitions = VALID_JOB_STATUS_TRANSITIONS[oldStatus as JobStatus];

  if (!validTransitions) {
    return `Invalid current status: ${oldStatus}`;
  }

  return `Cannot transition from "${oldStatus}" to "${newStatus}". Valid transitions: ${validTransitions.join(', ')}`;
}

/**
 * Get all valid next statuses for a given current status
 */
export function getValidNextStatuses(currentStatus: string): JobStatus[] {
  return VALID_JOB_STATUS_TRANSITIONS[currentStatus as JobStatus] || [];
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: string): boolean {
  const validTransitions = VALID_JOB_STATUS_TRANSITIONS[status as JobStatus];
  return validTransitions ? validTransitions.length === 0 : false;
}

