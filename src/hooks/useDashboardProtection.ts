'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context-v2';
import type { User } from '@/lib/auth-context-v2';

/**
 * 🔒 DASHBOARD PROTECTION HOOK
 * 
 * Standardizes authentication and role-based access control across dashboard pages
 * Handles loading states, authentication checks, and automatic redirects
 * 
 * FEATURES:
 * - Server-side JWT validation (via middleware)
 * - Client-side role verification
 * - Loading state management
 * - Automatic redirect to login or correct dashboard
 * - Toast notifications for unauthorized access
 * 
 * USAGE:
 * export default function AdminDashboard() {
 *   const { user, loading } = useDashboardProtection('admin');
 *   
 *   if (loading || !user) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   return <div>Dashboard content...</div>;
 * }
 */

type AuthHookReturn = ReturnType<typeof useAuth>;
type AuthUser = AuthHookReturn['user'];

interface DashboardProtectionResult {
  user: AuthUser;
  loading: boolean;
  isAuthenticated: boolean;
  hasRequiredRole: boolean;
}

/**
 * Get the correct dashboard path for a user's role
 */
function getDashboardForRole(role: string): string {
  const normalizedRole = role.toLowerCase().trim();

  const dashboards: Record<string, string> = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    client: '/client/dashboard',
    account_owner: '/client/dashboard',
    freelancer: '/freelancer/dashboard',
    writer: '/freelancer/dashboard',
    editor: '/editor/dashboard',
  };

  return dashboards[normalizedRole] || '/login';
}

/**
 * Hook to protect dashboard pages with role-based access control
 * 
 * @param requiredRole - Single role or array of allowed roles
 * @param options - Additional options
 * @returns Protection result with user data and loading state
 */
export function useDashboardProtection(
  requiredRole: string | string[],
  options: {
    redirectToLogin?: boolean;
    showToast?: boolean;
  } = {}
): DashboardProtectionResult {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<AuthUser>(null);
  const [hasRole, setHasRole] = useState(false);
  const [internalLoading, setInternalLoading] = useState(true);
  const redirectPathRef = useRef<string | null>(null);
  const loginToastShownRef = useRef(false);
  const roleToastShownRef = useRef(false);
  const approvalToastShownRef = useRef(false);

  const {
    redirectToLogin = true,
    showToast = true,
  } = options;

  const allowedRoles = useMemo(
    () => (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).map(role => role.toLowerCase().trim()),
    [requiredRole]
  );

  useEffect(() => {
    if (authLoading) {
      setInternalLoading(true);
      return;
    }

    if (!authUser) {
      setUser(null);
      setHasRole(false);
      setInternalLoading(false);

      if (showToast && !loginToastShownRef.current) {
        loginToastShownRef.current = true;
        toast.error('Please log in to continue');
      }

      if (redirectToLogin && redirectPathRef.current !== '/login') {
        redirectPathRef.current = '/login';
        router.replace('/login');
      }
      return;
    }

    const normalizedRole = authUser.role.toLowerCase().trim();
    setUser(authUser);

    const roleAllowed = allowedRoles.some(role => role === normalizedRole);

    if (!roleAllowed) {
      setHasRole(false);
      setInternalLoading(false);

      const target = getDashboardForRole(authUser.role);
      if (redirectPathRef.current !== target) {
        redirectPathRef.current = target;
        if (showToast && !roleToastShownRef.current) {
          roleToastShownRef.current = true;
          toast.error('You do not have permission to access this page');
        }
        router.replace(target);
      }
      return;
    }

    if (authUser.role !== 'admin' && authUser.approved === false && showToast && !approvalToastShownRef.current) {
      approvalToastShownRef.current = true;
      toast.warning('Your account is pending approval. Some features may be limited.');
    }

    setHasRole(true);
    setInternalLoading(false);
    redirectPathRef.current = null;
    loginToastShownRef.current = false;
    roleToastShownRef.current = false;
    approvalToastShownRef.current = authUser.role !== 'admin' && authUser.approved === false;
  }, [authUser, authLoading, allowedRoles, redirectToLogin, router, showToast]);

  return {
    user,
    loading: authLoading || internalLoading,
    isAuthenticated: user !== null,
    hasRequiredRole: hasRole,
  };
}

/**
 * Hook to check if user has a specific role without redirecting
 * Useful for conditional rendering based on role
 * 
 * @param role - Role to check
 * @returns Whether user has the role
 */
export function useHasRole(role: string | string[]): boolean {
  const { user } = useAuth();
  const allowedRoles = useMemo(
    () => (Array.isArray(role) ? role : [role]).map(r => r.toLowerCase().trim()),
    [role]
  );

  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.role.toLowerCase().trim());
}

/**
 * Hook to get current authenticated user
 * Does not perform redirects, just returns user data
 * 
 * @returns Current user or null
 */
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    }
  }, []);

  return user;
}

/**
 * Hook to check if user is authenticated
 * Does not perform redirects
 * 
 * @returns Whether user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const user = useCurrentUser();
  return user !== null;
}

/**
 * Hook to logout user
 * Clears localStorage and redirects to login
 * 
 * @returns Logout function
 */
export function useLogout() {
  const router = useRouter();

  return () => {
    localStorage.removeItem('user');
    localStorage.removeItem('bearer_token');
    toast.success('Logged out successfully');
    router.replace('/login');
  };
}

/**
 * Hook to check if user has multiple roles (admin check)
 * 
 * @returns Whether user is an admin
 */
export function useIsAdmin(): boolean {
  return useHasRole('admin');
}

/**
 * Hook to check if user is a manager
 * 
 * @returns Whether user is a manager
 */
export function useIsManager(): boolean {
  return useHasRole('manager');
}

/**
 * Hook to check if user is a client
 * 
 * @returns Whether user is a client
 */
export function useIsClient(): boolean {
  return useHasRole(['client', 'account_owner']);
}

/**
 * Hook to check if user is a freelancer
 * 
 * @returns Whether user is a freelancer
 */
export function useIsFreelancer(): boolean {
  return useHasRole(['freelancer', 'writer', 'editor']);
}

/**
 * Hook to update user data in localStorage
 * Useful after profile updates
 * 
 * @returns Update function
 */
export function useUpdateUser() {
  return (updatedFields: Partial<User>) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const updatedUser = { ...user, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
}

