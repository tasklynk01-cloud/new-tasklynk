"use client";
import { safeApiFetch, unwrapOrderList } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Receipt, RefreshCw, DollarSign, Loader2, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
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
  paymentConfirmed?: boolean;
  assignedFreelancerName?: string;
};

export default function ProcessingInvoicesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const fetchJobs = async (silent = false) => {
    if (!user) return;
    if (!silent) setRefreshing(true);
    try {
      const response = await safeApiFetch(`/api/v2/orders?clientId=${user.id}&status=delivered&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const orders = unwrapOrderList<Job>(data);
        // Filter to only show unpaid delivered orders
        const unpaidOrders = orders.filter((job: Job) => !job.paymentConfirmed);
        setJobs(unpaidOrders);
      } else if (!silent) {
        toast.error('Failed to fetch delivered orders');
      }
    } catch (e) {
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

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAll = () => {
    setSelectedOrders(jobs.map(j => j.id));
  };

  const deselectAll = () => {
    setSelectedOrders([]);
  };

  const selectedOrdersData = jobs.filter(j => selectedOrders.includes(j.id));
  const totalAmount = selectedOrdersData.reduce((sum, job) => sum + job.amount, 0);

  const handlePaySelected = () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order to pay');
      return;
    }
    setPaymentDialogOpen(true);
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
                <Receipt className="w-8 h-8 text-green-600" />
                Processing Invoices
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Review and pay for delivered orders ready for invoice processing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg" onClick={() => { fetchJobs(false); toast.success('Refreshing orders...'); }} disabled={refreshing}>
                <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/client/dashboard">
                <Button variant="secondary" size="lg">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bulk Payment Actions */}
        {jobs.length > 0 && (
          <Card className="mb-6 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
                <span>Select Orders to Pay</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectedOrders.length === jobs.length ? deselectAll : selectAll}
                    className="text-xs"
                  >
                    {selectedOrders.length === jobs.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedOrders.length > 0 && (
                    <Button
                      onClick={handlePaySelected}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay {selectedOrders.length} Order{selectedOrders.length > 1 ? 's' : ''} (KSh {totalAmount.toFixed(2)})
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Delivered Orders - Pending Payment</CardTitle>
            <CardDescription className="text-base">Select orders to process payment individually or in bulk</CardDescription>
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
                <p className="text-lg font-medium text-foreground mb-2">No pending invoices</p>
                <p className="text-muted-foreground mb-6">All delivered orders have been paid</p>
                <Link href="/client/delivered">
                  <Button variant="outline" size="lg">View All Delivered Orders</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const isSelected = selectedOrders.includes(job.id);
                  
                  return (
                    <div 
                      key={job.id} 
                      className="border-2 rounded-lg p-4 sm:p-5 transition-all cursor-pointer hover:bg-primary/5 border-border hover:border-primary/40 shadow-sm hover:shadow-md"
                      onClick={() => router.push(`/client/orders/${job.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOrderSelection(job.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-bold text-lg sm:text-xl text-foreground">{job.title}</h3>
                                {job.displayId && (
                                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-semibold text-primary bg-primary/10">{job.displayId}</span>
                                )}
                              </div>
                              {job.assignedFreelancerName && (
                                <p className="text-sm text-muted-foreground">Writer: {job.assignedFreelancerName}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="text-cyan-700 bg-cyan-100 font-semibold text-sm whitespace-nowrap">Delivered</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="capitalize font-medium">{job.workType}</span>
                            <span></span>
                            <span className="font-bold text-foreground text-lg">KSh {job.amount.toFixed(2)}</span>
                            <span></span>
                            <span className="font-medium">Deadline: {new Date(job.actualDeadline || job.deadline).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-3 flex gap-3">
                            <Link href={`/client/orders/${job.id}`} onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" /> View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unified Payment Dialog */}
        <UnifiedPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          amount={totalAmount}
          description={`Payment for ${selectedOrders.length} order(s)`}
          type="bulk"
          orderIds={selectedOrders}
          defaultPhoneNumber={user?.phone || ''}
          customerName={user?.name || ''}
          customerEmail={user?.email || ''}
          clientId={user?.clientId || String(user?.id || '')}
          onSuccess={() => {
            setSelectedOrders([]);
            fetchJobs();
          }}
        />
      </div>
    </>
  );
}
