"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED: The 'assigned' status has been removed from the order lifecycle.
 * Orders now go directly from 'accepted' to 'in_progress' when a freelancer is assigned.
 * This page redirects to the in-progress orders page.
 */
export default function ManagerAssignedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'manager') {
        router.push('/');
      } else {
        // Redirect to in-progress orders - assigned status no longer exists
        router.replace('/manager/orders/in-progress');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // This page just redirects, show nothing while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
