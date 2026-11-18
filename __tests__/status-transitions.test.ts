/**
 * Unit tests for status-transitions.ts
 * Tests all status transition validation logic to prevent invalid state changes
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateStatusTransition,
  getStatusLabel,
  getClientFacingStatus,
  isTerminalStatus,
  allowsFileUpload,
  allowsClientRevision,
  allowsInternalRevision,
  getNextStatuses,
  ALLOWED_TRANSITIONS,
  type OrderStatus,
} from '@/lib/status-transitions';

describe('Status Transitions - Allowed Transitions Map', () => {
  it('should define all valid transitions from pending', () => {
    expect(ALLOWED_TRANSITIONS.pending).toEqual(['accepted', 'cancelled']);
  });

  it('should define all valid transitions from accepted', () => {
    expect(ALLOWED_TRANSITIONS.accepted).toContain('assigned');
    expect(ALLOWED_TRANSITIONS.accepted).toContain('on_hold');
    expect(ALLOWED_TRANSITIONS.accepted).toContain('cancelled');
  });

  it('should define all valid transitions from assigned', () => {
    expect(ALLOWED_TRANSITIONS.assigned).toContain('in_progress');
    expect(ALLOWED_TRANSITIONS.assigned).toContain('accepted');
    expect(ALLOWED_TRANSITIONS.assigned).toContain('on_hold');
  });

  it('should define all valid transitions from in_progress', () => {
    expect(ALLOWED_TRANSITIONS.in_progress).toContain('editing');
    expect(ALLOWED_TRANSITIONS.in_progress).toContain('on_hold');
  });

  it('should define all valid transitions from editing', () => {
    expect(ALLOWED_TRANSITIONS.editing).toContain('delivered');
    expect(ALLOWED_TRANSITIONS.editing).toContain('revision');
  });

  it('should define all valid transitions from delivered', () => {
    expect(ALLOWED_TRANSITIONS.delivered).toContain('approved');
    expect(ALLOWED_TRANSITIONS.delivered).toContain('revision');
  });

  it('should allow revision to go back to editing', () => {
    expect(ALLOWED_TRANSITIONS.revision).toContain('editing');
  });

  it('should have no transitions from terminal states', () => {
    expect(ALLOWED_TRANSITIONS.completed).toEqual([]);
    expect(ALLOWED_TRANSITIONS.cancelled).toEqual([]);
  });
});

describe('Status Transitions - Basic Validation', () => {
  it('should allow valid transition from pending to accepted', () => {
    const result = validateStatusTransition('pending', 'accepted', false);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should allow valid transition from accepted to assigned', () => {
    const result = validateStatusTransition('accepted', 'assigned', false);
    expect(result.valid).toBe(true);
  });

  it('should allow valid transition from assigned to in_progress', () => {
    const result = validateStatusTransition('assigned', 'in_progress', false);
    expect(result.valid).toBe(true);
  });

  it('should allow valid transition from in_progress to editing', () => {
    const result = validateStatusTransition('in_progress', 'editing', false);
    expect(result.valid).toBe(true);
  });

  it('should allow valid transition from editing to delivered', () => {
    const result = validateStatusTransition('editing', 'delivered', false);
    expect(result.valid).toBe(true);
  });

  it('should allow valid transition from delivered to approved', () => {
    const result = validateStatusTransition('delivered', 'approved', false);
    expect(result.valid).toBe(true);
  });

  it('should allow valid transition from approved to paid', () => {
    const result = validateStatusTransition('approved', 'paid', false);
    expect(result.valid).toBe(true);
  });

  it('should allow valid transition from paid to completed', () => {
    const result = validateStatusTransition('paid', 'completed', false);
    expect(result.valid).toBe(true);
  });

  it('should allow same status transition (no change)', () => {
    const result = validateStatusTransition('pending', 'pending', false);
    expect(result.valid).toBe(true);
  });
});

describe('Status Transitions - Invalid Transitions', () => {
  it('should reject direct transition from pending to completed', () => {
    const result = validateStatusTransition('pending', 'completed', false);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid status transition');
    expect(result.reason).toBeDefined();
  });

  it('should reject transition from pending to in_progress', () => {
    const result = validateStatusTransition('pending', 'in_progress', false);
    expect(result.valid).toBe(false);
  });

  it('should reject backwards transition from delivered to pending', () => {
    const result = validateStatusTransition('delivered', 'pending', false);
    expect(result.valid).toBe(false);
  });

  it('should reject transition from completed to any other status', () => {
    const result = validateStatusTransition('completed', 'pending', false);
    expect(result.valid).toBe(false);
  });

  it('should reject transition from cancelled to any other status', () => {
    const result = validateStatusTransition('cancelled', 'pending', false);
    expect(result.valid).toBe(false);
  });

  it('should provide helpful error messages', () => {
    const result = validateStatusTransition('pending', 'delivered', false);
    expect(result.error).toBe("Invalid status transition from 'pending' to 'delivered'");
    expect(result.reason).toContain('pending');
    expect(result.reason).toContain('can only transition to');
  });
});

describe('Status Transitions - Internal Revision Blocking', () => {
  it('should block editing → delivered when internal revision is open', () => {
    const result = validateStatusTransition('editing', 'delivered', true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('open internal revision');
  });

  it('should allow editing → delivered when no internal revision', () => {
    const result = validateStatusTransition('editing', 'delivered', false);
    expect(result.valid).toBe(true);
  });

  it('should block delivered → approved when internal revision is open', () => {
    const result = validateStatusTransition('delivered', 'approved', true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('open internal revision');
  });

  it('should allow delivered → approved when no internal revision', () => {
    const result = validateStatusTransition('delivered', 'approved', false);
    expect(result.valid).toBe(true);
  });

  it('should allow other transitions even with open internal revision', () => {
    // Internal revision shouldn't block non-delivery transitions
    const result1 = validateStatusTransition('in_progress', 'editing', true);
    expect(result1.valid).toBe(true);

    const result2 = validateStatusTransition('editing', 'revision', true);
    expect(result2.valid).toBe(true);
  });
});

describe('Status Transitions - Revision Workflows', () => {
  it('should allow delivered → revision for client revisions', () => {
    const result = validateStatusTransition('delivered', 'revision', false);
    expect(result.valid).toBe(true);
  });

  it('should allow editing → revision for internal QC', () => {
    const result = validateStatusTransition('editing', 'revision', false);
    expect(result.valid).toBe(true);
  });

  it('should allow revision → editing when revision is completed', () => {
    const result = validateStatusTransition('revision', 'editing', false);
    expect(result.valid).toBe(true);
  });

  it('should allow approved → revision for post-approval changes', () => {
    const result = validateStatusTransition('approved', 'revision', false);
    expect(result.valid).toBe(true);
  });
});

describe('Status Transitions - On Hold Workflow', () => {
  it('should allow most statuses to go on_hold', () => {
    // Statuses that can go on hold (pending cannot)
    const statuses: OrderStatus[] = ['accepted', 'assigned', 'in_progress', 'editing', 'delivered', 'approved', 'revision'];
    
    statuses.forEach(status => {
      const result = validateStatusTransition(status, 'on_hold', false);
      expect(result.valid).toBe(true);
    });
    
    // Pending should NOT go to on_hold (goes to accepted or cancelled only)
    const pendingResult = validateStatusTransition('pending', 'on_hold', false);
    expect(pendingResult.valid).toBe(false);
  });

  it('should allow on_hold to resume to various statuses', () => {
    const result1 = validateStatusTransition('on_hold', 'pending', false);
    expect(result1.valid).toBe(true);

    const result2 = validateStatusTransition('on_hold', 'in_progress', false);
    expect(result2.valid).toBe(true);

    const result3 = validateStatusTransition('on_hold', 'delivered', false);
    expect(result3.valid).toBe(true);
  });
});

describe('Status Transitions - Helper Functions', () => {
  it('should provide correct status labels', () => {
    expect(getStatusLabel('pending')).toBe('Pending Review');
    expect(getStatusLabel('accepted')).toBe('Accepted');
    expect(getStatusLabel('in_progress')).toBe('In Progress');
    expect(getStatusLabel('delivered')).toBe('Delivered');
    expect(getStatusLabel('completed')).toBe('Completed');
  });

  it('should identify terminal statuses correctly', () => {
    expect(isTerminalStatus('completed')).toBe(true);
    expect(isTerminalStatus('cancelled')).toBe(true);
    expect(isTerminalStatus('pending')).toBe(false);
    expect(isTerminalStatus('delivered')).toBe(false);
  });

  it('should identify statuses that allow file uploads', () => {
    expect(allowsFileUpload('in_progress')).toBe(true);
    expect(allowsFileUpload('editing')).toBe(true);
    expect(allowsFileUpload('revision')).toBe(true);
    expect(allowsFileUpload('pending')).toBe(false);
    expect(allowsFileUpload('completed')).toBe(false);
  });

  it('should identify statuses that allow client revisions', () => {
    expect(allowsClientRevision('delivered')).toBe(true);
    expect(allowsClientRevision('approved')).toBe(true);
    expect(allowsClientRevision('pending')).toBe(false);
    expect(allowsClientRevision('in_progress')).toBe(false);
  });

  it('should identify statuses that allow internal revisions', () => {
    expect(allowsInternalRevision('editing')).toBe(true);
    expect(allowsInternalRevision('in_progress')).toBe(true);
    expect(allowsInternalRevision('delivered')).toBe(false);
    expect(allowsInternalRevision('approved')).toBe(false);
  });
});

describe('Status Transitions - Client-Facing Status', () => {
  it('should hide editing status from clients', () => {
    expect(getClientFacingStatus('editing', false)).toBe('In Progress');
  });

  it('should hide internal revisions from clients', () => {
    expect(getClientFacingStatus('revision', false)).toBe('In Progress');
  });

  it('should show client revisions to clients', () => {
    expect(getClientFacingStatus('revision', true)).toBe('Revision Requested');
  });

  it('should show delivered as "Under Review"', () => {
    expect(getClientFacingStatus('delivered', false)).toBe('Under Review');
  });

  it('should show other statuses normally to clients', () => {
    expect(getClientFacingStatus('pending', false)).toBe('Pending Review');
    expect(getClientFacingStatus('accepted', false)).toBe('Accepted');
    expect(getClientFacingStatus('completed', false)).toBe('Completed');
  });
});

describe('Status Transitions - Get Next Statuses', () => {
  it('should return correct next statuses without internal revision', () => {
    const next = getNextStatuses('pending', false);
    expect(next).toContain('accepted');
    expect(next).toContain('cancelled');
  });

  it('should filter out delivered when internal revision is open', () => {
    const next = getNextStatuses('editing', true);
    expect(next).not.toContain('delivered');
    expect(next).toContain('revision');
    expect(next).toContain('on_hold');
  });

  it('should include delivered when no internal revision', () => {
    const next = getNextStatuses('editing', false);
    expect(next).toContain('delivered');
  });

  it('should filter out approved when internal revision is open', () => {
    const next = getNextStatuses('delivered', true);
    expect(next).not.toContain('approved');
    expect(next).toContain('revision');
  });

  it('should return empty array for terminal statuses', () => {
    expect(getNextStatuses('completed', false)).toEqual([]);
    expect(getNextStatuses('cancelled', false)).toEqual([]);
  });
});

describe('Status Transitions - Edge Cases', () => {
  it('should handle freelancer rejection (assigned → accepted)', () => {
    const result = validateStatusTransition('assigned', 'accepted', false);
    expect(result.valid).toBe(true);
  });

  it('should allow cancellation from any non-terminal status', () => {
    const statuses: OrderStatus[] = ['pending', 'accepted', 'assigned', 'in_progress', 'editing', 'delivered', 'approved'];
    
    statuses.forEach(status => {
      const result = validateStatusTransition(status, 'cancelled', false);
      expect(result.valid).toBe(true);
    });
  });

  it('should not allow transition from paid to anything except completed or on_hold', () => {
    const result1 = validateStatusTransition('paid', 'pending', false);
    expect(result1.valid).toBe(false);

    const result2 = validateStatusTransition('paid', 'delivered', false);
    expect(result2.valid).toBe(false);

    const result3 = validateStatusTransition('paid', 'completed', false);
    expect(result3.valid).toBe(true);

    const result4 = validateStatusTransition('paid', 'on_hold', false);
    expect(result4.valid).toBe(true);
  });
});

describe('Status Transitions - Real-World Scenarios', () => {
  it('should validate complete happy path workflow', () => {
    const workflow: Array<[OrderStatus, OrderStatus]> = [
      ['pending', 'accepted'],
      ['accepted', 'assigned'],
      ['assigned', 'in_progress'],
      ['in_progress', 'editing'],
      ['editing', 'delivered'],
      ['delivered', 'approved'],
      ['approved', 'paid'],
      ['paid', 'completed'],
    ];

    workflow.forEach(([from, to]) => {
      const result = validateStatusTransition(from, to, false);
      expect(result.valid).toBe(true);
    });
  });

  it('should validate internal revision workflow', () => {
    const workflow: Array<[OrderStatus, OrderStatus, boolean]> = [
      ['editing', 'revision', false],      // Internal revision requested
      ['revision', 'editing', false],      // Freelancer resubmits
      ['editing', 'delivered', false],     // Admin delivers (no open revision)
    ];

    workflow.forEach(([from, to, hasOpen]) => {
      const result = validateStatusTransition(from, to, hasOpen);
      expect(result.valid).toBe(true);
    });
  });

  it('should validate client revision workflow', () => {
    const workflow: Array<[OrderStatus, OrderStatus]> = [
      ['delivered', 'revision'],     // Client requests revision
      ['revision', 'editing'],       // Back to editing
      ['editing', 'delivered'],      // Redelivered
      ['delivered', 'approved'],     // Client approves
    ];

    workflow.forEach(([from, to]) => {
      const result = validateStatusTransition(from, to, false);
      expect(result.valid).toBe(true);
    });
  });

  it('should block delivery with open internal revision', () => {
    const result = validateStatusTransition('editing', 'delivered', true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('open internal revision');
    expect(result.reason).toContain('internal QC revisions must be completed');
  });
});
