/**
 * Status Transition Validation Library
 *
 * Centralized validation for order status transitions to prevent invalid state changes.
 * Enforces business rules including internal revision blocking and valid transition paths.
 *
 * The transition table itself is derived from the single canonical source in
 * src/db/schema-order-flow-updates.ts (VALID_STATUS_TRANSITIONS) so this file
 * cannot drift out of sync with it. Only the function signatures/contract here
 * (object-returning validateStatusTransition, internal-revision blocking rules)
 * are specific to this module.
 */

import { VALID_STATUS_TRANSITIONS } from '@/db/schema-order-flow-updates';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  // 'assigned' removed - assignment goes directly to in_progress
  | 'in_progress'
  | 'submitted'
  | 'internal_revision'
  | 'editing'
  | 'delivered'
  | 'client_revision'
  | 'revision'
  | 'revision_pending'
  | 'approved'
  | 'paid'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

/**
 * Allowed status transitions map - derived from the canonical source.
 * Key: current status
 * Value: array of allowed next statuses
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = VALID_STATUS_TRANSITIONS;

/**
 * Transition validation result
 */
export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
  reason?: string;
}

/**
 * Validate a status transition
 * 
 * @param currentStatus - Current order status
 * @param newStatus - Desired new status
 * @param hasOpenInternalRevision - Whether order has open internal revision (blocks certain transitions)
 * @returns Validation result with error message if invalid
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  hasOpenInternalRevision: boolean = false
): TransitionValidationResult {
  // No transition needed
  if (currentStatus === newStatus) {
    return {
      valid: true,
    };
  }

  // Check if transition is in allowed list
  const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNextStates || !allowedNextStates.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
      reason: `Status '${currentStatus}' can only transition to: ${allowedNextStates.join(', ')}`,
    };
  }

  // Special rule: Cannot deliver or approve if open internal revision exists
  if (hasOpenInternalRevision && (newStatus === 'delivered' || newStatus === 'approved')) {
    return {
      valid: false,
      error: `Cannot transition to '${newStatus}' while open internal revision exists`,
      reason: 'All internal QC revisions must be completed before delivery or approval',
    };
  }

  // Special rule: Cannot complete editing if open internal revision exists
  if (hasOpenInternalRevision && currentStatus === 'editing' && newStatus === 'delivered') {
    return {
      valid: false,
      error: 'Cannot deliver order with open internal revision',
      reason: 'Freelancer must complete all internal QC revisions before delivery',
    };
  }

  // Special rule: Revision to editing requires revision completion
  if (currentStatus === 'revision' && newStatus === 'editing') {
    // This is valid - handled by revision submission endpoint
    return { valid: true };
  }

  // Special rule: Only payment confirmation can move from approved to paid
  if (currentStatus === 'approved' && newStatus === 'paid') {
    // Valid but should only be done through payment confirmation endpoint
    return { valid: true };
  }

  // Special rule: Only settlement can move from paid to completed
  if (currentStatus === 'paid' && newStatus === 'completed') {
    // Valid but should only be done through settlement endpoint
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending Review',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    submitted: 'Submitted for Review',
    internal_revision: 'Internal QC Revision',
    editing: 'Under Editing',
    delivered: 'Delivered',
    client_revision: 'Revision Requested',
    revision: 'Revision Requested',
    revision_pending: 'Revision Requested',
    approved: 'Approved',
    paid: 'Payment Confirmed',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Get client-facing status (hides internal QC states)
 */
export function getClientFacingStatus(
  status: OrderStatus,
  clientRequestedRevision: boolean = false
): string {
  // Hide internal QC states from clients
  if (status === 'submitted' || status === 'editing' || status === 'internal_revision') {
    return 'In Progress';
  }

  if (status === 'revision' || status === 'revision_pending' || status === 'client_revision') {
    return clientRequestedRevision ? 'Revision Requested' : 'In Progress';
  }

  if (status === 'delivered') {
    return 'Under Review';
  }

  return getStatusLabel(status);
}

/**
 * Check if status is terminal (no further transitions)
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

/**
 * Check if status allows file uploads
 */
export function allowsFileUpload(status: OrderStatus): boolean {
  return ['in_progress', 'editing', 'revision', 'revision_pending', 'client_revision', 'internal_revision'].includes(status);
}

/**
 * Check if status allows client revision requests
 */
export function allowsClientRevision(status: OrderStatus): boolean {
  return ['delivered', 'approved'].includes(status);
}

/**
 * Check if status allows internal revision requests
 */
export function allowsInternalRevision(status: OrderStatus): boolean {
  return ['editing', 'in_progress', 'submitted'].includes(status);
}

/**
 * Get all possible next statuses for current status
 */
export function getNextStatuses(
  currentStatus: OrderStatus,
  hasOpenInternalRevision: boolean = false
): OrderStatus[] {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  
  // Filter out statuses blocked by internal revision
  if (hasOpenInternalRevision) {
    return allowed.filter(status => status !== 'delivered' && status !== 'approved');
  }
  
  return allowed;
}

