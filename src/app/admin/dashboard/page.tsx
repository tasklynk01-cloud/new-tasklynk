"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useRef } from 'react';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { useAuth } from '@/lib/auth-context-v2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Activity,
  Package,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import ActiveClientsWidget from '@/components/ActiveClientsWidget';
import { ErrorBoundary } from '@/components/error-boundary';
import { FinancialSummaryWidget } from '@/components/financial-summary-widget';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

const DASHBOARD_REQUEST_TIMEOUT_MS = 15000;

async function safeReadJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type Stats = {
  users: {
    totalUsers: number;
    clientCount: number;
    freelancerCount: number;
    pendingUsers: number;
  };
  jobs: {
    totalJobs: number;
    pendingJobs: number;
    acceptedJobs: number;
    inProgressJobs: number;
    editingJobs: number;
    deliveredJobs: number;
    approvedJobs: number;
    paidJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    onHoldJobs: number;
  };
  payments: {
    totalAmount: number;
  };
};

export default function AdminDashboardPage() {
  // ?? Standardized dashboard protection
  const { user, loading } = useDashboardProtection('admin');
  const { logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const hasFetchedStats = useRef(false);
  const authErrorHandledRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Online users state
  const [onlineFreelancers, setOnlineFreelancers] = useState(0);
  const [onlineClients, setOnlineClients] = useState(0);
  const [onlineManagers, setOnlineManagers] = useState(0);

  const createAbortSignal = (timeoutMs: number) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    return {
      signal: controller.signal,
      cleanup: () => window.clearTimeout(timeoutId),
    };
  };

  const fetchStats = async () => {
    const { signal, cleanup } = createAbortSignal(DASHBOARD_REQUEST_TIMEOUT_MS);

    try {
      const timestamp = Date.now();
      const response = await safeApiFetch(`/api/stats?_=${timestamp}`, {
        cache: 'no-store',
        credentials: 'include',
        signal,
      });
      if (response.ok) {
        const data = (await safeReadJson(response)) as Stats | null;
        if (data) {
          if (isMountedRef.current) {
            setStats(data);
          }
        } else {
          toast.error('Unexpected response while loading dashboard stats.');
        }
      } else {
        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }

        const errorData = (await safeReadJson(response)) ?? { error: 'Unknown error' };
        console.error('Failed to fetch stats:', response.status, response.statusText, errorData);
        toast.error(extractErrorMessage(errorData, `Failed to load stats (${response.status})`));
        if (isMountedRef.current) {
          setStats({
            users: { totalUsers: 0, clientCount: 0, freelancerCount: 0, pendingUsers: 0 },
            jobs: { totalJobs: 0, pendingJobs: 0, acceptedJobs: 0, inProgressJobs: 0, editingJobs: 0, deliveredJobs: 0, approvedJobs: 0, paidJobs: 0, completedJobs: 0, cancelledJobs: 0, onHoldJobs: 0 },
            payments: { totalAmount: 0 }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'Dashboard stats request timed out. Showing fallback values.'
        : 'Failed to load stats. Please check your connection.';
      toast.error(message);
      if (isMountedRef.current) {
        setStats({
          users: { totalUsers: 0, clientCount: 0, freelancerCount: 0, pendingUsers: 0 },
          jobs: { totalJobs: 0, pendingJobs: 0, acceptedJobs: 0, inProgressJobs: 0, editingJobs: 0, deliveredJobs: 0, approvedJobs: 0, paidJobs: 0, completedJobs: 0, cancelledJobs: 0, onHoldJobs: 0 },
          payments: { totalAmount: 0 }
        });
      }
    } finally {
      cleanup();
      if (isMountedRef.current) {
        setLoadingStats(false);
      }
    }
  };

  const fetchOnlineUsers = async () => {
    const cleanups: Array<() => void> = [];

    try {
      // Fetch online freelancers
      const freelancerRequest = createAbortSignal(DASHBOARD_REQUEST_TIMEOUT_MS);
      cleanups.push(freelancerRequest.cleanup);
      const freelancersRes = await safeApiFetch('/api/v2/users/online?role=freelancer', {
        cache: 'no-store',
        credentials: 'include',
        signal: freelancerRequest.signal,
      });
      if (freelancersRes.ok) {
        const data = (await safeReadJson(freelancersRes)) as { count?: number } | null;
        if (isMountedRef.current) {
          setOnlineFreelancers(data?.count || 0);
        }
      } else if ((freelancersRes.status === 401 || freelancersRes.status === 403) && !authErrorHandledRef.current) {
        authErrorHandledRef.current = true;
        toast.error('Session expired. Please log in again.');
        if (typeof logout === 'function') await logout();
        return;
      }

      // Fetch online clients
      const clientsRequest = createAbortSignal(DASHBOARD_REQUEST_TIMEOUT_MS);
      cleanups.push(clientsRequest.cleanup);
      const clientsRes = await safeApiFetch('/api/v2/users/online?role=client', {
        cache: 'no-store',
        credentials: 'include',
        signal: clientsRequest.signal,
      });
      if (clientsRes.ok) {
        const data = (await safeReadJson(clientsRes)) as { count?: number } | null;
        if (isMountedRef.current) {
          setOnlineClients(data?.count || 0);
        }
      } else if ((clientsRes.status === 401 || clientsRes.status === 403) && !authErrorHandledRef.current) {
        authErrorHandledRef.current = true;
        toast.error('Session expired. Please log in again.');
        if (typeof logout === 'function') await logout();
        return;
      }

      // Fetch online managers
      const managersRequest = createAbortSignal(DASHBOARD_REQUEST_TIMEOUT_MS);
      cleanups.push(managersRequest.cleanup);
      const managersRes = await safeApiFetch('/api/v2/users/online?role=manager', {
        cache: 'no-store',
        credentials: 'include',
        signal: managersRequest.signal,
      });
      if (managersRes.ok) {
        const data = (await safeReadJson(managersRes)) as { count?: number } | null;
        if (isMountedRef.current) {
          setOnlineManagers(data?.count || 0);
        }
      } else if ((managersRes.status === 401 || managersRes.status === 403) && !authErrorHandledRef.current) {
        authErrorHandledRef.current = true;
        toast.error('Session expired. Please log in again.');
        if (typeof logout === 'function') await logout();
        return;
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error);
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error('Failed to refresh online user counts.');
      }
    } finally {
      cleanups.forEach((cleanup) => cleanup());
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (loading || !user) return;
    
    if (!hasFetchedStats.current) {
      hasFetchedStats.current = true;
      void (async () => {
        await fetchStats();
        await fetchOnlineUsers();
      })();
      
      // Refresh online users every 30 seconds
      // No auto-refresh - user can manually refresh if needed
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user, loading]);

  if (loading || !user) {
    return <DashboardLoader />;
  }

  const salesTarget = 168500;
  const currentSales = stats?.payments?.totalAmount || 0;
  const salesPercentage = salesTarget > 0 ? Math.round((currentSales / salesTarget) * 100) : 0;

  // Ensure stats has default values to prevent rendering errors
  const safeStats: Stats = stats || {
    users: { totalUsers: 0, clientCount: 0, freelancerCount: 0, pendingUsers: 0 },
    jobs: { totalJobs: 0, pendingJobs: 0, acceptedJobs: 0, inProgressJobs: 0, editingJobs: 0, deliveredJobs: 0, approvedJobs: 0, paidJobs: 0, completedJobs: 0, cancelledJobs: 0, onHoldJobs: 0 },
    payments: { totalAmount: 0 }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Admin Command Center
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 uppercase tracking-wider">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            System overview, realtime users, order pipelines &amp; financial operations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border hover:bg-muted/80 text-xs font-semibold h-8 px-3"
          >
            <Link href="/admin/user-management" className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Users ({safeStats.users.pendingUsers} pending)</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border hover:bg-muted/80 text-xs font-semibold h-8 px-3"
          >
            <Link href="/admin/payouts" className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payouts</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 shadow-sm text-xs"
          >
            <Link href="/admin/jobs" className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Manage Orders</span>
            </Link>
          </Button>
        </div>
      </div>

      {loadingStats ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Compiling platform telemetry...</p>
        </div>
      ) : (
        <>
          {/* Top 4 Compact Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Platform Revenue */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gross Platform Revenue</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground">
                  KSh {safeStats.payments.totalAmount.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {safeStats.jobs.completedJobs} completed
                </span>
              </div>
            </div>

            {/* Total Orders Pipeline */}
            <Link
              href="/admin/jobs"
              className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-primary/50 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Orders Pipeline</span>
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  {safeStats.jobs.totalJobs.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-primary">
                  {safeStats.jobs.inProgressJobs} in progress
                </span>
              </div>
            </Link>

            {/* User Community */}
            <Link
              href="/admin/user-management"
              className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-blue-500/50 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">User Community</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground group-hover:text-blue-600 transition-colors">
                  {safeStats.users.totalUsers.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  {safeStats.users.clientCount} clients • {safeStats.users.freelancerCount} writers
                </span>
              </div>
            </Link>

            {/* Realtime Online Presence */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Online Presence</span>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground">
                  {onlineClients + onlineFreelancers + onlineManagers}
                </span>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  {onlineFreelancers} writers online
                </span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Command Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Columns: Financial Summary + Order Lifecycle Distribution */}
            <div className="lg:col-span-2 space-y-4">
              {/* Financial Summary Widget */}
              <FinancialSummaryWidget />

              {/* Order Status Distribution Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Order Lifecycle Distribution</h3>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                      {safeStats.jobs.totalJobs} Total
                    </Badge>
                  </div>
                  <Link href="/admin/jobs" className="text-xs font-bold text-primary hover:underline">
                    View Matrix
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <Link
                    href="/admin/jobs?status=pending"
                    className="p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-center transition-all group"
                  >
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                      {safeStats.jobs.pendingJobs}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Pending Review</p>
                  </Link>

                  <Link
                    href="/admin/jobs?status=in_progress"
                    className="p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-center transition-all group"
                  >
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                      {safeStats.jobs.inProgressJobs}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">In Progress</p>
                  </Link>

                  <Link
                    href="/admin/jobs?status=delivered"
                    className="p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-center transition-all group"
                  >
                    <p className="text-lg font-black text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                      {safeStats.jobs.deliveredJobs}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Delivered</p>
                  </Link>

                  <Link
                    href="/admin/jobs?status=completed"
                    className="p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-center transition-all group"
                  >
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      {safeStats.jobs.completedJobs}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Completed</p>
                  </Link>
                </div>
              </div>

              {/* Active Enterprise Clients Roster */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <ErrorBoundary fallback={<div className="text-xs text-muted-foreground">Unable to load active clients</div>}>
                  <ActiveClientsWidget />
                </ErrorBoundary>
              </div>
            </div>

            {/* Right 1 Column: Realtime Presence & Quick Tools */}
            <div className="space-y-4">
              {/* Realtime User Presence Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Live User Presence</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Realtime</span>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/admin/online-users/freelancers"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        W
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Freelance Writers</p>
                        <p className="text-[10px] text-muted-foreground">{safeStats.users.freelancerCount} registered</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {onlineFreelancers} online
                    </span>
                  </Link>

                  <Link
                    href="/admin/online-users/clients"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                        C
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Clients &amp; Organizations</p>
                        <p className="text-[10px] text-muted-foreground">{safeStats.users.clientCount} registered</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {onlineClients} online
                    </span>
                  </Link>

                  <Link
                    href="/admin/online-users/managers"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#5B3594]/10 text-[#5B3594] dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                        M
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Project Managers</p>
                        <p className="text-[10px] text-muted-foreground">Admin verified leads</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#5B3594] dark:text-purple-400 bg-[#5B3594]/10 px-2 py-0.5 rounded-full">
                      {onlineManagers} online
                    </span>
                  </Link>
                </div>
              </div>

              {/* Quick Operation Links */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground">Operational Modules</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/admin/user-management"
                    className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted border border-border/50 font-semibold text-foreground text-center transition-colors"
                  >
                    User Directory
                  </Link>
                  <Link
                    href="/admin/payouts"
                    className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted border border-border/50 font-semibold text-foreground text-center transition-colors"
                  >
                    Payout Requests
                  </Link>
                  <Link
                    href="/admin/invoicing"
                    className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted border border-border/50 font-semibold text-foreground text-center transition-colors"
                  >
                    Invoices
                  </Link>
                  <Link
                    href="/admin/memos"
                    className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted border border-border/50 font-semibold text-foreground text-center transition-colors"
                  >
                    Global Memos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
