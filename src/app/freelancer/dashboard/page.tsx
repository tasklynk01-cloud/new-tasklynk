"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDashboardProtection } from '@/lib/useDashboardProtection';
import { useAuth } from '@/lib/auth-context-v2';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Award,
  Wallet,
  TrendingUp,
  FileCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import AssignmentPopup from '@/components/AssignmentPopup';
import BalanceWidget from '@/components/BalanceWidget';
import CPPProgressWidget from '@/components/CPPProgressWidget';
import { TierProgress } from '@/components/tier-progress';
import ResponseStatsWidget from '@/components/ResponseStatsWidget';
import { PushNotificationBanner } from '@/components/push-notification-banner';
import { AcademicToolsWidget } from '@/components/academic-tools-widget';
import type { FreelancerBadge } from '@/lib/status-calculator';
import { getFreelancerEarnings } from '@/lib/order-pricing';

const FREELANCER_BADGES: readonly FreelancerBadge[] = ['bronze', 'silver', 'gold', 'platinum', 'elite'] as const;

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  status: string;
  deadline: string | null;
  pages: number | null;
  slides: number | null;
};

const toIsoOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(value as any);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
};

const formatDeadlineLabel = (deadline: string | null): string => {
  if (!deadline) return 'Pending';
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return 'Pending';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (diffMs <= 0) return 'Overdue';
  if (days > 0) return `${days}d ${remainingHours}h left`;
  return `${Math.max(1, totalHours)}h left`;
};

async function safeReadJson(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function FreelancerDashboard() {
  const { user, loading } = useDashboardProtection('freelancer');
  const { logout } = useAuth();
  const router = useRouter();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const hasFetchedData = useRef(false);
  const [showAssignmentPopup, setShowAssignmentPopup] = useState(false);
  const [hasPendingAssignments, setHasPendingAssignments] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const authErrorHandledRef = useRef(false);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoadingJobs(true);
    setDashboardError(null);
    try {
      const timestamp = Date.now();
      if (user.approved) {
        const response = await safeApiFetch(`/api/v2/orders?userId=${user.id}&role=freelancer&_=${timestamp}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await safeReadJson(response);
          const mapped: Job[] = (data?.orders || []).map((o: any) => ({
            id: o.id,
            displayId: o.orderNumber || o.displayId || `#TL-${o.id}`,
            title: o.title || 'Untitled Job',
            workType: o.workType || 'Academic Research',
            amount: getFreelancerEarnings(o, user?.completedJobs || 0),
            status: o.status,
            deadline: toIsoOrNull(o.deadline),
            pages: o.pages || o.pageCount || null,
            slides: o.slides || o.slideCount || null,
          }));
          setMyJobs(mapped);
        } else {
          const data = await safeReadJson(response);
          const message = extractErrorMessage(data, `Failed to load orders (${response.status})`);

          if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
            authErrorHandledRef.current = true;
            toast.error('Session expired. Please log in again.');
            await logout();
            return;
          }

          setMyJobs([]);
          setDashboardError(message);
        }

        // Check for pending assignments
        const token = localStorage.getItem('bearer_token');
        const assignmentCheck = await safeApiFetch('/api/v2/freelancer/assignments/check', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
          credentials: 'include',
        });
        if (assignmentCheck.ok) {
          const assignmentData = (await safeReadJson(assignmentCheck)) ?? {};
          const hasPending = assignmentData.hasNew || false;
          setHasPendingAssignments(hasPending);
          setShowAssignmentPopup(hasPending);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      const message = error instanceof Error ? error.message : 'Network error. Please try again.';
      setDashboardError(message);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (loading || !user) return;
    
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchDashboardData();
    }
  }, [loading, user]);

  const stats = useMemo(() => {
    const availableJobs = myJobs.filter(j => j.status === 'available' || j.status === 'accepted').length;
    const inProgressJobs = myJobs.filter(j => ['in_progress', 'in-progress', 'assigned', 'editing'].includes(j.status)).length;
    const completedJobs = myJobs.filter(j => j.status === 'completed' || j.status === 'approved' || j.status === 'paid').length;
    const revisionJobs = myJobs.filter(j => ['revision', 'internal_revision', 'client_revision'].includes(j.status)).length;

    return {
      availableJobs,
      inProgressJobs,
      completedJobs,
      revisionJobs,
    };
  }, [myJobs]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading specialist workspace...</p>
        </div>
      </div>
    );
  }

  const activeWorkList = myJobs.filter(j => ['in_progress', 'in-progress', 'assigned', 'editing', 'revision', 'internal_revision', 'client_revision'].includes(j.status));
  const availableWorkList = myJobs.filter(j => j.status === 'available' || j.status === 'accepted');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Account Pending Approval Alert */}
      {(!user.approved || user.status === 'pending' || user.status === 'pending_approval') && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <h3 className="font-bold text-amber-900 dark:text-amber-300">Application Under Review</h3>
            <p className="text-amber-800/90 dark:text-amber-400 mt-1 leading-relaxed">
              Your writer credentials and selected subjects are undergoing editorial verification. You will be notified via email once approved to take on live assignments.
            </p>
          </div>
        </div>
      )}

      {/* Assignment Popup Modal */}
      {showAssignmentPopup && hasPendingAssignments && (
        <AssignmentPopup
          onAssignmentHandled={() => {
            setShowAssignmentPopup(false);
            setHasPendingAssignments(false);
            fetchDashboardData();
          }}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Specialist Portal
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Verified Writer
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{user.name?.split(' ')[0] || 'Writer'}</span> • Track active writing milestones, deadlines &amp; earnings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border hover:bg-muted/80 text-xs font-semibold h-9 px-3.5"
          >
            <Link href="/freelancer/available" className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span>Available Jobs ({stats.availableJobs})</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-9 px-4 shadow-md shadow-primary/25 hover:shadow-lg transition-all text-xs"
          >
            <Link href="/freelancer/financial-overview" className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 font-bold" />
              <span>Withdraw Payout</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Push Notification Radar Banner */}
      <PushNotificationBanner userId={user?.id} />

      {/* 4-Item Compact KPI Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Available to Claim */}
        <Link
          href="/freelancer/available"
          className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Available Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-foreground group-hover:text-blue-600 transition-colors">
              {stats.availableJobs}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
              <span>Claim</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Active & In Progress */}
        <Link
          href="/freelancer/in-progress"
          className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors">
              {stats.inProgressJobs}
            </span>
            <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5">
              <span>Manage</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Urgent Revisions */}
        <Link
          href="/freelancer/revisions"
          className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-amber-500/50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Revisions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-foreground group-hover:text-amber-600 transition-colors">
              {stats.revisionJobs}
            </span>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <span>Review</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Completed Deliverables */}
        <Link
          href="/freelancer/completed"
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
              {stats.completedJobs}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <span>Payouts</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* Main Grid: Active Work Feed + Right Side Progression & Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Live Active Assignments */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground">Current Active Queue</h2>
              <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeWorkList.length} active
              </Badge>
            </div>
            <Link
              href="/freelancer/in-progress"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>In-Progress ({stats.inProgressJobs})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {loadingJobs ? (
              <div className="p-6 text-center bg-card border border-border rounded-xl">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Fetching assigned files...</p>
              </div>
            ) : activeWorkList.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-card border border-dashed border-border rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">No active assignments in queue</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-3.5 leading-relaxed">
                  Browse available academic orders or wait for your dedicated manager to assign you fresh projects.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-4 text-xs h-8"
                >
                  <Link href="/freelancer/available">
                    <Briefcase className="w-3.5 h-3.5 mr-1" />
                    Browse Available Jobs ({stats.availableJobs})
                  </Link>
                </Button>
              </div>
            ) : (
              activeWorkList.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  onClick={() => router.push(`/freelancer/jobs/${job.id}`)}
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
                      <span>Due: {formatDeadlineLabel(job.deadline)}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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

        {/* Right 1 Column: Balance, CPP Level, Tier Progression */}
        <div className="space-y-3">
          {/* Balance Widget */}
          <BalanceWidget
            userId={user.id}
            variant="compact"
            showWithdrawButton={true}
            onWithdrawClick={() => router.push('/freelancer/financial-overview')}
            autoRefresh={true}
          />

          {/* Tier & CPP Progress */}
          <TierProgress userId={user.id} />
          <CPPProgressWidget freelancerId={user.id} />

          {/* Specialist Tools */}
          <AcademicToolsWidget />
        </div>
      </div>
    </div>
  );
}
