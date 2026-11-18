"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Upload, Timer, FileText } from 'lucide-react';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getFreelancerEarnings } from '@/lib/order-pricing';
import { useFreelancerOrderCounts } from '@/hooks/use-freelancer-order-counts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Job = {
  id: number;
  clientId: number;
  displayId: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  freelancerEarnings?: number | null;
  singleSpaced?: boolean | null;
  deadline: string;
  actualDeadline: string;
  freelancerDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  adminApproved: boolean;
  createdAt: string;
};

export default function InProgressPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const { refetch: refetchCounts } = useFreelancerOrderCounts(user?.id);

  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [titleQuery, setTitleQuery] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else if (!user.approved) {
        router.push('/freelancer/dashboard');
      } else {
        fetchJobs();
        
        const interval = setInterval(() => {
          fetchJobs();
        }, 15000);
        
        return () => clearInterval(interval);
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    if (!user || !user.id) {
      console.warn('[In Progress] Cannot fetch jobs: user or user.id is undefined');
      setLoadingJobs(false);
      return;
    }
    
    setLoadingJobs(true);
    try {
      const timestamp = Date.now();
      const response = await safeApiFetch(
        `/api/v2/orders?userId=${user.id}&role=freelancer&_=${timestamp}`, 
        { 
          cache: 'no-store',
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const allJobs = data.orders || [];
        
        const relevantJobs = allJobs.filter((j: any) => 
          (j.status === 'in_progress' || j.status === 'in-progress') &&
          j.assignedFreelancerId === user.id
        );
        
        const mapped = relevantJobs.map((o: any) => ({
          id: o.id,
          clientId: o.clientId,
          displayId: o.displayId || o.orderNumber || `#${o.id}`,
          title: o.title || 'Untitled Order',
          instructions: o.instructions || '',
          workType: o.workType || 'general',
          pages: o.pages ?? o.pageCount ?? null,
          slides: o.slides ?? o.slideCount ?? null,
          amount: Number(o.amount) || 0,
          freelancerEarnings: o.freelancerEarnings,
          singleSpaced: o.singleSpaced,
          deadline: o.deadline || new Date().toISOString(),
          actualDeadline: o.actualDeadline || o.deadline || new Date().toISOString(),
          freelancerDeadline: o.freelancerDeadline || o.actualDeadline || o.deadline || new Date().toISOString(),
          status: o.status,
          assignedFreelancerId: o.assignedFreelancerId ?? null,
          adminApproved: true,
          createdAt: o.createdAt || new Date().toISOString(),
        })) as Job[];
        
        setJobs(mapped);
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch orders' }));
        console.error('[In Progress] API error:', error, response.status);
      }
    } catch (error) {
      console.error('[In Progress] Failed to fetch jobs:', error);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleRefresh = () => {
    fetchJobs();
    refetchCounts?.();
  };

  const applyFilters = (list: Job[]) => {
    return list.filter((job) => {
      const wtOk = workTypeFilter === 'all' || job.workType.toLowerCase().includes(workTypeFilter.toLowerCase());
      const titleOk = !titleQuery || job.title.toLowerCase().includes(titleQuery.toLowerCase());
      return wtOk && titleOk;
    });
  };

  const displayedJobs = applyFilters(jobs);

  if (loading || loadingJobs) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              In-Progress Assignments
            </h1>
            <Badge className="bg-primary text-primary-foreground font-bold px-2 py-0.5 text-xs rounded-full">
              {jobs.length} active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active writing jobs assigned to you. Track your deadlines and upload deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-3 rounded-xl border-border text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 text-xs shadow-sm"
          >
            <Link href="/freelancer/available">
              Browse More Jobs
            </Link>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <Input
            placeholder="Search by topic, paper title, or order ID..."
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-muted/30 border-border/70 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-[150px] rounded-lg border-border/70">
              <SelectValue placeholder="Work Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
              <SelectItem value="research">Research Paper</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>

          {(titleQuery || workTypeFilter !== 'all') && (
            <Button
              onClick={() => {
                setTitleQuery('');
                setWorkTypeFilter('all');
              }}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      {displayedJobs.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/70 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">No Active Orders In Progress</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            {jobs.length === 0 
              ? "You don't have any ongoing assignments. Browse the open writing queue to bid on jobs."
              : "No orders match your filter criteria."}
          </p>
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-4 text-xs"
          >
            <Link href="/freelancer/available">Find Available Jobs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {displayedJobs.map((job) => {
            const earnings = getFreelancerEarnings(job, user?.completedJobs || 0);
            const deadlineDate = new Date(job.freelancerDeadline);
            const hoursLeft = differenceInHours(deadlineDate, new Date());
            const isUrgent = hoursLeft <= 24 && hoursLeft >= 0;
            const isOverdue = hoursLeft < 0;
            
            return (
              <div
                key={job.id}
                className="p-4 rounded-xl bg-card border border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  {/* Header & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {job.displayId}
                    </span>
                    <Badge
                      className={`text-[10px] font-bold px-2 py-0.5 ${
                        isOverdue ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        isUrgent ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {isOverdue ? 'Overdue!' : isUrgent ? 'Due Soon' : 'In Progress'}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>

                  {/* Countdown Timer Strip */}
                  <div
                    className={`rounded-lg p-2.5 flex items-center justify-between text-xs border ${
                      isOverdue ? 'bg-destructive/5 border-destructive/20 text-destructive' :
                      isUrgent ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300' :
                      'bg-muted/40 border-border/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{isOverdue ? 'Overdue by ' : 'Due '}{formatDistanceToNow(deadlineDate, { addSuffix: !isOverdue })}</span>
                    </div>
                    <span className="text-[10px] font-semibold opacity-75">
                      {format(deadlineDate, 'MMM dd · h:mm a')}
                    </span>
                  </div>

                  {/* Details Matrix */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-medium">Pages</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{job.pages || 0} pgs</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-medium">Type</p>
                      <p className="text-xs font-bold text-foreground mt-0.5 capitalize truncate">{job.workType}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Earnings</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">KSh {earnings.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-lg h-7 px-3 text-xs shadow-sm"
                  >
                    <Link href={`/freelancer/orders/${job.id}`}>
                      <Upload className="w-3 h-3 mr-1" />
                      Workspace &amp; Submit
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 rounded-lg border-border text-xs"
                  >
                    <Link href={`/freelancer/messages?orderId=${job.id}`}>
                      Chat
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
