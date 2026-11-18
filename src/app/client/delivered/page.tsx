"use client";
import { safeApiFetch, unwrapOrderList } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { ChatWithUsWidget } from '@/components/chat-with-us-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, FileText, AlignJustify, DollarSign } from 'lucide-react';
import OrderFinancialsCard from '@/components/OrderFinancialsCard';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { UnifiedPaymentDialog } from '@/components/unified-payment-dialog';

export const dynamic = 'force-dynamic';

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
  singleSpaced: boolean | null;
  baseCpp: number | null;
  effectiveCpp: number | null;
  paymentConfirmed?: boolean;
};

export default function ClientDeliveredPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchJobs = async (silent = false) => {
    if (!user) return;
    
    if (!silent) setRefreshing(true);
    
    try {
      const timestamp = Date.now();
         const response = await safeApiFetch(`/api/v2/orders?clientId=${user.id}&status=delivered&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(unwrapOrderList<Job>(data));
      } else {
        if (!silent) toast.error('Failed to fetch delivered orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (!silent) toast.error('Network error');
    } finally {
      setLoadingJobs(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'client' && user.role !== 'account_owner')) {
        router.push('/');
      } else if (!user.approved && user.role !== 'account_owner') {
        router.push('/client/dashboard');
      } else {
        fetchJobs();
      }
    }
  }, [user, loading, router]);

  const handleManualRefresh = () => {
    fetchJobs(false);
    toast.success('Refreshing delivered orders...');
  };

  const handleApprove = async (jobId: number) => {
    // Check if payment is confirmed before allowing approval
    const job = jobs.find(j => j.id === jobId);
    if (job && !job.paymentConfirmed) {
      toast.error('Please complete payment before approving the order');
      return;
    }
    
    try {
      const res = await safeApiFetch(`/api/v2/orders/${jobId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({})
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(extractErrorMessage(j, 'Failed to approve order'));
        return;
      }
      toast.success('Order approved! Freelancer and manager balances updated.');
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (e) {
      toast.error('Network error');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <ChatWithUsWidget />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    Delivered Orders
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground">
                    Review and approve completed work from writers
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Link href="/client/dashboard">
                    <Button variant="secondary" size="lg">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <Card className="mb-6 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Delivery Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Delivered</p>
                    <p className="text-3xl font-bold text-foreground">{jobs.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Awaiting Your Review</p>
                    <p className="text-3xl font-bold text-green-600">{jobs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Delivered Orders</CardTitle>
                <CardDescription className="text-base">
                  Review the completed work and approve or request revisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading delivered orders...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">No delivered orders</p>
                    <p className="text-muted-foreground mb-6">
                      Completed work will appear here for your review
                    </p>
                    <Link href="/client/dashboard">
                      <Button variant="outline" size="lg">
                        View All Orders
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => {
                      const displayCpp = job.effectiveCpp || job.baseCpp || (job.pages ? job.amount / job.pages : 0);
                      
                      return (
    
                        <div 
                          key={job.id}
                          className="border-2 rounded-lg p-4 sm:p-5 transition-all border-border shadow-sm"
                        >
                          <div 
                            onClick={() => router.push(`/client/orders/${job.id}`)}
                            className="cursor-pointer hover:bg-primary/5 hover:border-primary/40 rounded-lg p-4 -m-2 mb-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="font-bold text-lg sm:text-xl text-foreground">
                                    {job.title}
                                  </h3>
                                  {job.displayId && (
                                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-semibold text-primary bg-primary/10">
                                      {job.displayId}
                                    </span>
                                  )}
                                  {job.singleSpaced && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                                      <AlignJustify className="w-4 h-4 mr-1" />
                                      Single Spaced
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm whitespace-nowrap">
                                  Delivered
                                </Badge>
                                {!job.paymentConfirmed && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrderId(job.id);
                                      setPaymentDialogOpen(true);
                                    }}
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Pay Now
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="btn btn-secondary"
                                  onClick={(e) => { e.stopPropagation(); handleApprove(job.id); }}
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span className="capitalize font-medium">{job.workType}</span>
                              <span></span>
                              {job.pages && (
                                <>
                                  <span>{job.pages} page{job.pages > 1 ? 's' : ''}</span>
                                  <span></span>
                                </>
                              )}
                              {job.slides && (
                                <>
                                  <span>{job.slides} slide{job.slides > 1 ? 's' : ''}</span>
                                  <span></span>
                                </>
                              )}
                              <span className="font-bold text-foreground">
                                KSh {job.amount.toFixed(2)}
                              </span>
                              {job.pages && displayCpp > 0 && (
                                <>
                                  <span></span>
                                  <span className="text-xs">(CPP: KSh {displayCpp.toFixed(0)})</span>
                                </>
                              )}
                              <span></span>
                              <span className="font-medium">
                                Deadline: {new Date(job.actualDeadline || job.deadline).toLocaleDateString()}
                              </span>
                              <span></span>
                              <span>
                                Posted: {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <OrderFinancialsCard orderId={job.id} userRole="client" variant="compact" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
      </div>
      <ChatWithUsWidget />
      
      {selectedOrderId !== null && (
        <UnifiedPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={selectedOrderId}
          orderDisplayId={jobs.find(j => j.id === selectedOrderId)?.displayId || ''}
          amount={jobs.find(j => j.id === selectedOrderId)?.amount || 0}
          description="Payment for delivered order"
          type="order"
          customerName={user?.name || ''}
          customerEmail={user?.email || ''}
          clientId={user?.clientId || String(user?.id || '')}
          defaultPhoneNumber={user?.phone || ''}
          onSuccess={async () => {
            toast.success('Payment initiated successfully!');
            await fetchJobs();
            setPaymentDialogOpen(false);
          }}
        />
      )}
    </>
  );
}
