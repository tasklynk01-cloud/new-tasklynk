"use client";
import { safeApiFetch, unwrapOrderList } from '@/lib/client-api-helpers';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, FileText, DollarSign } from 'lucide-react';
import OrderFinancialsCard from '@/components/OrderFinancialsCard';
import Link from 'next/link';
import { toast } from 'sonner';
import { UnifiedPaymentDialog } from '@/components/unified-payment-dialog';

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

export default function ClientRevisionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchJobs = React.useCallback(async (silent = false) => {
    if (!user) return;
    
    if (!silent) setLoadingJobs(true);
    
    try {
      const timestamp = Date.now();
      const response = await safeApiFetch(`/api/v2/orders?userId=${user.id}&role=client&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const orders = unwrapOrderList<any>(data);
        // Only show revisions that were client-requested (exclude internal QC revisions)
        const revisionJobs = orders.filter((o: any) => 
          o.status === 'revision' || o.status === 'client_revision'
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
          paymentConfirmed: Boolean(o.paymentConfirmed),
        }));
        setJobs(revisionJobs);
      } else {
        if (!silent) toast.error('Failed to fetch revision orders');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      if (!silent) toast.error('Network error');
    } finally {
      setLoadingJobs(false);
    }
  }, [user]);

  // Auto-refresh every 15 seconds when page is visible
  useEffect(() => {
    if (!user || loading) return;
    
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchJobs(true);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user?.id, loading, fetchJobs]); // Only re-run if user ID changes

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
  }, [user, loading, router, fetchJobs]);

  if (loading || !user) {
    return (
    
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Revision Orders</h1>
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 text-xs rounded-full border border-amber-500/20">
              {jobs.length} Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Orders currently undergoing revisions requested by you. Track writer updates in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-xl border-border text-xs font-semibold">
            <Link href="/client/dashboard">
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3 text-xs shadow-sm">
            <Link href="/client/orders">
              All Orders
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Revisions Container */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        {loadingJobs ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-xs text-muted-foreground">Loading revision orders...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground mb-0.5">No Orders Under Revision</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              When you request revisions or edits on completed papers, they will appear here with live tracking.
            </p>
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-8">
              <Link href="/client/orders">View All Orders</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-border/70 hover:border-primary/40 bg-muted/10 hover:bg-muted/30 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary">
                      {job.displayId}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 capitalize">
                      {job.workType}
                    </Badge>
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5">
                      Revision in Progress
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-foreground">
                      KSh {job.amount.toLocaleString()}
                    </span>
                    {!job.paymentConfirmed && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5 text-xs rounded-lg font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderId(job.id);
                          setPaymentDialogOpen(true);
                        }}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        Pay
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs rounded-lg border-border"
                      onClick={() => setExpandedOrderId(expandedOrderId === job.id ? null : job.id)}
                    >
                      {expandedOrderId === job.id ? "Hide Details" : "Details"}
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-lg h-7 px-3 text-xs shadow-sm"
                    >
                      <Link href={`/client/orders/${job.id}`}>
                        Open Order
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <h4 className="font-bold text-foreground line-clamp-1">{job.title}</h4>
                  <div className="flex items-center gap-3 text-muted-foreground shrink-0 text-[11px]">
                    <span>{job.pages ? `${job.pages} Pgs` : job.slides ? `${job.slides} Slides` : ''}</span>
                    <span>•</span>
                    <span>Due: {new Date(job.actualDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {expandedOrderId === job.id && (
                  <div className="pt-3 border-t border-border/50">
                    <OrderFinancialsCard orderId={job.id} userRole="client" variant="compact" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        
        {selectedOrderId !== null && (
          <UnifiedPaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            orderId={selectedOrderId}
            orderDisplayId={jobs.find(j => j.id === selectedOrderId)?.displayId || ''}
            amount={jobs.find(j => j.id === selectedOrderId)?.amount || 0}
            description="Payment for revised order"
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
