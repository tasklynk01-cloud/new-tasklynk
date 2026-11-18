"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, UserPlus, FileText, Clock, PauseCircle, AlignJustify, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import OrderLink from '@/components/OrderLink';
import { OrderRow } from '@/components/orders/order-row';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { getStatusLabel, getStatusColorClasses, type OrderStatus } from '@/lib/status-display';

type Job = {
  id: number;
  clientId: number;
  clientName?: string | null;
  clientPhone?: string | null;
  displayId: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  freelancerDeadline?: string;
  status: string;
  assignedFreelancerId: number | null;
  clientPreferredFreelancer?: number | null;
  preferredFreelancerName?: string | null;
  preferredSpecialistSlug?: string | null;
  managerId?: number | null;
  freelancerName?: string | null;
  freelancerPhone?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
  adminApproved: boolean;
  createdAt: string;
  singleSpaced: boolean | null;
  baseCpp: number | null;
  effectiveCpp: number | null;
  clientCpp?: number | null;
  totalAmount?: number | null;
  statusTotalAmount?: number | null;
  freelancerEarnings?: number | null;
  managerEarnings?: number | null;
  clientBonus?: number | null;
  managerAdditional?: number | null;
};

type Bid = {
  id: number;
  jobId: number;
  freelancerId: number;
  bidAmount: number;
};

const CLIENT_SLIDE_RATE = 150;

const coerceBoolean = (value: boolean | number | null | undefined) => value === true || value === 1;

const computeClientAmount = (job: Job): number => {
  if (typeof job.statusTotalAmount === 'number' && job.statusTotalAmount > 0) {
    return job.statusTotalAmount;
  }

  if (typeof job.totalAmount === 'number' && job.totalAmount > 0) {
    return job.totalAmount;
  }

  const pages = job.pages ?? 0;
  const slides = job.slides ?? 0;
  const pageMultiplier = coerceBoolean(job.singleSpaced) ? 2 : 1;
  const baseCpp = job.clientCpp ?? job.effectiveCpp ?? job.baseCpp;

  const baseAmount = baseCpp && baseCpp > 0 && pages > 0
    ? baseCpp * pages * pageMultiplier
    : 0;

  const slidesAmount = slides > 0 ? slides * CLIENT_SLIDE_RATE : 0;
  const adjustments = (job.clientBonus ?? 0) + (job.managerAdditional ?? 0);

  if (baseAmount > 0 || slidesAmount > 0) {
    return baseAmount + slidesAmount + adjustments;
  }

  return job.amount ?? 0;
};

const computeDisplayCpp = (job: Job): number => {
  if (job.clientCpp && job.clientCpp > 0) return job.clientCpp;
  if (job.effectiveCpp && job.effectiveCpp > 0) return job.effectiveCpp;
  if (job.baseCpp && job.baseCpp > 0) return job.baseCpp;

  const pages = job.pages ?? 0;
  if (pages <= 0) return 0;

  const pageMultiplier = coerceBoolean(job.singleSpaced) ? 2 : 1;
  const effectivePages = pages * Math.max(pageMultiplier, 1);
  if (effectivePages <= 0) return 0;

  const slides = job.slides ?? 0;
  const slidesAmount = slides > 0 ? slides * CLIENT_SLIDE_RATE : 0;
  const referenceAmount = (job.statusTotalAmount ?? job.totalAmount ?? job.amount ?? 0) - slidesAmount;

  if (referenceAmount <= 0) return 0;

  return referenceAmount / effectivePages;
};

function AdminJobsPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<{[key: number]: Bid[]}>({});
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingOrderId, setApprovingOrderId] = useState<number | null>(null);
  const hasCheckedAuth = useRef(false);

  // Get filter from URL query params
  const statusParam = (searchParams?.get('status') || '').toLowerCase();
  const allowed = [
    'all','pending','accepted','approved','in_progress','editing','delivered','completed','paid','on_hold','cancelled','revision','revisions'
  ];
  const statusFilter = (() => {
    if (!statusParam) return 'all';
    if (statusParam === 'revisions') return 'revision';
    // Map legacy 'assigned' to 'in_progress'
    if (statusParam === 'assigned') return 'in_progress';
    return allowed.includes(statusParam) ? statusParam : 'all';
  })();

  // Legacy alias retained for downstream components that still rely on a `filter` variable.
  // Ensures we don't break older memoized callbacks when the file hot-reloads client-side.
  const filter = statusFilter;

  // Countdown helper (no live timer - just calculate once per render)
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

  const fetchJobs = async (silent = false) => {
    try {
      if (!silent) setLoadingJobs(true);
      if (!silent) setRefreshing(true);
      
      const response = await safeApiFetch('/api/v2/orders', {
        credentials: 'include',
        next: { revalidate: 30 },
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
        
        // Fetch bids count for each job
        data.forEach(async (job: Job) => {
          const bidsResponse = await safeApiFetch(`/api/bids?jobId=${job.id}`, {
            credentials: 'include',
          });
          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            setBids(prev => ({ ...prev, [job.id]: bidsData }));
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (!silent) toast.error('Failed to fetch orders');
    } finally {
      setLoadingJobs(false);
      setRefreshing(false);
    }
  };

  // Auth check - runs once
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      router.replace('/');
    } else {
      fetchJobs();
    }
  }, [loading, user, router]);

  const handleManualRefresh = () => {
    fetchJobs(false);
    toast.success('Refreshing orders...');
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'all') return true;
    if (filter === 'on_hold') return j.status === 'on_hold';
    
    // in_progress now includes all work being done (assigned status removed)
    if (filter === 'in_progress') {
      return j.status === 'in_progress';
    }
    
    return j.status === filter;
  });

  const approveOrder = async (orderId: number) => {
    if (!user) return false;
    setApprovingOrderId(orderId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await safeApiFetch(`/api/jobs/${orderId}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: 'accepted', adminApproved: true, changedBy: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(extractErrorMessage(errorData, 'Failed to accept order'));
        return false;
      }

      toast.success('Order accepted and ready for assignment');
      await fetchJobs(true);
      return true;
    } catch (error) {
      console.error('[Admin Jobs] Failed to accept order:', error);
      toast.error('Failed to accept order. Please try again.');
      return false;
    } finally {
      setApprovingOrderId(null);
    }
  };

  const handleApproveClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    await approveOrder(orderId);
  };

  const handleApproveAndAssignClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const approved = await approveOrder(orderId);
    if (approved) {
      toast.success('Redirecting to assignment workspace');
      router.push(`/admin/orders/${orderId}`);
    }
  };

  const handleOpenAssignPage = (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    router.push(`/admin/orders/${orderId}`);
  };

  // Status badges with role-specific labels
  const getStatusBadge = (status: string) => {
    const statusLabel = getStatusLabel(status as OrderStatus, 'admin');
    const colorClasses = getStatusColorClasses(status as OrderStatus);
    return <Badge className={`${colorClasses} capitalize text-xs`}>{statusLabel}</Badge>;
  };

  // Quick counts for stats
  const count = (s: string) => jobs.filter(j => j.status === s).length;
  const total = jobs.length;
  
  // Special counts for in_progress
  // Note: 'assigned' status no longer exists - orders go directly to in_progress when freelancer is assigned
  const assignedNotAccepted = 0; // Deprecated - always 0
  const inProgressCount = jobs.filter(j => 
    j.status === 'in_progress'
  ).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="order-container py-4">
      <div className="order-header">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
          <div>
            <h1 className="order-title mb-1">Order Management</h1>
            <p className="order-subtitle">
              View and manage all orders on the platform
            </p>
          </div>
          <div className="order-actions">
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="order-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* At-a-glance compact stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-4">
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-lg font-black text-foreground mt-0.5">{total}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</p>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{count('pending')}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">In Progress</p>
          <p className="text-lg font-black text-primary mt-0.5">{inProgressCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Delivered</p>
          <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">{count('delivered')}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Revisions</p>
          <p className="text-lg font-black text-orange-600 dark:text-orange-400 mt-0.5">{count('revision')}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{count('completed')}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-sm">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Cancelled</p>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{count('cancelled')}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => {
        const status = value === 'all' ? '' : (value === 'revision' ? 'revisions' : value);
        const url = status ? `/admin/jobs?status=${status}` : '/admin/jobs';
        router.push(url);
      }} className="mb-4">
        <TabsList className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-xl h-auto scrollbar-none w-full flex-wrap sm:flex-nowrap">
          <TabsTrigger value="all" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">All ({total})</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Pending ({count('pending')})</TabsTrigger>
          <TabsTrigger value="accepted" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Accepted</TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">In Progress ({inProgressCount})</TabsTrigger>
          <TabsTrigger value="editing" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Editing</TabsTrigger>
          <TabsTrigger value="delivered" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Delivered ({count('delivered')})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Approved</TabsTrigger>
          <TabsTrigger value="paid" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Paid</TabsTrigger>
          <TabsTrigger value="revision" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Revisions ({count('revision')})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Completed ({count('completed')})</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">Cancelled</TabsTrigger>
        </TabsList>

        {/* Orders list - Card based */}
        <TabsContent value={statusFilter} className="mt-2">
          <Card className="rounded-xl border border-border/70 shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-2xl capitalize">{statusFilter.replace('_', ' ')} Orders</CardTitle>
              <CardDescription>
                  {statusFilter === 'all' && 'All orders regardless of status'}
                  {statusFilter === 'pending' && 'Orders waiting for admin approval before being available for assignment'}
                  {statusFilter === 'approved' && 'Orders approved by client after delivery, awaiting payment confirmation'}
                  {statusFilter === 'accepted' && 'Orders approved by admin and ready to assign to freelancers'}
                  {statusFilter === 'in_progress' && 'Orders currently being worked on'}
                  {statusFilter === 'editing' && 'Orders submitted by freelancers awaiting admin review'}
                  {statusFilter === 'delivered' && 'Orders delivered to client and awaiting client approval'}
                  {statusFilter === 'paid' && 'Orders that have been paid for by the client'}
                  {statusFilter === 'completed' && 'Successfully completed orders'}
                  {statusFilter === 'on_hold' && 'Orders temporarily paused or on hold'}
                  {statusFilter === 'cancelled' && 'Orders cancelled by the client or admin'}
                  {statusFilter === 'revision' && 'Orders in revision stage'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading orders...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-xl">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-foreground mb-2">No orders found</p>
                  <p className="text-muted-foreground">
                    No orders match the selected filter
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => {
                      const jobBids = bids[job.id] || [];
                      const lowestBid = jobBids.length > 0 ? Math.min(...jobBids.map(b => b.bidAmount)) : null;
                      const deadlineToUse = (job as any).freelancerDeadline || job.deadline;
                      const cd = getCountdown(deadlineToUse);
                      const deadlineDate = deadlineToUse ? new Date(deadlineToUse) : null;
                      const hasValidDeadline = !!deadlineDate && !isNaN(deadlineDate.getTime());
                      const formattedDeadline = hasValidDeadline ? format(deadlineDate, 'MMM dd, yyyy') : 'No deadline';
                      const createdAtDate = job.createdAt ? new Date(job.createdAt) : null;
                      const formattedCreatedAt = createdAtDate && !isNaN(createdAtDate.getTime())
                        ? format(createdAtDate, 'MMM dd, yyyy')
                        : 'Unknown';
                      const clientAmount = computeClientAmount(job);
                      const safeClientAmount = Number.isFinite(clientAmount) ? clientAmount : 0;
                      const computedCpp = computeDisplayCpp(job);
                      const isSingleSpaced = coerceBoolean(job.singleSpaced);
                      return (
                        <OrderRow
                          key={job.id}
                          orderId={job.id}
                          roleOverride="admin"
                          className="order-card-compact"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3.5 mb-2.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3.5 mb-1.5 flex-wrap">
                                <h3 className="font-bold text-base text-foreground">
                                  {job.title}
                                </h3>
                                {job.displayId && (
                                  <span className="order-badge font-mono">
                                    {job.displayId}
                                  </span>
                                )}
                                {job.displayId && (
                                  <OrderLink
                                    orderId={job.id}
                                    displayId={job.displayId}
                                    className="bg-transparent hover:bg-primary/10"
                                    title="Open canonical order detail"
                                    roleOverride="admin"
                                  />
                                )}
                                {isSingleSpaced && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 text-xs rounded-lg">
                                    <AlignJustify className="w-4 h-4 mr-1" />
                                    SS
                                  </Badge>
                                )}
                                {jobBids.length > 0 && (
                                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200 text-xs rounded-lg">
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    {jobBids.length} {jobBids.length === 1 ? 'Bid' : 'Bids'}
                                  </Badge>
                                )}
                                {(job.preferredFreelancerName || job.clientPreferredFreelancer || job.preferredSpecialistSlug) && (
                                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs rounded-lg">
                                    Preferred: {job.preferredFreelancerName || job.preferredSpecialistSlug?.replace(/-/g, ' ') || `#${job.clientPreferredFreelancer}`}
                                  </Badge>
                                )}
                              </div>
                              {job.clientName && (
                                <p className="text-xs text-muted-foreground mb-1.5">
                                  Client: <span className="font-medium">{job.clientName}</span>
                                  {job.clientPhone && job.clientPhone !== '+0000000000' && (
                                    <span className="ml-2 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{job.clientPhone}</span>
                                  )}
                                </p>
                              )}
                              {job.managerName && (
                                <p className="text-xs text-muted-foreground mb-1.5">
                                  Manager: <span className="font-medium text-blue-600 dark:text-blue-400">{job.managerName}</span>
                                  {job.managerPhone && job.managerPhone !== '+0000000000' && (
                                    <span className="ml-2 text-xs font-mono bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">{job.managerPhone}</span>
                                  )}
                                </p>
                              )}
                              {job.freelancerName && (
                                <p className="text-xs text-muted-foreground mb-1.5">
                                  Writer: <span className="font-medium text-green-600 dark:text-green-400">{job.freelancerName}</span>
                                  {job.freelancerPhone && job.freelancerPhone !== '+0000000000' && (
                                    <span className="ml-2 text-xs font-mono bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded">{job.freelancerPhone}</span>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(job.status)}
                            </div>
                          </div>
                          <div className="order-meta">
                            <span className="capitalize font-medium">{job.workType}</span>
                            <span></span>
                            {job.pages && (
                              <>
                                <span>{job.pages} pg{job.pages > 1 ? 's' : ''}</span>
                                <span></span>
                              </>
                            )}
                            {job.slides && (
                              <>
                                <span>{job.slides} sl{job.slides > 1 ? 's' : ''}</span>
                                <span></span>
                              </>
                            )}
                            <span className="font-bold text-green-600">
                              KSh {safeClientAmount.toFixed(2)}
                            </span>
                            {computedCpp > 0 && (
                              <>
                                <span></span>
                                <span className="text-xs">(CPP: {computedCpp.toFixed(0)})</span>
                              </>
                            )}
                            {lowestBid && lowestBid < safeClientAmount && (
                              <>
                                <span></span>
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Bid: KSh {lowestBid.toFixed(2)}
                                </span>
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
                              {formattedCreatedAt}
                            </span>
                          </div>
                          {(job.status === 'pending' || job.status === 'accepted') && (
                            <div className="mt-2.5 flex flex-wrap gap-3">
                              {job.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="order-button bg-green-600 hover:bg-green-700"
                                    disabled={approvingOrderId === job.id}
                                    onClick={(event) => handleApproveClick(event, job.id)}
                                  >
                                    {approvingOrderId === job.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="order-button"
                                    disabled={approvingOrderId === job.id}
                                    onClick={(event) => handleApproveAndAssignClick(event, job.id)}
                                  >
                                    {approvingOrderId === job.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <UserPlus className="w-4 h-4" />
                                    )}
                                    Accept &amp; Assign
                                  </Button>
                                </>
                              )}
                              {job.status === 'accepted' && (
                                <Button
                                  size="sm"
                                  className="order-button"
                                  onClick={(event) => handleOpenAssignPage(event, job.id)}
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Assign Freelancer
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
  );
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <AdminJobsPageContent />
    </Suspense>
  );
}
