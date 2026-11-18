"use client";

import { useCallback, useEffect, useState } from 'react';

export type OrderCounts = {
  all: number;
  available: number;
  onHold: number;
  inProgress: number;
  editing: number;
  delivered: number;
  revision: number;
  approved: number;
  completed: number;
  cancelled: number;
};

/**
 * Custom hook to fetch and track order counts for freelancers
 * Uses the same endpoint as the sidebar for consistency
 */
export function useFreelancerOrderCounts(freelancerId: number | undefined) {
  const [counts, setCounts] = useState<OrderCounts>({
    all: 0,
    available: 0,
    onHold: 0,
    inProgress: 0,
    editing: 0,
    delivered: 0,
    revision: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!freelancerId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/jobs?assignedFreelancerId=${freelancerId}&limit=500`, {
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Failed to fetch order counts');
        return;
      }

      const orders = await res.json();
      // API returns array directly, not wrapped in {jobs: []}
      const ordersList = Array.isArray(orders) ? orders : [];

      // Count orders by status (matching sidebar logic)
      const newCounts: OrderCounts = {
        all: ordersList.length,
        available: ordersList.filter((o: any) => o.status === 'accepted' && !o.assignedFreelancerId).length,
        onHold: ordersList.filter((o: any) => o.status === 'on_hold' || o.status === 'on-hold').length,
        inProgress: ordersList.filter((o: any) => o.status === 'in_progress' || o.status === 'in-progress').length,
        editing: ordersList.filter((o: any) => o.status === 'editing').length,
        delivered: ordersList.filter((o: any) => o.status === 'delivered').length,
        revision: ordersList.filter((o: any) => o.status === 'revision' || o.status === 'internal_revision' || o.status === 'client_revision').length,
        approved: ordersList.filter((o: any) => o.status === 'approved').length,
        completed: ordersList.filter((o: any) => o.status === 'completed').length,
        cancelled: ordersList.filter((o: any) => o.status === 'cancelled' || o.status === 'canceled').length,
      };

      setCounts(newCounts);
    } catch (error) {
      console.error('Error fetching order counts:', error);
    } finally {
      setLoading(false);
    }
  }, [freelancerId]);

  useEffect(() => {
    refetch();

    // Refresh counts every 30 seconds
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { counts, loading, refetch };
}

