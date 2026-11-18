"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, AlignJustify, RefreshCw, Download, CheckCircle, UserPlus, Loader2, Ban, XCircle, PlayCircle, AlertCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import OrderLink from '@/components/OrderLink';
import { OrderRow } from '@/components/orders/order-row';
import { useOrderNavigation } from '@/components/orders/use-order-navigation';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { getStatusLabel, getStatusColorClasses, type OrderStatus } from '@/lib/status-display';

async function safeReadJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type Order = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  status: string;
  deadline: string;
  actualDeadline: string;
  createdAt: string;
  pages: number | null;
  slides: number | null;
  singleSpaced: boolean | number | null;
  baseCpp: number | null;
  effectiveCpp: number | null;
  clientCpp?: number | null;
  statusTotalAmount?: number | null;
  totalAmount?: number | null;
  clientBonus?: number | null;
  managerAdditional?: number | null;
  client?: {
    id: number;
    displayId: string;
    name: string;
  } | null;
  writer?: {
    id: number;
    displayId: string;
    name: string;
  } | null;
};

const CLIENT_SLIDE_RATE = 150;

const coerceBoolean = (value: boolean | number | null | undefined) => value === true || value === 1;

const computeClientAmount = (order: Order): number => {
  if (typeof order.statusTotalAmount === 'number' && order.statusTotalAmount > 0) {
    return order.statusTotalAmount;
  }

  if (typeof order.totalAmount === 'number' && order.totalAmount > 0) {
    return order.totalAmount;
  }

  const pages = order.pages ?? 0;
  const slides = order.slides ?? 0;
  const pageMultiplier = coerceBoolean(order.singleSpaced) ? 2 : 1;
  const baseCpp = order.clientCpp ?? order.effectiveCpp ?? order.baseCpp;

  const baseAmount = baseCpp && baseCpp > 0 && pages > 0
    ? baseCpp * pages * pageMultiplier
    : 0;

  const slidesAmount = slides > 0 ? slides * CLIENT_SLIDE_RATE : 0;
  const adjustments = (order.clientBonus ?? 0) + (order.managerAdditional ?? 0);

  if (baseAmount > 0 || slidesAmount > 0) {
    return baseAmount + slidesAmount + adjustments;
  }

  return order.amount ?? 0;
};

const computeDisplayCpp = (order: Order): number => {
  if (order.clientCpp && order.clientCpp > 0) return order.clientCpp;
  if (order.effectiveCpp && order.effectiveCpp > 0) return order.effectiveCpp;
  if (order.baseCpp && order.baseCpp > 0) return order.baseCpp;

  const pages = order.pages ?? 0;
  if (pages <= 0) return 0;

  const pageMultiplier = coerceBoolean(order.singleSpaced) ? 2 : 1;
  const effectivePages = pages * Math.max(pageMultiplier, 1);
  if (effectivePages <= 0) return 0;

  const slides = order.slides ?? 0;
  const slidesAmount = slides > 0 ? slides * CLIENT_SLIDE_RATE : 0;
  const referenceAmount = (order.statusTotalAmount ?? order.totalAmount ?? order.amount ?? 0) - slidesAmount;

  if (referenceAmount <= 0) return 0;

  return referenceAmount / effectivePages;
};

export default function ManagerOrdersPageContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const hasCheckedAuth = useRef(false);
  const authErrorHandledRef = useRef(false);
  const { navigateToOrder } = useOrderNavigation('manager');

  // Sync filter with URL query using useSearchParams
  useEffect(() => {
    const allowed = [
      'all','pending','approved','accepted','in_progress','submitted','editing','delivered','completed','paid','on_hold','cancelled','revision'
    ];
    const statusParam = searchParams?.get('status');
    // Map legacy 'assigned' to 'in_progress'
    const mappedStatus = statusParam === 'assigned' ? 'in_progress' : statusParam;
    
    if (mappedStatus && allowed.includes(mappedStatus)) {
      setFilter(mappedStatus);
    } else if (!statusParam) {
      setFilter('all');
    }
  }, [searchParams]);

  // Update URL when filter changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (filter === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', filter);
    }
    window.history.replaceState({}, '', url.toString());
  }, [filter]);

  // Countdown helper
  const getCountdown = (deadlineStr: string) => {
    const due = new Date(deadlineStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    if (isNaN(due.getTime())) return { text: '-', expired: false, urgent: false };
    if (diffMs <= 0) return { text: 'Expired', expired: true, urgent: true };
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const urgent = diffMs <= twelveHoursMs;
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (d > 0) return { text: `${d}d ${h}h ${m}m`, expired: false, urgent };
    if (h > 0) return { text: `${h}h ${m}m`, expired: false, urgent };
    return { text: `${m}m`, expired: false, urgent };
  };

  // Auth check
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'manager') {
      router.replace('/');
    } else if (user && user.id) {
      // Only fetch orders if user and user.id are both available
      fetchOrders();
    }
  }, [loading, user, router]);

  const fetchOrders = async (silent = false) => {
    // ?? CRITICAL: Ensure user and user.id exist before fetching
    if (!user || !user.id) {
      console.warn('[Manager Orders] Cannot fetch orders: user or user.id is undefined');
      if (!silent) {
        toast.error('Unable to identify manager. Please refresh the page.');
      }
      setLoadingOrders(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!silent) setLoadingOrders(true);
      if (!silent) setRefreshing(true);
      
      const timestamp = Date.now();
      const managerId = user.id;
      const token = localStorage.getItem('bearer_token');
      
      const response = await safeApiFetch(`/api/manager/orders?managerId=${managerId}&_=${timestamp}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = (await safeReadJson(response)) as Order[] | { jobs?: Order[] } | null;
        const orders = Array.isArray(data) ? data : Array.isArray(data?.jobs) ? data.jobs : [];
        setOrders(orders);
        
        // Show helpful message if no orders found
        if (orders.length === 0 && !silent) {
          toast.info('No orders found. Make sure you have clients assigned to you.');
        }
      } else {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }

        const errorData = (await safeReadJson(response)) ?? { error: 'Unknown error' };
        console.error('[Manager Orders] API error:', errorData, {
          status: response.status,
          statusText: response.statusText,
          managerId
        });
        if (!silent) {
          toast.error(extractErrorMessage(errorData, `Failed to fetch orders (${response.status})`));
        }
      }
    } catch (error) {
      console.error('[Manager Orders] Failed to fetch orders:', error);
      if (!silent) toast.error('Failed to fetch orders. Please check your connection.');
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchOrders(false);
    toast.success('Refreshing orders...');
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await safeApiFetch(`/api/manager/orders?managerId=${user.id}${statusParam}&format=csv`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) {
        toast.error('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manager-orders-${filter}-${user.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Orders exported successfully');
    } catch (e) {
      console.error('Export failed', e);
      toast.error('Export failed');
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('bearer_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, note?: string) => {
    if (!user) return false;
    try {
      const response = await safeApiFetch(`/api/jobs/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, changedBy: user.id, note }),
      });

      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return false;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, `Failed to update to ${newStatus}`));
        return false;
      }

      toast.success(`Order updated to ${newStatus.replace('_', ' ')}`);
      await fetchOrders(true);
      return true;
    } catch (error) {
      console.error('[Manager Orders] Failed to update status:', error);
      toast.error('Failed to update order status');
      return false;
    }
  };

  const acceptOrder = async (orderId: number) => {
    if (!user) return false;
    setAcceptingOrderId(orderId);
    try {
      const response = await safeApiFetch(`/api/jobs/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'accepted', changedBy: user.id }),
      });

      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return false;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to accept order'));
        return false;
      }

      toast.success('Order accepted successfully');
      await fetchOrders(true);
      return true;
    } catch (error) {
      console.error('[Manager Orders] Failed to accept order:', error);
      toast.error('Failed to accept order. Please try again.');
      return false;
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleAcceptClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    await acceptOrder(orderId);
  };

  const handleAcceptAndAssignClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const accepted = await acceptOrder(orderId);
    if (accepted) {
      toast.info('Redirecting to assignment workspace');
      navigateToOrder(orderId);
    }
  };

  const handleOpenAssignPage = (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    navigateToOrder(orderId);
  };

  const handlePutOnHoldClick = async (event: React.MouseEvent<HTMLButtonElement>, orderId: number) => {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm('Put this order on hold?')) return;
    try {
      const response = await safeApiFetch(`/api/jobs/${orderId}/hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ adminId: user?.id, reason: 'Put on hold by manager' }),
      });

      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to put order on hold'));
        return;
      }

      const data = await response.json().catch(() => ({}));
      toast.success(data?.message || 'Order put on hold');
      await fetchOrders(true);
    } catch (error) {
      console.error('[Manager Orders] Failed to put order on hold:', error);
      toast.error('Failed to put order on hold');
    }
  };

  const handleCancelClick = async (event: React.MouseEvent<HTMLButtonElement>, orderId: number) => {
    event.stopPropagation();
    event.preventDefault();
    const reason = prompt('Reason for cancelling this order? (optional)') || '';
    if (!confirm('Cancel this order?')) return;
    await updateOrderStatus(orderId, 'cancelled', reason.trim() || 'Cancelled by manager');
  };

  const handleResumeClick = async (event: React.MouseEvent<HTMLButtonElement>, order: Order) => {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm('Resume this order from on-hold?')) return;
    try {
      const response = await safeApiFetch(`/api/jobs/${order.id}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ adminId: user?.id, reason: 'Resumed by manager' }),
      });

      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to resume order'));
        return;
      }

      const data = await response.json().catch(() => ({}));
      toast.success(data?.message || 'Order resumed');
      await fetchOrders(true);
    } catch (error) {
      console.error('[Manager Orders] Failed to resume order:', error);
      toast.error('Failed to resume order');
    }
  };

  const handleApproveSubmissionClick = async (event: React.MouseEvent<HTMLButtonElement>, orderId: number) => {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm('Approve submission and send to editing?')) return;
    try {
      const response = await safeApiFetch(`/api/manager/${orderId}/approve-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ approvalNotes: 'Approved by manager for editing' }),
      });
      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to approve submission'));
        return;
      }
      toast.success('Submission approved ? editing');
      await fetchOrders(true);
    } catch (error) {
      console.error('[Manager Orders] Approve submission error:', error);
      toast.error('Failed to approve submission');
    }
  };

  const handleRejectSubmissionClick = async (event: React.MouseEvent<HTMLButtonElement>, orderId: number) => {
    event.stopPropagation();
    event.preventDefault();
    const rejectionReason = prompt('Rejection reason (required):');
    if (!rejectionReason?.trim()) return;
    const requiredChanges = prompt('Required changes (optional):') || '';
    if (!confirm('Reject submission and return to freelancer?')) return;
    try {
      const response = await safeApiFetch(`/api/manager/${orderId}/approve-submission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ rejectionReason: rejectionReason.trim(), requiredChanges: requiredChanges.trim() || undefined }),
      });
      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to reject submission'));
        return;
      }
      toast.success('Submission rejected');
      await fetchOrders(true);
    } catch (error) {
      console.error('[Manager Orders] Reject submission error:', error);
      toast.error('Failed to reject submission');
    }
  };

  const handleDeliverToClientClick = async (event: React.MouseEvent<HTMLButtonElement>, orderId: number) => {
    event.stopPropagation();
    event.preventDefault();
    if (!confirm('Deliver this order to the client for review?')) return;
    try {
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Delivered to client by manager' }),
      });
      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to deliver to client'));
        return;
      }
      toast.success('Delivered to client');
      await fetchOrders(true);
    } catch (error) {
      console.error('[Manager Orders] Deliver error:', error);
      toast.error('Failed to deliver order');
    }
  };

  const handleInternalRevisionClick = async (event: React.MouseEvent<HTMLButtonElement>, order: Order) => {
    event.stopPropagation();
    event.preventDefault();
    if (!order.writer?.id) {
      toast.error('No writer assigned to this order');
      return;
    }
    const reason = prompt('Internal revision request (required):');
    if (!reason?.trim()) return;
    try {
      const response = await safeApiFetch(`/api/v2/orders/${order.id}/internal-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          assignedTo: order.writer.id,
          reason: reason.trim().length > 120 ? `${reason.trim().slice(0, 117)}...` : reason.trim(),
          details: reason.trim(),
        }),
      });
      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to request internal revision'));
        return;
      }
      toast.success('Internal revision requested');
      await fetchOrders(true);
    } catch (error) {
      console.error('[Manager Orders] Internal revision error:', error);
      toast.error('Failed to request internal revision');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    
    // in_progress now includes all work being done (assigned status removed)
    if (filter === 'in_progress') {
      return o.status === 'in_progress';
    }
    
    return o.status === filter;
  });

  // Status badges
  const getStatusBadge = (status: string) => {
    const cls: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      approved: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100',
      // assigned removed
      in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      submitted: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 font-semibold',
      editing: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      revision: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      paid: 'bg-amber-200 text-amber-900 dark:bg-amber-700 dark:text-amber-100',
      completed: 'bg-emerald-700 text-white',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    };
    const label = status.replace('_', ' ');
    return <Badge className={`${cls[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'} capitalize`}>{label}</Badge>;
  };

  // Quick counts for stats
  const count = (s: string) => orders.filter(o => o.status === s).length;
  const total = orders.length;
  
  // Count for in_progress (assigned status removed)
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <div className="order-container py-4">
        <div className="order-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pb-3 border-b border-border/60">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Manager Orders Directory</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Oversee assignments, verify deliverables, and manage client-writer pipelines
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 px-3 rounded-lg border-border text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="h-8 px-3 rounded-lg border-border text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Compact 6-Stat KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3">
          <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Pipeline</span>
            <span className="text-lg sm:text-xl font-black text-foreground mt-1">{total}</span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Review</span>
            <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{count('pending')}</span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">In Progress</span>
            <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{count('in_progress')}</span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Delivered</span>
            <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{count('delivered')}</span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Revisions</span>
            <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400 mt-1">{count('revision')}</span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed</span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{count('completed')}</span>
          </div>
        </div>

        {/* Status Filter Tabs (Scrollable Ribbon with live counts) */}
        <Tabs value={filter} onValueChange={setFilter} className="space-y-3">
          <TabsList className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-xl h-auto scrollbar-none w-full flex-wrap sm:flex-nowrap">
            <TabsTrigger value="all" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              All ({total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Pending ({count('pending')})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Accepted ({count('accepted')})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              In Progress ({count('in_progress')})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Submitted ({count('submitted')})
            </TabsTrigger>
            <TabsTrigger value="editing" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Editing ({count('editing')})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Delivered ({count('delivered')})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Approved ({count('approved')})
            </TabsTrigger>
            <TabsTrigger value="revision" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Revision ({count('revision')})
            </TabsTrigger>
            <TabsTrigger value="paid" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Paid ({count('paid')})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Completed ({count('completed')})
            </TabsTrigger>
            <TabsTrigger value="on_hold" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              On Hold ({count('on_hold')})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Cancelled ({count('cancelled')})
            </TabsTrigger>
          </TabsList>

          {/* Orders list */}
          <TabsContent value={filter} className="mt-0">
            <Card className="shadow-sm border rounded-lg">
              <CardHeader>
                <CardTitle className="text-base font-semibold capitalize">{filter.replace('_', ' ')} Orders</CardTitle>
                <CardDescription className="text-sm">
                  {filter === 'all' && 'All orders from your assigned clients and writers'}
                  {filter === 'pending' && 'Orders awaiting your acceptance'}
                  {filter === 'approved' && 'Orders approved by client after delivery, awaiting payment confirmation'}
                  {filter === 'accepted' && 'Orders approved by admin and ready to assign to freelancers'}
                  {filter === 'in_progress' && 'Orders currently being worked on'}
                  {filter === 'submitted' && '?? Orders submitted by writers awaiting YOUR review (Gate 1)'}
                  {filter === 'editing' && 'Orders under editor QA review (Gate 2)'}
                  {filter === 'delivered' && 'Orders delivered to client awaiting approval'}
                  {filter === 'revision' && 'Orders in revision stage'}
                  {filter === 'paid' && 'Orders that have been paid for'}
                  {filter === 'completed' && 'Successfully completed orders'}
                  {filter === 'on_hold' && 'Orders temporarily paused'}
                  {filter === 'cancelled' && 'Cancelled orders'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">No orders found</p>
                    <p className="text-muted-foreground">
                      No orders match the selected filter
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredOrders.map((order) => {
                      const deadlineToUse = order.actualDeadline || order.deadline;
                      const cd = getCountdown(deadlineToUse);
                      const deadlineDate = deadlineToUse ? new Date(deadlineToUse) : null;
                      const hasValidDeadline = !!deadlineDate && !isNaN(deadlineDate.getTime());
                      const formattedDeadline = hasValidDeadline ? format(deadlineDate, 'MMM dd, yyyy') : 'No deadline';
                      const createdAtDate = order.createdAt ? new Date(order.createdAt) : null;
                      const formattedCreatedAt = createdAtDate && !isNaN(createdAtDate.getTime())
                        ? format(createdAtDate, 'MMM dd, yyyy')
                        : 'Unknown';
                      const clientAmount = computeClientAmount(order);
                      const safeClientAmount = Number.isFinite(clientAmount) ? clientAmount : 0;
                      const displayCpp = computeDisplayCpp(order);
                      const isSingleSpaced = coerceBoolean(order.singleSpaced);

                      return (
                        <OrderRow
                          key={order.id}
                          orderId={order.id}
                          roleOverride="manager"
                          className="order-card-compact transition-all cursor-pointer hover:bg-primary/5 hover:border-primary/40"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="order-detail-title text-foreground">
                                  {order.title}
                                </h3>
                                {order.displayId && (
                                  <span className="order-badge font-mono font-semibold text-primary bg-primary/10 border-primary/20">
                                    {order.displayId}
                                  </span>
                                )}
                                {order.displayId && (
                                  <OrderLink
                                    orderId={order.id}
                                    displayId={order.displayId}
                                    className="bg-transparent hover:bg-primary/10 text-xs"
                                    title="Open canonical order detail"
                                    roleOverride="manager"
                                  />
                                )}
                                {isSingleSpaced && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 rounded-xl">
                                    <AlignJustify className="w-4 h-4 mr-1" />
                                    Single Spaced
                                  </Badge>
                                )}
                              </div>
                              {order.client?.name && (
                                <p className="text-sm text-muted-foreground mb-1.5">
                                  Client: <span className="font-medium">{order.client.name}</span>
                                </p>
                              )}
                              {order.writer?.name && (
                                <p className="text-sm text-muted-foreground mb-1.5">
                                  Writer: <span className="font-medium">{order.writer.name}</span>
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                          <div className="order-meta">
                            <span className="capitalize font-medium">{order.workType}</span>
                            <span></span>
                            {order.pages && (
                              <>
                                <span>{order.pages} page{order.pages > 1 ? 's' : ''}</span>
                                <span></span>
                              </>
                            )}
                            {order.slides && (
                              <>
                                <span>{order.slides} slide{order.slides > 1 ? 's' : ''}</span>
                                <span></span>
                              </>
                            )}
                            <span className="font-bold text-foreground">
                              KSh {safeClientAmount.toFixed(2)}
                            </span>
                            {order.pages && displayCpp > 0 && (
                              <>
                                <span></span>
                                <span className="text-xs">(CPP: KSh {displayCpp.toFixed(0)})</span>
                              </>
                            )}
                            <span></span>
                            <span className="font-medium flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formattedDeadline}
                              {hasValidDeadline && (
                                <span className={`ml-1 ${cd.expired || cd.urgent ? 'text-red-600' : 'text-green-600'}`}>
                                  ({cd.text})
                                </span>
                              )}
                            </span>
                            <span></span>
                            <span>
                              Posted: {formattedCreatedAt}
                            </span>
                          </div>
                          {(order.status === 'pending' || order.status === 'accepted' || order.status === 'submitted' || order.status === 'editing' || order.status === 'on_hold') && (
                            <div className="mt-2.5 flex flex-wrap gap-3">
                              {order.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-3 bg-green-600 hover:bg-green-700"
                                    disabled={acceptingOrderId === order.id}
                                    onClick={(event) => handleAcceptClick(event, order.id)}
                                  >
                                    {acceptingOrderId === order.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-3"
                                    disabled={acceptingOrderId === order.id}
                                    onClick={(event) => handleAcceptAndAssignClick(event, order.id)}
                                  >
                                    {acceptingOrderId === order.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <UserPlus className="w-4 h-4" />
                                    )}
                                    Accept &amp; Assign
                                  </Button>
                                </>
                              )}
                              {order.status === 'accepted' && (
                                <Button
                                  size="sm"
                                  className="gap-3"
                                  onClick={(event) => handleOpenAssignPage(event, order.id)}
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Assign Freelancer
                                </Button>
                              )}

                              {order.status === 'submitted' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-3 bg-blue-600 hover:bg-blue-700"
                                    onClick={(event) => handleApproveSubmissionClick(event, order.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve ? Editing
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-3"
                                    onClick={(event) => handleRejectSubmissionClick(event, order.id)}
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {order.status === 'editing' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-3 bg-green-600 hover:bg-green-700"
                                    onClick={(event) => handleDeliverToClientClick(event, order.id)}
                                  >
                                    <Send className="w-4 h-4" />
                                    Deliver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-3"
                                    onClick={(event) => handleInternalRevisionClick(event, order)}
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    Internal Revision
                                  </Button>
                                </>
                              )}

                              {order.status === 'on_hold' && (
                                <Button
                                  size="sm"
                                  className="gap-3 bg-amber-600 hover:bg-amber-700"
                                  onClick={(event) => handleResumeClick(event, order)}
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  Resume
                                </Button>
                              )}

                              {order.status !== 'on_hold' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-3"
                                  onClick={(event) => handlePutOnHoldClick(event, order.id)}
                                >
                                  <Ban className="w-4 h-4" />
                                  Hold
                                </Button>
                              )}

                              {(
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-3"
                                  onClick={(event) => handleCancelClick(event, order.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
                        </OrderRow>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
