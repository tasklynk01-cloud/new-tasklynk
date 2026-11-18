"use client";

/**
 * Freelancer Jobs [id] Page - Redirect to unified orders page
 * 
 * This page redirects to /freelancer/orders/[id] which now handles
 * ALL order statuses: bidding, assigned, in_progress, editing,
 * revision, delivered, approved, completed, cancelled.
 * 
 * The unified page replaces the previous two-page system where:
 * - /freelancer/orders/[id] handled bidding
 * - /freelancer/jobs/[id] handled assigned work
 * 
 * Now everything is in one place for better UX and maintainability.
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function FreelancerJobsRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    // Redirect to unified orders page
    router.replace(`/freelancer/orders/${orderId}`);
  }, [router, orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
