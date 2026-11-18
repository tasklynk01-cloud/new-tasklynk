/**
 * Get the correct dashboard path for a given role.
 * Kept in its own module (no React/hooks) so server-only code
 * (e.g. API route handlers) can import it without pulling in
 * client-only hook code from useDashboardProtection.tsx.
 */
export function getDashboardForRole(role: string): string {
  const dashboards: Record<string, string> = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    client: '/client/dashboard',
    account_owner: '/client/dashboard',
    freelancer: '/freelancer/dashboard',
    writer: '/freelancer/dashboard', // Alias for freelancer
    editor: '/editor/dashboard', // Editor has their own dashboard
  };
  return dashboards[role] || '/login';
}
