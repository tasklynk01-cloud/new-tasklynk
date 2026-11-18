"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { UserRole } from '@/lib/auth-context-v2';

interface OrderDataOptions {
  role?: UserRole;
  pollInterval?: number;
}

interface OrderDataState {
  loading: boolean;
  error: string | null;
  order: any;
  client: any;
  writer: any;
  manager: any;
  attachments: any[];
  financials: any;
  payments: any[];
  messages: any[];
}

const INITIAL_STATE: OrderDataState = {
  loading: true,
  error: null,
  order: null,
  client: null,
  writer: null,
  manager: null,
  attachments: [],
  financials: null,
  payments: [],
  messages: [],
};

function parseSuccessPayload<T = any>(payload: any): T {
  if (!payload) return payload;
  // Handle wrapped success responses: { success: true, data: {...} }
  if (typeof payload === 'object' && 'success' in payload && payload.data) {
    return payload.data as T;
  }
  // Handle direct data responses
  return payload as T;
}

export function useOrderData(orderId: number | string | null, options: OrderDataOptions = {}) {
  const [state, setState] = useState<OrderDataState>(INITIAL_STATE);
  const [pollInterval, setPollInterval] = useState(options.pollInterval ?? 5000);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!orderId) return;
      if (!silent) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      try {
        const orderRes = await fetch(`/api/v2/orders/${orderId}`, {
          credentials: 'include',
          next: { revalidate: 30 },
        });

        if (!orderRes.ok) {
          throw new Error('Failed to fetch order');
        }

        const orderPayload = parseSuccessPayload(await orderRes.json());

        const canonicalIdCandidate = orderPayload?.order?.id ?? orderPayload?.order?.jobId ?? null;
        const numericFromOrder = typeof canonicalIdCandidate === 'number'
          ? canonicalIdCandidate
          : (typeof canonicalIdCandidate === 'string' && canonicalIdCandidate.trim() !== ''
              ? Number(canonicalIdCandidate)
              : NaN);
        const numericFromParam = typeof orderId === 'number'
          ? orderId
          : (typeof orderId === 'string' && orderId.trim() !== ''
              ? Number(orderId)
              : NaN);
        const secondaryFetchId = Number.isFinite(numericFromOrder)
          ? numericFromOrder
          : Number.isFinite(numericFromParam)
            ? numericFromParam
            : null;

        let paymentsPayload: any = [];
        let messagesPayload: any = { messages: [] };

        if (secondaryFetchId !== null) {
          const [paymentsRes, messagesRes] = await Promise.all([
            fetch(`/api/payments?jobId=${secondaryFetchId}`, {
              credentials: 'include',
              next: { revalidate: 30 },
            }),
            fetch(`/api/v2/messages?orderId=${secondaryFetchId}`, {
              credentials: 'include',
              next: { revalidate: 30 },
            }),
          ]);

          if (paymentsRes.ok) {
            paymentsPayload = parseSuccessPayload(await paymentsRes.json());
          }

          if (messagesRes.ok) {
            messagesPayload = parseSuccessPayload(await messagesRes.json());
          }
        }

        const fallbackPayments = Array.isArray(orderPayload?.payments)
          ? orderPayload?.payments
          : orderPayload?.payments?.payments ?? [];

        setState({
          loading: false,
          error: null,
          order: orderPayload?.order ?? null,
          client: orderPayload?.client ?? null,
          writer: orderPayload?.writer ?? null,
          manager: orderPayload?.manager ?? null,
          attachments: orderPayload?.files ?? [],
          financials: orderPayload?.financials ?? null,
          payments: Array.isArray(paymentsPayload)
            ? paymentsPayload
            : paymentsPayload?.payments ?? fallbackPayments,
          messages: messagesPayload?.messages ?? orderPayload?.messages ?? [],
        });
      } catch (error) {
        console.error('[useOrderData] fetch failed', error);
        setState((prev) => ({ ...prev, loading: false, error: 'Failed to load order data' }));
        if (!silent) toast.error('Failed to load order data');
      }
    },
    [orderId]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll, options.role]);

  useEffect(() => {
    if (!pollInterval) return;
    const id = setInterval(() => fetchAll(true), pollInterval);
    return () => clearInterval(id);
  }, [fetchAll, pollInterval]);

  return {
    ...state,
    refresh: () => fetchAll(false),
    setPollInterval,
  };
}

