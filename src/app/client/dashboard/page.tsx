"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Wallet,
  Sparkles,
  Calculator,
  MessageSquareQuote,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import BalanceWidget from '@/components/BalanceWidget';
import { AcademicToolsWidget } from '@/components/academic-tools-widget';
import { useAuth } from '@/lib/auth-context-v2';
import { extractErrorMessage, unwrapOrderList } from '@/lib/client-api-helpers';

async function safeReadJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const safeToISOString = (value: unknown): string => {
  if (value == null) return '';
  const date = new Date(value as any);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

type Job = {
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
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, loading } = useDashboardProtection(['client', 'account_owner']);
  const { logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const hasFetchedJobs = useRef(false);
  const authErrorHandledRef = useRef(false);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    try {
      const timestamp = Date.now();
      const roleParam = user.role === 'account_owner' ? 'account_owner' : 'client';
      const response = await safeApiFetch(`/api/v2/orders?userId=${user.id}&role=${roleParam}&_t=${timestamp}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await safeReadJson(response);
        const orders = unwrapOrderList<any>(data);
        if (!orders.length && data && !Array.isArray((data as any)?.orders)) {
          toast.error('Unexpected response while loading orders.');
          return;
        }
        const mapped: Job[] = orders.map((o: any) => ({
          id: o.id,
          displayId: o.orderNumber || `#TL-${o.id}`,
          title: o.title || 'Untitled Order',
          workType: o.workType || 'Academic Paper',
          amount: Number(o.clientTotal ?? 0),
          status: o.status,
          deadline: safeToISOString(o.deadline),
          actualDeadline: safeToISOString(o.deadline),
          createdAt: safeToISOString(o.createdAt),
          pages: o.pageCount || null,
          slides: o.slideCount || null,
        }));
        setJobs(mapped);
      } else {
        if (response.status === 401 && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }

        const errorData = (await safeReadJson(response)) ?? { error: 'Unknown error' };
        toast.error(extractErrorMessage(errorData, `Failed to load orders (${response.status})`));
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Network error loading orders');
    } finally {
      setLoadingJobs(false);
    }
  }, [user, logout]);

  useEffect(() => {
    if (loading || !user) return;
    
    if (!hasFetchedJobs.current) {
      hasFetchedJobs.current = true;
      fetchJobs();
    }
  }, [user, loading, fetchJobs]);

  if (loading || !user) {
    return <DashboardLoader />;
  }

  const activeOrders = jobs.filter(j => ['approved', 'in_progress', 'editing', 'submitted', 'assigned'].includes(j.status));
  const revisionOrders = jobs.filter(j => ['revision', 'client_revision', 'internal_revision'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const deliveredJobs = jobs.filter(j => j.status === 'delivered');
  const activeAndPaidJobs = jobs.filter(j => !['cancelled', 'canceled', 'on_hold', 'on-hold', 'pending'].includes(j.status));
  const totalSpent = activeAndPaidJobs.reduce((sum, job) => sum + job.amount, 0);
  const completionRate = jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Account Pending Approval Alert */}
      {(!user.approved || (user.status !== 'active' && user.status !== 'approved')) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <h3 className="font-bold text-amber-900 dark:text-amber-300">Account Pending Verification</h3>
            <p className="text-amber-800/90 dark:text-amber-400 mt-1 leading-relaxed">
              Your client profile is being reviewed by our compliance team. You will receive an instant email confirmation once activated.
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Client Portal
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {user.role === 'account_owner' ? 'Enterprise Lead' : 'Direct Client'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{user.name?.split(' ')[0] || 'Client'}</span> • Manage research projects, milestones &amp; deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border hover:bg-muted/80 text-xs font-semibold h-9 px-3.5"
          >
            <Link href="/client/pricing-calculator" className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-primary" />
              <span>CPP Calculator</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-9 px-4 shadow-md shadow-primary/25 hover:shadow-lg transition-all text-xs"
          >
            <Link href="/client/new-job" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4 font-bold" />
              <span>Create Order</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 4-Item Compact KPI Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Orders */}
        <Link
          href="/client/in-progress"
          className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors">
              {activeOrders.length}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Revisions & Feedback */}
        <Link
          href="/client/revisions"
          className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-[#5B3594]/50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">In Revision</span>
            <div className="w-7 h-7 rounded-lg bg-[#5B3594]/10 text-[#5B3594] dark:text-purple-400 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-foreground group-hover:text-[#5B3594] transition-colors">
              {revisionOrders.length}
            </span>
            <span className="text-[10px] font-semibold text-[#5B3594] dark:text-purple-400 flex items-center gap-0.5">
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Completed Deliverables */}
        <Link
          href="/client/completed"
          className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-emerald-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-foreground group-hover:text-emerald-600 transition-colors">
              {completedJobs.length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <span>{completionRate}% success</span>
            </span>
          </div>
        </Link>

        {/* Total Investment / Spent */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Value</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-foreground">
              KSh {totalSpent.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {jobs.length} projects
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Orders Feed + Right Compact Side Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Live Active Orders */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground">Active Deliverables</h2>
              <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeOrders.length} in progress
              </Badge>
            </div>
            <Link
              href="/client/orders"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>All Orders ({jobs.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {loadingJobs ? (
              <div className="p-6 text-center bg-card border border-border rounded-xl">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Fetching live orders...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-card border border-dashed border-border rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">No active orders right now</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-3.5 leading-relaxed">
                  Submit a new academic paper, SPSS data analysis, or proposal to get matched with a verified specialist.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-4 text-xs h-8"
                >
                  <Link href="/client/new-job">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Place Order
                  </Link>
                </Button>
              </div>
            ) : (
              activeOrders.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  onClick={() => router.push(`/client/orders/${job.id}`)}
                  className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-primary/50 transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {job.displayId}
                      </span>
                      <span className="text-[10px] font-bold text-primary">
                        {job.workType}
                      </span>
                      {job.pages ? (
                        <span className="text-[10px] text-muted-foreground">• {job.pages} pages</span>
                      ) : null}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {job.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>
                        {job.actualDeadline
                          ? `Due: ${new Date(job.actualDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : 'Deadline pending'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      KSh {job.amount.toLocaleString()}
                    </span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold capitalize px-2 py-0.5">
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Column: Balance Card & Dedicated Manager Lead */}
        <div className="space-y-3">
          {/* Balance Widget */}
          <BalanceWidget
            userId={user.id}
            variant="compact"
            showWithdrawButton={false}
            autoRefresh={true}
          />

          {/* Dedicated Manager Support Box */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Dedicated Project Lead</h4>
                <p className="text-[10px] text-muted-foreground">Direct 24/7 WhatsApp Support</p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Need urgent instructions or revisions? Chat live with your assigned lead manager.
            </p>

            <a
              href="https://wa.me/254701066845?text=Hello%20TaskLynk%20Lead,%20I%20need%20assistance%20with%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition-all shadow-sm"
            >
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Academic & AI Verification Tools */}
          <AcademicToolsWidget />
        </div>
      </div>
    </div>
  );
}
