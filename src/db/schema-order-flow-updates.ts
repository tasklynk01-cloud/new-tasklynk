/**
 * ORDER FLOW ENHANCEMENT - Constants and Types
 *
 * This file contains constants and types for the order flow system.
 * Table definitions have been moved to schema.ts (PostgreSQL).
 */

// ========================================
// ORDER STATUS ENUM DEFINITION
// ========================================
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  INTERNAL_REVISION: 'internal_revision',
  EDITING: 'editing',
  DELIVERED: 'delivered',
  CLIENT_REVISION: 'client_revision',
  APPROVED: 'approved',
  PAID: 'paid',
  COMPLETED: 'completed',
  REVISION: 'revision',
  REVISION_PENDING: 'revision_pending',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// ========================================
// VALID STATUS TRANSITIONS MAP
//
// This is the SINGLE canonical source of truth for order status transitions.
// src/lib/status-transitions.ts and src/lib/job-status-transitions.ts derive
// their transition tables from this map (different call signatures, same rules)
// to prevent the four-way drift that used to exist between them.
// ========================================
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled', 'on_hold'],
  accepted: ['in_progress', 'delivered', 'cancelled', 'on_hold'],
  in_progress: ['submitted', 'editing', 'delivered', 'cancelled', 'on_hold', 'internal_revision'],
  submitted: ['editing', 'delivered', 'internal_revision', 'cancelled', 'on_hold'],
  internal_revision: ['in_progress', 'editing', 'delivered', 'cancelled', 'on_hold'],
  editing: ['delivered', 'in_progress', 'cancelled', 'on_hold', 'internal_revision'],
  delivered: ['approved', 'client_revision', 'revision', 'revision_pending', 'completed', 'cancelled', 'on_hold', 'internal_revision'],
  client_revision: ['in_progress', 'editing', 'cancelled', 'on_hold'],
  revision: ['in_progress', 'editing', 'cancelled', 'on_hold'],
  revision_pending: ['in_progress', 'editing', 'cancelled', 'on_hold'],
  approved: ['paid', 'client_revision', 'revision', 'on_hold', 'cancelled'],
  paid: ['completed', 'client_revision', 'revision'],
  completed: ['client_revision', 'revision'],
  on_hold: ['pending', 'accepted', 'in_progress', 'submitted', 'editing', 'delivered', 'approved', 'internal_revision', 'client_revision', 'revision', 'revision_pending'],
  cancelled: [],
};

// ========================================
// STATUS TRANSITION VALIDATOR
// ========================================
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Same-status "transitions" are always allowed (idempotent no-op, e.g. re-confirming a step)
  if (currentStatus === newStatus) {
    return true;
  }

  if (!(currentStatus in VALID_STATUS_TRANSITIONS)) {
    return false;
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus as OrderStatus];
  return allowedTransitions.includes(newStatus as OrderStatus);
}

// ========================================
// ADJUSTMENT TYPES ENUM
// ========================================
export const ADJUSTMENT_TYPES = {
  BONUS: 'bonus',
  FINE: 'fine',
  REVISION_DEDUCTION: 'revision_deduction',
  REVISION_RESTORATION: 'revision_restoration',
  MANUAL: 'manual',
} as const;

export type AdjustmentType = typeof ADJUSTMENT_TYPES[keyof typeof ADJUSTMENT_TYPES];
