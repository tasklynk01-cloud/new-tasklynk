"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Search, Star, DollarSign, Eye, Download, RefreshCw, TrendingUp, Award } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getFreelancerEarnings, getTotalFreelancerEarnings } from '@/lib/order-pricing';
import { useFreelancerOrderCounts } from '@/hooks/use-freelancer-order-counts';

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
  deadline: string;
  actualDeadline: string;
  freelancerDeadline: string;
  status: string;
  assignedFreelancerId: number | null;
  adminApproved: boolean;
  createdAt: string;
  completedAt?: string;
  rating?: number;
};

function CompletedContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const { counts, refetch: refetchCounts } = useFreelancerOrderCounts(user?.id);
  const [titleQuery, setTitleQuery] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else if (!user.approved) {
        router.push('/freelancer/dashboard');
      } else {
        fetchJobs();
        const interval = setInterval(fetchJobs, 30000); // Less frequent for completed
        return () => clearInterval(interval);
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    if (!user) return;
    setLoadingJobs(true);
    try {
      // Fetch the freelancer's assigned orders with completed status
      const response = await safeApiFetch(`/api/v2/orders?userId=${user.id}&role=freelancer`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const orders = (data?.data?.orders || data?.orders || []) as any[];
        // Filter for completed status
        const completedOrders = orders.filter((o: any) => 
          o.status === 'completed' && o.assignedFreelancerId === user.id
        );
        setJobs(completedOrders.map((o: any) => ({
          id: o.id,
          clientId: o.clientId,
          displayId: o.displayId,
          title: o.title,
          instructions: o.instructions || '',
          workType: o.workType,
          pages: o.pages ?? null,
          slides: o.slides ?? null,
          amount: o.amount ?? 0,
          deadline: o.deadline,
          actualDeadline: o.actualDeadline,
          freelancerDeadline: o.freelancerDeadline,
          status: o.status,
          assignedFreelancerId: o.assignedFreelancerId ?? null,
          adminApproved: !!o.adminApproved,
          createdAt: o.createdAt,
          completedAt: o.completedAt || o.updatedAt,
          rating: o.rating,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleRefresh = () => {
    fetchJobs();
    refetchCounts?.();
  };

  const filteredJobs = useMemo(() => {
    if (!titleQuery) return jobs;
    const q = titleQuery.toLowerCase();
    return jobs.filter((job) => 
      job.title.toLowerCase().includes(q) || 
      (job.displayId && job.displayId.toLowerCase().includes(q))
    );
  }, [jobs, titleQuery]);

  const totalEarnings = useMemo(() => {
    return getTotalFreelancerEarnings(jobs, user?.completedJobs || 0);
  }, [jobs, user?.completedJobs]);

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
            Completed Orders {counts.completed > 0 && <span className="text-green-600">({counts.completed})</span>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your successfully completed work and earnings history
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loadingJobs} className="w-fit">
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingJobs ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm">
          <strong>Well Done!</strong> These orders have been approved by clients and are complete. 
          Earnings from completed orders count toward your CPP level progression.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed Orders</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{jobs.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Earnings</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">KSh {totalEarnings.toFixed(0)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">CPP Progress</p>
                <p className="text-sm text-amber-900 dark:text-amber-100">{user?.completedJobs || 0} orders completed</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input 
                placeholder="Search by order ID or title..." 
                value={titleQuery} 
                onChange={(e) => setTitleQuery(e.target.value)} 
              />
            </div>
            <Button variant="default" className="gap-3">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Display */}
      {loadingJobs ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Completed Orders Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {jobs.length === 0 
                ? "Complete your assigned work and get client approval to see orders here."
                : "No orders match your search."}
            </p>
            {jobs.length === 0 && (
              <div className="mt-6">
                <Link href="/freelancer/in-progress">
                  <Button>View In Progress Orders</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const earnings = getFreelancerEarnings(job, user?.completedJobs || 0);
            return (
              <Card key={job.id} className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-bold text-green-600">
                          {job.displayId || `#${job.id}`}
                        </span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="font-bold text-green-600">KSh {earnings.toFixed(0)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Work Type</p>
                      <p className="font-medium capitalize text-xs">{job.workType}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Pages/Slides</p>
                      <p className="font-medium">{job.pages || 0} pg / {job.slides || 0} sl</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-medium text-xs">
                        {job.completedAt 
                          ? formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Rating Display (if available) */}
                  {job.rating && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 flex items-center gap-3">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium text-amber-700 dark:text-amber-300">
                        Client Rating: {job.rating}/5
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href={`/freelancer/orders/${job.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full gap-3 bg-green-600 hover:bg-green-700">
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                    </Link>
                    <Link href={`/freelancer/orders/${job.id}#files`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-3">
                        <Download className="h-4 w-4" /> Files
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

export default function CompletedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CompletedContent />
    </Suspense>
  );
}
