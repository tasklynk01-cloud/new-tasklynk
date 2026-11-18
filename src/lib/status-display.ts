/**
 * Role-specific status display helpers
 * Maps database status to user-facing labels based on role context
 */

export type OrderStatus = 
  | 'pending'
  | 'accepted'
  // 'assigned' removed - goes directly to in_progress
  | 'in_progress'
  | 'submitted'
  | 'editing'
  | 'delivered'
  | 'revision'
  | 'internal_revision'
  | 'client_revision'
  | 'approved'
  | 'paid'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type UserRole = 'freelancer' | 'client' | 'manager' | 'admin' | 'account_owner' | 'editor';

/**
 * Get user-facing status label for a given role
 * This ensures status badges match the submenu where orders appear
 */
export function getStatusLabel(status: OrderStatus, role: UserRole): string {
  // Freelancer sees "accepted" orders as "Available" in their Available Orders list
  if (role === 'freelancer' && status === 'accepted') {
    return 'Available';
  }

  if ((role === 'client' || role === 'account_owner') && status === 'submitted') {
    return 'Under Review';
  }

  // All other roles and statuses use standard mapping
  const statusMap: Record<OrderStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    // assigned removed
    in_progress: 'In Progress',
    submitted: 'Submitted for Review',
    editing: 'Editing',
    delivered: 'Delivered',
    revision: 'Revision',
    internal_revision: 'Internal Revision',
    client_revision: 'Client Revision',
    approved: 'Approved',
    paid: 'Paid',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || status;
}

/**
 * Get badge color variant based on status
 * Consistent across all roles
 */
export function getStatusVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'accepted':
      return 'default';
    case 'in_progress':
    case 'submitted':
    case 'editing':
      return 'outline';
    case 'delivered':
    case 'approved':
      return 'default';
    case 'paid':
    case 'completed':
      return 'default';
    case 'on_hold':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'revision':
    case 'internal_revision':
    case 'client_revision':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get Tailwind color classes for status badges
 * Used for custom styled badges
 */
export function getStatusColorClasses(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    submitted: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    editing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    revision: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    internal_revision: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    client_revision: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
    paid: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    completed: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    on_hold: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
}

