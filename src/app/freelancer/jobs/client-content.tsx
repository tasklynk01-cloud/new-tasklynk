"use client";

import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculateFreelancerEarnings } from '@/lib/freelancer-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CountdownTimer } from '@/components/countdown-timer';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export type Job = {
  id: number;
  clientId: number;
  clientName?: string | null;
  displayId: string;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  actualDeadline: string;
  freelancerDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  adminApproved: boolean;
  createdAt: string;
};

const STATUS_MAP: Record<string, string[]> = {
  // Available orders are handled on /freelancer/orders
  'available': ['available'],
  // On hold should only include explicit on_hold states
  'on-hold': ['on_hold', 'on-hold'],
  // In progress - assignment goes directly to in_progress (no separate assigned stage)
  'in-progress': ['in_progress'],
  // Separate editing from in_progress for clarity
  'editing': ['editing'],
  // Delivered is distinct from done
  'delivered': ['delivered'],
  // Revision should include both internal and client revisions, plus legacy 'revision'
  'revision': ['internal_revision', 'client_revision', 'revision'],
  'approved': ['approved'],
  'completed': ['completed'],
  'cancelled': ['cancelled', 'canceled'],
};

// Page titles and captions based on status
const PAGE_CONTENT: Record<string, { title: string; caption: string }> = {
  'available': {
    title: 'Available Orders',
    caption: 'Browse orders approved by admin/manager that are ready for assignment. Place bids or wait for direct assignment.'
  },
  'on-hold': {
    title: 'On Hold',
    caption: 'View orders temporarily paused or awaiting clarification from admin or client before proceeding.'
  },
  'in-progress': {
    title: 'In Progress',
    caption: 'Track ongoing projects currently under your work. Update files, request feedback, and ensure timely delivery.'
  },
  'editing': {
    title: 'Editing',
    caption: 'Access tasks returned for editing or improvement. Make necessary corrections before resubmitting to admin.'
  },
  // Removed 'done' – use Delivered/Approved/Completed explicitly
  'delivered': {
    title: 'Delivered',
    caption: 'Orders successfully delivered to the client. Monitor for client approval or revision requests.'
  },
  'revision': {
    title: 'Revision',
    caption: 'View orders that have been sent back for revision. Address client feedback and re-upload updated work.'
  },
  'approved': {
    title: 'Approved',
    caption: 'View tasks officially approved by clients and confirmed by admin. Payment pending or being processed.'
  },
  'completed': {
    title: 'Completed',
    caption: 'Explore fully completed and paid orders. Review earnings and client ratings for your portfolio.'
  },
  'cancelled': {
    title: 'Cancelled',
    caption: 'View orders that have been cancelled by admin or client. Access status notes or reasons for cancellation.'
  },
};

// Debounce hook for search inputs
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized Stats Card Component
const StatsCard = memo(({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
));
StatsCard.displayName = 'StatsCard';

// Skeleton loading for stats
const StatsCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
);

// Skeleton loading for table
const TableSkeleton = () => (
  <div className="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[110px]">Order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead className="hidden md:table-cell text-right">Earnings</TableHead>
          <TableHead className="hidden md:table-cell text-center">Pg</TableHead>
          <TableHead className="hidden md:table-cell text-center">Sl</TableHead>
          <TableHead className="hidden lg:table-cell">Deadline</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
            <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// Status display helper to match menu labels exactly
const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'accepted': 'Accepted',
    'on_hold': 'On Hold',
    'on-hold': 'On Hold',
    // 'assigned' removed - goes directly to in_progress
    'pending_assignment': 'Pending',
    'in_progress': 'In Progress',
    'in-progress': 'In Progress',
    'editing': 'Editing',
    'internal_revision': 'Revision',
    'client_revision': 'Client Revision',
    'delivered': 'Delivered',
    'revision': 'Revision',
    'approved': 'Approved',
    'paid': 'Paid',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled',
  };
  return statusMap[status] || status.replace('_', ' ');
};

export function FreelancerJobsContent() {
  const { user, loading } = useDashboardProtection('freelancer');
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = (searchParams.get('status') || '').toLowerCase();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetchedData = useRef(false);

  // Filters
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [pagesFilter, setPagesFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [titleQuery, setTitleQuery] = useState<string>('');
  const [orderIdQuery, setOrderIdQuery] = useState<string>('');

  // Debounced search values
  const debouncedTitleQuery = useDebounce(titleQuery, 300);
  const debouncedOrderIdQuery = useDebounce(orderIdQuery, 300);

  const pageContent = statusParam && PAGE_CONTENT[statusParam] 
    ? PAGE_CONTENT[statusParam]
    : { title: 'Assigned Orders', caption: 'Manage your assigned orders and track progress. Upload drafts, communicate with the client, and stay on schedule.' };

  // Memoized fetch function
  const fetchJobs = useCallback(async (isBackground = false) => {
    if (!user) return;
    
    if (!isBackground) setLoadingJobs(true);
    else setIsRefreshing(true);
    
    try {
      const timestamp = Date.now();
      // Fetch both assigned orders AND available orders (accepted but unassigned)
      const [assignedRes, availableRes] = await Promise.all([
        fetch(`/api/v2/orders?assignedFreelancerId=${user.id}&limit=500&_=${timestamp}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
        fetch(`/api/v2/freelancers/available-orders?status=accepted&_=${timestamp}`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }),
      ]);

      const assignedJobs: Job[] = assignedRes.ok ? await assignedRes.json() : [];

      // Only show orders assigned to this freelancer (exclude "accepted" which are in /orders page)
      const workingJobs = assignedJobs.filter(job => 
        job.assignedFreelancerId === user.id
      );

      // Debug: Log what we're setting
      console.log('[FreelancerJobs] Fetched jobs:', {
        total: workingJobs.length,
        statusBreakdown: workingJobs.reduce((acc, j) => {
          acc[j.status] = (acc[j.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        jobs: workingJobs.map(j => ({ 
          id: j.id, 
          displayId: j.displayId, 
          status: j.status,
          freelancerAccepted: (j as any).freelancerAccepted 
        }))
      });

      setJobs(workingJobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (!isBackground) {
        toast.error('Network error loading jobs');
      }
    } finally {
      setLoadingJobs(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading || !user) return;
    
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchJobs(false);
      
      // Optimized polling - only when tab is visible
      let interval: NodeJS.Timeout;
      
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearInterval(interval);
        } else {
          fetchJobs(true);
          interval = setInterval(() => {
            fetchJobs(true);
          }, 15000); // Reduced to 15s for better performance
        }
      };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Initial interval
        interval = setInterval(() => {
          if (!document.hidden) {
            fetchJobs(true);
          }
        }, 15000);
        
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, loading, fetchJobs]);

  // Memoized base jobs list
  const baseJobs = useMemo(() => {
    if (!statusParam || !STATUS_MAP[statusParam]) return jobs;
    const allowed = STATUS_MAP[statusParam];
    return jobs.filter((j) => allowed.includes(j.status));
  }, [jobs, statusParam]);

  // Memoized categorized jobs
  // Categorized job lists matching tabs
  const onHoldJobs = useMemo(() => baseJobs.filter(j => ['on_hold', 'on-hold'].includes(j.status)), [baseJobs]);
  // All assigned orders are now 'in_progress' (no separate assigned status)
  const inProgressJobs = useMemo(() => baseJobs.filter(j => j.status === 'in_progress'), [baseJobs]);
  // pendingAssignmentJobs will always be empty - no 'assigned' status exists
  const pendingAssignmentJobs: Job[] = [];
  const editingJobs = useMemo(() => baseJobs.filter(j => j.status === 'editing'), [baseJobs]);
  const deliveredJobs = useMemo(() => baseJobs.filter(j => j.status === 'delivered'), [baseJobs]);
  const revisionJobs = useMemo(() => baseJobs.filter(j => ['internal_revision', 'client_revision', 'revision'].includes(j.status)), [baseJobs]);
  const approvedJobs = useMemo(() => baseJobs.filter(j => j.status === 'approved'), [baseJobs]);
  const completedJobs = useMemo(() => baseJobs.filter(j => j.status === 'completed'), [baseJobs]);
  const cancelledJobs = useMemo(() => baseJobs.filter(j => ['cancelled', 'canceled'].includes(j.status)), [baseJobs]);
  const allJobs = baseJobs;

  // Memoized filter function
  const applyFilters = useCallback((list: Job[]) => {
    return list.filter((job) => {
      const wtOk = workTypeFilter === 'all' || job.workType.toLowerCase().includes(workTypeFilter.toLowerCase());
      const threshold = pagesFilter === 'all' ? 0 : parseInt(pagesFilter, 10);
      const pagesOk = (job.pages || 0) >= threshold;
      
      let deadlineOk = true;
      if (deadlineFilter !== 'all') {
        const now = new Date();
        const due = new Date((job as any).freelancerDeadline || (job as any).deadline);
        if (deadlineFilter === 'today') {
          deadlineOk = differenceInDays(due, now) === 0;
        } else if (deadlineFilter === '24h') {
          deadlineOk = differenceInHours(due, now) <= 24;
        } else if (deadlineFilter === '3d') {
          deadlineOk = differenceInDays(due, now) <= 3;
        } else if (deadlineFilter === '7d') {
          deadlineOk = differenceInDays(due, now) <= 7;
        }
      }
      
      const titleOk = !debouncedTitleQuery || job.title.toLowerCase().includes(debouncedTitleQuery.toLowerCase());
      const idOk = !debouncedOrderIdQuery || (job.displayId && job.displayId.toLowerCase().includes(debouncedOrderIdQuery.toLowerCase()));
      return wtOk && pagesOk && deadlineOk && titleOk && idOk;
    });
  }, [workTypeFilter, pagesFilter, deadlineFilter, debouncedTitleQuery, debouncedOrderIdQuery]);

  // Top filter bar component
  const FilterBar = memo(() => (
    <Card className="mb-8 shadow-sm border-2">
      <CardContent className="pt-6 pb-6">
        {statusParam && (
          <div className="mb-6 inline-flex items-center gap-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 px-4 py-2.5 text-sm">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-blue-900 dark:text-blue-100 font-medium">Filtered by status:</span>
            <Badge variant="secondary" className="capitalize bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">{statusParam.replace('-', ' ')}</Badge>
            <Link href="/freelancer/jobs" className="ml-2 text-blue-600 hover:underline font-medium">Clear Filter</Link>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Work Type</label>
            <Input 
              placeholder="e.g. Essay, AI Removal" 
              value={workTypeFilter === 'all' ? '' : workTypeFilter} 
              onChange={(e) => setWorkTypeFilter(e.target.value || 'all')}
              className="h-10"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Pages</label>
            <Select value={pagesFilter} onValueChange={setPagesFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
                <SelectItem value="10">10+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Deadline</label>
            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All available" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All available</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="24h">Within 24h</SelectItem>
                <SelectItem value="3d">Within 3 days</SelectItem>
                <SelectItem value="7d">Within 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Topic Title</label>
            <Input 
              placeholder="Search title" 
              value={titleQuery} 
              onChange={(e) => setTitleQuery(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Order ID</label>
            <Input 
              placeholder="e.g. TL-0001" 
              value={orderIdQuery} 
              onChange={(e) => setOrderIdQuery(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  ));
  FilterBar.displayName = 'FilterBar';

  const renderTable = useCallback((list: Job[]) => {
    const filtered = applyFilters(list);

    if (loadingJobs) {
      return <TableSkeleton />;
    }

    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders to show</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="rounded-lg border-2 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[110px] font-bold">Order</TableHead>
              <TableHead className="font-bold">Title</TableHead>
              <TableHead className="hidden md:table-cell font-bold">Type</TableHead>
              <TableHead className="hidden md:table-cell text-right font-bold">Earnings</TableHead>
              <TableHead className="hidden md:table-cell text-center font-bold">Pg</TableHead>
              <TableHead className="hidden md:table-cell text-center font-bold">Sl</TableHead>
              <TableHead className="hidden lg:table-cell font-bold">Deadline</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((job) => {
              // Use database freelancerEarnings if available, otherwise calculate based on user's tier
              const jobWithEarnings = job as any;
              const earnings = jobWithEarnings.freelancerEarnings && jobWithEarnings.freelancerEarnings > 0
                ? jobWithEarnings.freelancerEarnings
                : calculateFreelancerEarnings(
                    job.pages || 0, 
                    job.workType, 
                    job.slides || 0,
                    user?.completedJobs || 0
                  );
              const statusBadgeVariant =
                job.status === 'completed' ? 'default' :
                job.status === 'delivered' || job.status === 'editing' ? 'secondary' :
                job.status === 'revision' ? 'destructive' : 'outline';
              return (
                <TableRow 
                  key={job.id} 
                  className="hover:bg-muted/40 cursor-pointer transition-all border-b"
                  onClick={() => router.push(`/freelancer/jobs/${job.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="font-mono text-sm text-primary font-bold">
                    {job.displayId || `#${job.id}`}
                    {job.clientName && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                        {job.clientName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate font-medium">{job.title}</TableCell>
                  <TableCell className="hidden md:table-cell capitalize text-sm">{job.workType}</TableCell>
                  <TableCell className="hidden md:table-cell text-right text-green-600 font-bold">KSh {earnings.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell text-center font-semibold">{job.pages || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell text-center font-semibold">{job.slides || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <CountdownTimer 
                      deadline={(job as any).freelancerDeadline || (job as any).deadline}
                      status={job.status}
                      showIcon={false}
                      className="text-xs font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant as any} className="capitalize font-semibold">
                      {getStatusDisplay(job.status)}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-primary hover:bg-primary/10 font-semibold"
                      asChild
                    >
                      <Link href={`/freelancer/jobs/${job.id}`}>
                        View →
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }, [applyFilters, loadingJobs]);

  if (loading || !user) {
    return <DashboardLoader />;
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2 text-primary">{pageContent.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {pageContent.caption}
          </p>
        </div>
        {isRefreshing && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {loadingJobs ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard title="On Hold" value={onHoldJobs.length} icon={AlertCircle} />
            <StatsCard title="In Progress" value={inProgressJobs.length} icon={Clock} />
            <StatsCard title="Editing" value={editingJobs.length} icon={FileText} />
            <StatsCard title="Delivered" value={deliveredJobs.length} icon={FileText} />
            <StatsCard title="Revision" value={revisionJobs.length} icon={AlertCircle} />
            <StatsCard title="Approved" value={approvedJobs.length} icon={CheckCircle} />
            <StatsCard title="Completed" value={completedJobs.length} icon={CheckCircle} />
            <StatsCard title="Cancelled" value={cancelledJobs.length} icon={AlertCircle} />
            <StatsCard title="Total" value={allJobs.length} icon={AlertCircle} />
          </>
        )}
      </div>

      {/* Filter bar */}
      <div className="relative z-10">
        <FilterBar />
      </div>

      {/* Jobs Tabs */}
      <Tabs defaultValue="in-progress" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 bg-muted/50 p-1 h-auto">
          <TabsTrigger value="on-hold" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            On Hold <span className="ml-1">({onHoldJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            In Progress <span className="ml-1">({inProgressJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="editing" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Editing <span className="ml-1">({editingJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="delivered" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Delivered <span className="ml-1">({deliveredJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="revision" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Revision <span className="ml-1">({revisionJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Approved <span className="ml-1">({approvedJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Completed <span className="ml-1">({completedJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Cancelled <span className="ml-1">({cancelledJobs.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="on-hold" className="mt-6">
          {renderTable(onHoldJobs)}
        </TabsContent>
        <TabsContent value="in-progress" className="mt-6">
          {renderTable(inProgressJobs)}
        </TabsContent>
        <TabsContent value="editing" className="mt-6">
          {renderTable(editingJobs)}
        </TabsContent>
        <TabsContent value="delivered" className="mt-6">
          {renderTable(deliveredJobs)}
        </TabsContent>
        <TabsContent value="revision" className="mt-6">
          {renderTable(revisionJobs)}
        </TabsContent>
        <TabsContent value="approved" className="mt-6">
          {renderTable(approvedJobs)}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {renderTable(completedJobs)}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          {renderTable(cancelledJobs)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
