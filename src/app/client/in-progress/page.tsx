"use client";
import { safeApiFetch, unwrapOrderList } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UnifiedPaymentDialog } from '@/components/unified-payment-dialog';
import { toast } from 'sonner';
import OrderFinancialsCard from '@/components/OrderFinancialsCard';

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
  paymentConfirmed?: boolean;
};

export default function InProgressJobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

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

  const fetchJobs = async () => {
    if (!user) return;
    
    try {
      const timestamp = Date.now();
      const response = await safeApiFetch(`/api/v2/orders?userId=${user.id}&role=client&_t=${timestamp}`, {
        next: { revalidate: 30 },
      });
      
      if (response.ok) {
        const data = await response.json();
        const orders = unwrapOrderList<any>(data);
        // Include accepted (work assignment phase), in_progress (freelancer working), editing (under review)
        const inProgress = orders.filter((o: any) => 
          ['accepted', 'in_progress', 'editing'].includes(o.status)
        ).map((o: any) => ({
          id: o.id,
          displayId: o.orderNumber || '',
          title: o.title,
          workType: o.workType,
          amount: Number(o.clientTotal ?? 0),
          status: o.status,
          deadline: new Date(o.deadline).toISOString(),
          actualDeadline: new Date(o.deadline).toISOString(),
          createdAt: new Date(o.createdAt).toISOString(),
          pages: o.pageCount || null,
          slides: o.slideCount || null,
          paymentConfirmed: o.paymentConfirmed || false,
        }));
        setJobs(inProgress);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">In Progress Orders</h1>
            <p className="text-sm text-muted-foreground">Orders currently being worked on by writers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-normal opacity-90">Active Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{jobs.length}</div>
                  <Clock className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Orders List</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-base font-medium mb-2">No orders in progress</p>
                  <p className="text-sm text-muted-foreground">Orders being worked on will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                    {jobs.map((job) => (
                      <div 
                        key={job.id}
                        className="border-2 rounded-lg p-4 transition-all border-border shadow-sm hover:shadow-md"
                      >
                        <div 
                          onClick={() => router.push(`/client/orders/${job.id}`)}
                          className="cursor-pointer hover:bg-primary/5 hover:border-primary/40 rounded-lg p-4 -m-2 mb-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-bold text-lg text-foreground">
                                  {job.title}
                                </h3>
                                {job.displayId && (
                                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-semibold text-primary bg-primary/10">
                                    {job.displayId}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                <span className="capitalize">{job.workType}</span>
                                <span></span>
                                <span>
                                  {job.pages ? `${job.pages} pages (${job.pages * 300} words)` : 
                                   job.slides ? `${job.slides} slides` : 'N/A'}
                                </span>
                                <span></span>
                                <span>Due: {new Date(job.actualDeadline).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 whitespace-nowrap">
                                {job.status.replace('_', ' ')}
                              </Badge>
                              <span className="font-bold text-lg text-foreground whitespace-nowrap">
                                KSh {job.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1">
                            <OrderFinancialsCard orderId={job.id} userRole="client" variant="compact" />
                          </div>
                          {!job.paymentConfirmed && job.status === 'accepted' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
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
                        </div>
                      </div>
                    ))}
                  </div>
              )}
            </CardContent>
          </Card>

      <div className="mt-6 text-center">
        <Link href="/client/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {selectedOrderId !== null && (
        <UnifiedPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={selectedOrderId}
          orderDisplayId={jobs.find(j => j.id === selectedOrderId)?.displayId || ''}
          amount={jobs.find(j => j.id === selectedOrderId)?.amount || 0}
          description="Payment for in-progress order"
          type="order"
          defaultPhoneNumber={user?.phone || ''}
          customerName={user?.name || ''}
          customerEmail={user?.email || ''}
          clientId={user?.clientId || String(user?.id || '')}
          onSuccess={async () => {
            toast.success('Payment initiated successfully!');
            await fetchJobs();
            setPaymentDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
