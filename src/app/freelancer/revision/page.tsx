"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, FileText, Search, RefreshCw, Upload, Eye, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  revisionNotes?: string;
};

export default function RevisionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const { counts, refetch: refetchCounts } = useFreelancerOrderCounts(user?.id);

  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [pagesFilter, setPagesFilter] = useState<string>('all');
  const [titleQuery, setTitleQuery] = useState<string>('');
  const [orderIdQuery, setOrderIdQuery] = useState<string>('');

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
    if (!user || !user.id) return;
    setLoadingJobs(true);
    try {
      // ? FIXED: Fetch from user's orders API with proper filtering
      const timestamp = Date.now();
      const response = await safeApiFetch(
        `/api/v2/orders?userId=${user.id}&role=freelancer&_=${timestamp}`,
        { cache: 'no-store', credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const allOrders = data.orders || [];
        
        // Filter for revision status orders assigned to this freelancer
        const revisionOrders = allOrders.filter((o: any) => 
          (o.status === 'revision' || o.status === 'internal_revision' || o.status === 'client_revision') && 
          o.assignedFreelancerId === user.id
        );
        
        const mapped = revisionOrders.map((o: any) => ({
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
          revisionNotes: o.revisionNotes || '',
        })) as Job[];
        
        setJobs(mapped);
      }
    } catch (error) {
      console.error('[Revision Page] Failed to fetch jobs:', error);
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
      const threshold = pagesFilter === 'all' ? 0 : parseInt(pagesFilter, 10);
      const pagesOk = (job.pages || 0) >= threshold;
      const titleOk = !titleQuery || job.title.toLowerCase().includes(titleQuery.toLowerCase());
      const idOk = !orderIdQuery || (job.displayId && job.displayId.toLowerCase().includes(orderIdQuery.toLowerCase()));
      return wtOk && pagesOk && titleOk && idOk;
    });
  };

  const displayedJobs = applyFilters(jobs);

  if (loading || !user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Revision {counts.revision > 0 && <span className="text-orange-600">({counts.revision})</span>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orders returned for revision - address feedback and resubmit
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loadingJobs} className="w-fit">
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingJobs ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Urgent Alert */}
      {jobs.length > 0 && (
        <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-300">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm">
            <strong>Action Required:</strong> You have {jobs.length} order(s) requiring revision. 
            Please address the feedback and upload corrected files as soon as possible.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Needs Revision</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{jobs.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Work Type</label>
              <Input 
                placeholder="e.g. Essay" 
                value={workTypeFilter === 'all' ? '' : workTypeFilter} 
                onChange={(e) => setWorkTypeFilter(e.target.value || 'all')} 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Pages</label>
              <Select value={pagesFilter} onValueChange={setPagesFilter}>
                <SelectTrigger>
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input placeholder="Search title" value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Order ID</label>
              <Input placeholder="e.g. TL-0001" value={orderIdQuery} onChange={(e) => setOrderIdQuery(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="default" className="w-full gap-3">
                <Search className="h-4 w-4" /> Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Display */}
      {loadingJobs ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : displayedJobs.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Revision Orders</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {jobs.length === 0 
                ? "Great job! You don't have any orders requiring revision at the moment."
                : "No orders match your current filters. Try adjusting your search criteria."}
            </p>
            {jobs.length === 0 && (
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link href="/freelancer/in-progress">
                  <Button variant="outline">View In Progress</Button>
                </Link>
                <Link href="/freelancer/available">
                  <Button>Find New Orders</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedJobs.map((job) => {
            const earnings = getFreelancerEarnings(job, user?.completedJobs || 0);
            
            return (
              <Card key={job.id} className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-bold text-orange-600">{job.displayId}</span>
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                          Revision
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{job.title}</h3>
                    </div>
                  </div>

                  {/* Revision Notes */}
                  {job.revisionNotes && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200">
                      <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Revision Feedback:
                      </p>
                      <p className="text-sm text-orange-900 dark:text-orange-100 line-clamp-3">{job.revisionNotes}</p>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{job.workType}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Pages/Slides</p>
                      <p className="font-medium">{job.pages || 0}pg / {job.slides || 0}sl</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Your Earnings</p>
                      <p className="font-bold text-green-600">KSh {earnings.toFixed(0)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium text-xs">{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Link href={`/freelancer/orders/${job.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full gap-3 bg-orange-600 hover:bg-orange-700">
                        <Upload className="h-4 w-4" /> Upload Revision
                      </Button>
                    </Link>
                    <Link href={`/freelancer/orders/${job.id}`}>
                      <Button variant="outline" size="sm" className="gap-3">
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
