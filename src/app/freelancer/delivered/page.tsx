"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, FileText, Search, Clock, Eye, MessageSquare, RefreshCw, CheckCircle2, Hourglass } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getFreelancerEarnings } from '@/lib/order-pricing';
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
  deliveredAt?: string;
};

function DeliveredContent() {
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
        const interval = setInterval(fetchJobs, 15000);
        return () => clearInterval(interval);
      }
    }
  }, [user, loading, router]);

  const fetchJobs = async () => {
    if (!user) return;
    setLoadingJobs(true);
    try {
      // Fetch the freelancer's assigned orders with delivered status
      const response = await safeApiFetch(`/api/v2/orders?userId=${user.id}&role=freelancer`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const orders = (data?.data?.orders || data?.orders || []) as any[];
        // Filter for delivered status
        const deliveredOrders = orders.filter((o: any) => 
          o.status === 'delivered' && o.assignedFreelancerId === user.id
        );
        setJobs(deliveredOrders.map((o: any) => ({
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
          deliveredAt: o.deliveredAt,
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
            Delivered Orders {counts.delivered > 0 && <span className="text-orange-600">({counts.delivered})</span>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orders submitted and awaiting client approval
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loadingJobs} className="w-fit">
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingJobs ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-200">
        <Send className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-sm">
          <strong>Awaiting Review:</strong> These orders have been submitted to the client. 
          The client will either approve (moving to Completed) or request a revision.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Delivered</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{jobs.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Send className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Next Step</p>
                <p className="text-sm text-blue-900 dark:text-blue-100">Client Approval</p>
              </div>
              <Hourglass className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">On Approval</p>
                <p className="text-sm text-green-900 dark:text-green-100">Moves to Completed</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
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
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Delivered Orders</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {jobs.length === 0 
                ? "You haven't delivered any orders yet. Complete your in-progress work to see orders here."
                : "No orders match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const earnings = getFreelancerEarnings(job, user?.completedJobs || 0);
            return (
              <Card key={job.id} className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-bold text-orange-600">
                          {job.displayId || `#${job.id}`}
                        </span>
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                          Delivered
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
                      <p className="text-xs text-muted-foreground">Your Earnings</p>
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
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Delivered</p>
                      <p className="font-medium text-xs">
                        {job.deliveredAt 
                          ? formatDistanceToNow(new Date(job.deliveredAt), { addSuffix: true })
                          : 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href={`/freelancer/orders/${job.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full gap-3 bg-orange-600 hover:bg-orange-700">
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                    </Link>
                    <Link href={`/freelancer/messages?orderId=${job.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-3">
                        <MessageSquare className="h-4 w-4" /> Support
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

export default function DeliveredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <DeliveredContent />
    </Suspense>
  );
}
