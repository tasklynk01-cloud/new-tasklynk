"use client";
import { safeApiFetch, unwrapOrderList } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { ChatWithUsWidget } from '@/components/chat-with-us-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BadgeCheck, RefreshCw, DollarSign, Loader2 } from 'lucide-react';
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
};

export default function ClientAcceptedPage() {
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
      // Fetch orders with 'approved' status (client approved after delivery)
      const response = await safeApiFetch(`/api/v2/orders?clientId=${user.id}&status=approved&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(unwrapOrderList<Job>(data));
      } else if (!silent) {
        toast.error('Failed to fetch approved orders');
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
      // Allow both clients and account owners
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
    const unpaidOrders = jobs.filter(j => !j.paymentConfirmed);
    setSelectedOrders(unpaidOrders.map(j => j.id));
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
      <ChatWithUsWidget />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
                    <BadgeCheck className="w-8 h-8 text-cyan-600" />
                    Approved Orders
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground">
                    Orders you have approved after delivery. Proceed with payment to complete.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="lg" onClick={() => { fetchJobs(false); toast.success('Refreshing approved orders...'); }} disabled={refreshing}>
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
            {jobs.length > 0 && jobs.some(j => !j.paymentConfirmed) && (
              <Card className="mb-6 border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
                    <span>Select Orders to Pay</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectedOrders.length === jobs.filter(j => !j.paymentConfirmed).length ? deselectAll : selectAll}
                        className="text-xs"
                      >
                        {selectedOrders.length === jobs.filter(j => !j.paymentConfirmed).length ? 'Deselect All' : 'Select All'}
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
                <CardTitle className="text-2xl">Accepted Orders</CardTitle>
                <CardDescription className="text-base">These orders are accepted and pending payment. Select multiple orders to pay together.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading accepted orders...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-lg">
                    <BadgeCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground mb-2">No accepted orders</p>
                    <p className="text-muted-foreground mb-6">Accepted orders will appear here</p>
                    <Link href="/client/delivered">
                      <Button variant="outline" size="lg">Review Delivered Orders</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => {
                      const isSelected = selectedOrders.includes(job.id);
                      const isPaid = job.paymentConfirmed;
                      
                      return (
                        <div 
                          key={job.id} 
                          className={`border-2 rounded-lg p-4 sm:p-5 transition-all ${
                            isPaid ? 'opacity-60' : 'cursor-pointer hover:bg-primary/5'
                          } border-border hover:border-primary/40 shadow-sm hover:shadow-md`}
                          onClick={() => !isPaid && router.push(`/client/orders/${job.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            {!isPaid && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleOrderSelection(job.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h3 className="font-bold text-lg sm:text-xl text-foreground">{job.title}</h3>
                                    {job.displayId && (
                                      <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-semibold text-primary bg-primary/10">{job.displayId}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {isPaid ? (
                                    <Badge variant="default" className="bg-green-600 text-white font-semibold text-sm whitespace-nowrap">Paid</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-cyan-700 bg-cyan-100 font-semibold text-sm whitespace-nowrap">Accepted</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                <span className="capitalize font-medium">{job.workType}</span>
                                <span></span>
                                <span className="font-bold text-foreground">KSh {job.amount.toFixed(2)}</span>
                                <span></span>
                                <span className="font-medium">Deadline: {new Date(job.actualDeadline || job.deadline).toLocaleDateString()}</span>
                                <span></span>
                                <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
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

            {/* Unified Payment Dialog for bulk payments */}
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
