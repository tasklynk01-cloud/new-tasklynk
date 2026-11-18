'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-v2';
import { toast } from 'sonner';
import { getDashboardForRole } from '@/lib/dashboard-routes';

export { getDashboardForRole };

/**
 * Standardized dashboard protection hook
 * Ensures consistent role-based access control across all dashboard pages
 * 
 * @param requiredRole - Single role string or array of allowed roles
 * @returns {user, loading} - Authenticated user and loading state
 */
export function useDashboardProtection(requiredRole: string | string[]) {
  // All hooks MUST be called unconditionally in the same order every render
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef<string | null>(null);
  
  // Memoize roles array to prevent unnecessary re-renders
  const allowedRoles = useMemo(() => {
    return Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  }, [requiredRole]);

  // Simplified protection - single useEffect with proper dependencies
  useEffect(() => {
    // Skip if still loading
    if (loading) {
      return;
    }

    // Get current pathname safely
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // Prevent multiple redirects to the same place
    try {
      // Not logged in - redirect to login
      if (!user) {
        if (currentPath !== '/login' && hasRedirectedRef.current !== '/login') {
          hasRedirectedRef.current = '/login';
          // Only show toast if user was on a protected page (not on public pages)
          if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register') && currentPath !== '/') {
            toast.error('Please log in to continue');
          }
          router.replace('/login');
        }
        return;
      }

      // Wrong role - redirect to their correct dashboard
      const hasRole = allowedRoles.includes(user.role);
      if (!hasRole) {
        const userDashboard = getDashboardForRole(user.role);
        if (currentPath !== userDashboard && currentPath !== '/login' && hasRedirectedRef.current !== userDashboard) {
          hasRedirectedRef.current = userDashboard;
          toast.error('Unauthorized access - insufficient permissions');
          router.replace(userDashboard);
        }
        return;
      }
      
      // All checks passed - reset redirect tracking
      hasRedirectedRef.current = null;
    } catch (error) {
      console.error('[DashboardProtection] Error in protection check:', error);
      // Don't rethrow - let the page render
    }
    // Include all dependencies used in the effect
  }, [user, loading, allowedRoles, router]);

  return { user, loading };
}

/**
 * Loading component for dashboard pages
 */
export function DashboardLoader() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          animation: 'spin 1s linear infinite',
          borderRadius: '9999px',
          height: '48px',
          width: '48px',
          borderBottom: '2px solid #3b82f6',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    </div>
  );
}
