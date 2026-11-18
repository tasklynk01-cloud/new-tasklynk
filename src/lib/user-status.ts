/**
 * User Status Utilities
 * Centralized logic for consistent status display across all pages
 */

export type UserStatusColor = 'green' | 'yellow' | 'red' | 'gray';
export type BadgeVariant = 'default' | 'secondary' | 'destructive';

export interface UserStatusDisplay {
  label: string;
  color: UserStatusColor;
  variant: BadgeVariant;
  canPerformActions: boolean;
  description?: string;
}

export interface StatusUser {
  approved: boolean | number | null;
  status: string | null;
  role?: string | null;
}

/**
 * Get unified display status for a user
 * This ensures consistent status display across ALL pages
 * 
 * @param user - User object with approved and status fields
 * @returns Display status object with label, color, variant, and action permissions
 */
export function getUserDisplayStatus(user: StatusUser): UserStatusDisplay {
  // Normalize values
  const approved = Boolean(user.approved === true || user.approved === 1);
  const status = String(user.status || 'pending').toLowerCase().trim();
  const role = String(user.role || '').toLowerCase().trim();

  // Priority 1: Special statuses override everything else
  if (status === 'blacklisted') {
    return {
      label: 'Blacklisted',
      color: 'gray',
      variant: 'destructive',
      canPerformActions: false,
      description: 'Account permanently blocked',
    };
  }

  if (status === 'rejected') {
    return {
      label: 'Rejected',
      color: 'gray',
      variant: 'secondary',
      canPerformActions: false,
      description: 'Application not approved',
    };
  }

  if (status === 'suspended') {
    return {
      label: 'Suspended',
      color: 'red',
      variant: 'destructive',
      canPerformActions: false,
      description: 'Account temporarily blocked',
    };
  }

  // Priority 2: Admins are always active (no approval needed)
  if (role === 'admin' && status === 'active') {
    return {
      label: 'Active',
      color: 'green',
      variant: 'default',
      canPerformActions: true,
      description: 'Admin account',
    };
  }

  // Priority 3: Check approval status
  if (approved && (status === 'active' || status === 'approved')) {
    return {
      label: 'Active',
      color: 'green',
      variant: 'default',
      canPerformActions: true,
      description: 'Account approved and active',
    };
  }

  // Default: Pending approval
  return {
    label: 'Pending Approval',
    color: 'yellow',
    variant: 'secondary',
    canPerformActions: false,
    description: 'Waiting for admin approval',
  };
}

/**
 * Check if user can perform role-specific actions
 * Used to gate features like posting orders, accepting jobs, etc.
 * 
 * @param user - User object
 * @returns true if user can perform actions, false otherwise
 */
export function canUserPerformActions(user: StatusUser): boolean {
  const displayStatus = getUserDisplayStatus(user);
  return displayStatus.canPerformActions;
}

/**
 * Get status badge color classes for Tailwind
 * 
 * @param color - Status color
 * @returns Tailwind CSS classes for badge styling
 */
export function getStatusColorClasses(color: UserStatusColor): string {
  switch (color) {
    case 'green':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'red':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    case 'gray':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get status emoji icon
 * 
 * @param color - Status color
 * @returns Emoji for status
 */
export function getStatusIcon(color: UserStatusColor): string {
  switch (color) {
    case 'green':
      return '✅';
    case 'yellow':
      return '⏳';
    case 'red':
      return '🚫';
    case 'gray':
      return '❌';
    default:
      return '•';
  }
}

/**
 * Check if user is in a "good" state (active or pending)
 * Excludes suspended, rejected, blacklisted
 * 
 * @param user - User object
 * @returns true if user is in good standing
 */
export function isUserInGoodStanding(user: StatusUser): boolean {
  const status = String(user.status || 'pending').toLowerCase().trim();
  return !['suspended', 'rejected', 'blacklisted'].includes(status);
}

/**
 * Get user status for admin filtering
 * Useful for filtering users by approval status in admin panels
 * 
 * @param user - User object
 * @returns Status category: 'active', 'pending', 'suspended', 'rejected', 'blacklisted'
 */
export function getUserStatusCategory(user: StatusUser): string {
  const status = String(user.status || 'pending').toLowerCase().trim();
  const approved = Boolean(user.approved === true || user.approved === 1);

  // Special statuses take priority
  if (['suspended', 'rejected', 'blacklisted'].includes(status)) {
    return status;
  }

  // Approved users
  if (approved && (status === 'active' || status === 'approved')) {
    return 'active';
  }

  // Unapproved users
  return 'pending';
}

/**
 * Determine if status should be synced in database
 * Used by sync endpoint to fix inconsistent data
 * 
 * @param user - User object
 * @returns Object with needsSync flag and correct status
 */
export function getStatusSyncInfo(user: StatusUser): {
  needsSync: boolean;
  correctStatus: string;
  reason?: string;
} {
  const approved = Boolean(user.approved === true || user.approved === 1);
  const status = String(user.status || 'pending').toLowerCase().trim();

  // Don't touch special statuses
  if (['suspended', 'rejected', 'blacklisted'].includes(status)) {
    return {
      needsSync: false,
      correctStatus: status,
      reason: 'Special status preserved',
    };
  }

  // Approved users should have status='active'
  if (approved && status !== 'active') {
    return {
      needsSync: true,
      correctStatus: 'active',
      reason: `User is approved but status is '${status}', should be 'active'`,
    };
  }

  // Unapproved users should have status='pending'
  if (!approved && status !== 'pending') {
    return {
      needsSync: true,
      correctStatus: 'pending',
      reason: `User is not approved but status is '${status}', should be 'pending'`,
    };
  }

  // Status is correct
  return {
    needsSync: false,
    correctStatus: status,
    reason: 'Status already correct',
  };
}

/**
 * Format status for display in admin panels
 * Includes emoji and formatted text
 * 
 * @param user - User object
 * @returns Formatted status string
 */
export function formatStatusDisplay(user: StatusUser): string {
  const displayStatus = getUserDisplayStatus(user);
  const icon = getStatusIcon(displayStatus.color);
  return `${icon} ${displayStatus.label}`;
}

/**
 * Get all possible status values for filtering/dropdowns
 * 
 * @returns Array of status options
 */
export function getAllStatusOptions(): Array<{
  value: string;
  label: string;
  color: UserStatusColor;
}> {
  return [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'pending', label: 'Pending Approval', color: 'yellow' },
    { value: 'suspended', label: 'Suspended', color: 'red' },
    { value: 'rejected', label: 'Rejected', color: 'gray' },
    { value: 'blacklisted', label: 'Blacklisted', color: 'gray' },
  ];
}

