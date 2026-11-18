"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Smartphone, RefreshCw, Search, Eye, CheckCircle2, AlertTriangle, XCircle, Clock, Link2, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PaymentItem {
  id: number;
  reference: string | null;
  jobId: number | null;
  orderId: number | null;
  clientId: number;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  phoneNumber: string | null;
  merchantRequestId: string | null;
  checkoutRequestId: string | null;
  mpesaCheckoutRequestId: string | null;
  mpesaMerchantRequestId: string | null;
  mpesaReceiptNumber: string | null;
  mpesaTransactionDate: string | null;
  resultCode: number | null;
  resultDescription: string | null;
  unmatched: boolean;
  reconciled: boolean;
  reconciledAt: string | null;
  reconciliationNotes: string | null;
  rawCallback: any;
  createdAt: string;
  paidAt: string | null;
  order: {
    id: number;
    title: string;
    orderNumber: string | null;
    displayId: string | null;
    status: string;
  } | null;
  customer: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export function MpesaPaymentsDashboard() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    reviewRequired: 0,
    unmatched: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedCallback, setSelectedCallback] = useState<any | null>(null);
  const [reconcileTarget, setReconcileTarget] = useState<PaymentItem | null>(null);
  const [reconcileOrderId, setReconcileOrderId] = useState<string>('');
  const [reconcileNotes, setReconcileNotes] = useState<string>('');
  const [reconciling, setReconciling] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const res = await fetch('/api/payments/mpesa/diagnostic');
      const data = await res.json();
      if (data.connected) {
        toast.success(`Daraja Connection OK (${data.configuration?.env})`, {
          description: data.message,
        });
      } else {
        toast.error('Daraja Connection Failed', {
          description: data.error,
          duration: 9000,
        });
      }
    } catch (err: any) {
      toast.error('Diagnostic error: ' + err.message);
    } finally {
      setTestingConnection(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeTab !== 'all') {
        queryParams.set('status', activeTab);
      }
      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }
      queryParams.set('provider', 'mpesa');

      const res = await fetch(`/api/admin/payments?${queryParams.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load payments: ${res.statusText}`);
      }

      const data = await res.json();
      setPayments(data.payments || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      console.error('[Admin M-Pesa Dashboard] Fetch error:', err);
      toast.error('Could not load M-PESA payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleReconcileSubmit = async () => {
    if (!reconcileTarget || !reconcileOrderId.trim()) {
      toast.error('Please enter an Order ID');
      return;
    }

    try {
      setReconciling(true);
      const res = await fetch(`/api/admin/payments/${reconcileTarget.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: parseInt(reconcileOrderId.trim(), 10),
          notes: reconcileNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reconcile payment');
      }

      toast.success(data.message || 'Payment reconciled successfully!');
      setReconcileTarget(null);
      setReconcileOrderId('');
      setReconcileNotes('');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Error reconciling payment');
    } finally {
      setReconciling(false);
    }
  };

  const getStatusBadge = (payment: PaymentItem) => {
    if (payment.unmatched) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-medium">
          Unmatched Direct Till
        </Badge>
      );
    }
    switch (payment.status) {
      case 'paid':
      case 'completed':
        return (
          <Badge className="bg-emerald-600 text-white font-medium hover:bg-emerald-600">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
          </Badge>
        );
      case 'payment_review_required':
        return (
          <Badge className="bg-rose-500 text-white font-medium hover:bg-rose-500 animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" /> Review Required
          </Badge>
        );
      case 'awaiting_confirmation':
      case 'initiated':
      case 'pending':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 font-medium">
            <Clock className="w-3 h-3 mr-1" /> Awaiting PIN
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 font-medium">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground font-medium">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{payment.status}</Badge>;
    }
  };

  return (
    <Card className="w-full shadow-sm border-border">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                Live Safaricom M-PESA Management
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider">
                  Daraja Production
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time Lipa na M-PESA STK Push, Till callbacks, idempotency tracking & direct C2B reconciliation
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="h-9 gap-1.5 border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400"
            >
              <Smartphone className={`w-3.5 h-3.5 ${testingConnection ? 'animate-pulse' : ''}`} />
              {testingConnection ? 'Testing...' : 'Test Daraja API'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPayments}
              disabled={loading}
              className="h-9 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div
            onClick={() => setActiveTab('all')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'all' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 bg-card hover:bg-muted/40'
            }`}
          >
            <span className="text-xs text-muted-foreground block font-medium">Total Payments</span>
            <span className="text-2xl font-bold text-foreground">{counts.total}</span>
          </div>

          <div
            onClick={() => setActiveTab('paid')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'paid' ? 'border-emerald-600 bg-emerald-500/5 shadow-sm' : 'border-border/60 bg-card hover:bg-muted/40'
            }`}
          >
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">Paid & Confirmed</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.paid}</span>
          </div>

          <div
            onClick={() => setActiveTab('pending')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'pending' ? 'border-blue-600 bg-blue-500/5 shadow-sm' : 'border-border/60 bg-card hover:bg-muted/40'
            }`}
          >
            <span className="text-xs text-blue-600 dark:text-blue-400 block font-medium">Pending / Awaiting</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{counts.pending}</span>
          </div>

          <div
            onClick={() => setActiveTab('review_required')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'review_required' ? 'border-rose-600 bg-rose-500/5 shadow-sm' : 'border-border/60 bg-card hover:bg-muted/40'
            }`}
          >
            <span className="text-xs text-rose-600 dark:text-rose-400 block font-medium">Review Required</span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.reviewRequired}</span>
          </div>

          <div
            onClick={() => setActiveTab('unmatched')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'unmatched' ? 'border-amber-600 bg-amber-500/5 shadow-sm' : 'border-border/60 bg-card hover:bg-muted/40'
            }`}
          >
            <span className="text-xs text-amber-600 dark:text-amber-400 block font-medium">Unmatched C2B</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.unmatched}</span>
          </div>

          <div
            onClick={() => setActiveTab('failed')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'failed' ? 'border-muted-foreground bg-muted/40 shadow-sm' : 'border-border/60 bg-card hover:bg-muted/40'
            }`}
          >
            <span className="text-xs text-muted-foreground block font-medium">Failed</span>
            <span className="text-2xl font-bold text-muted-foreground">{counts.failed}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search by receipt, phone, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-10">
            Search
          </Button>
        </form>

        {/* Table */}
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs">Payment ID / Ref</TableHead>
                <TableHead className="font-semibold text-xs">Order</TableHead>
                <TableHead className="font-semibold text-xs">Customer</TableHead>
                <TableHead className="font-semibold text-xs">Amount</TableHead>
                <TableHead className="font-semibold text-xs">Phone</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                <TableHead className="font-semibold text-xs">M-PESA Receipt</TableHead>
                <TableHead className="font-semibold text-xs">Checkout Req ID</TableHead>
                <TableHead className="font-semibold text-xs">Created</TableHead>
                <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading M-PESA payment transactions...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    No payments found matching this filter.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs">
                      <div className="font-bold text-foreground">#{payment.id}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                        {payment.reference || `TLK-${payment.id}`}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      {payment.order ? (
                        <div>
                          <span className="font-medium text-foreground block truncate max-w-[150px]">
                            {payment.order.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {payment.order.displayId || payment.order.orderNumber || `#${payment.order.id}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          {payment.unmatched ? 'Unmatched Till Payment' : 'Wallet Top-up'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      {payment.customer ? (
                        <div>
                          <span className="font-medium block">{payment.customer.name}</span>
                          <span className="text-[11px] text-muted-foreground">{payment.customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-bold font-mono">
                      KES {Math.round(payment.amount).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-xs font-mono">
                      {payment.phoneNumber || '—'}
                    </TableCell>

                    <TableCell className="text-xs">
                      {getStatusBadge(payment)}
                    </TableCell>

                    <TableCell className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {payment.mpesaReceiptNumber || '—'}
                    </TableCell>

                    <TableCell className="text-[11px] font-mono text-muted-foreground truncate max-w-[110px]" title={payment.checkoutRequestId || payment.mpesaCheckoutRequestId || ''}>
                      {payment.checkoutRequestId || payment.mpesaCheckoutRequestId || '—'}
                    </TableCell>

                    <TableCell className="text-[11px] text-muted-foreground">
                      {payment.createdAt ? format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm') : '—'}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {payment.rawCallback && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => setSelectedCallback(payment.rawCallback)}
                            title="Inspect Raw Safaricom Callback"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Payload
                          </Button>
                        )}

                        {(payment.unmatched || payment.status === 'payment_review_required') && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 px-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => {
                              setReconcileTarget(payment);
                              setReconcileOrderId(payment.jobId ? String(payment.jobId) : '');
                              setReconcileNotes('');
                            }}
                          >
                            <Link2 className="w-3.5 h-3.5 mr-1" /> Reconcile
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Raw Callback Inspection Modal */}
      <Dialog open={Boolean(selectedCallback)} onOpenChange={(open) => !open && setSelectedCallback(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Raw Safaricom Daraja Callback
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct audit trail received from Safaricom webhook (credentials masked)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 rounded-xl bg-muted/60 font-mono text-xs text-foreground border">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(selectedCallback, null, 2)}
            </pre>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedCallback(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Reconcile Modal */}
      <Dialog open={Boolean(reconcileTarget)} onOpenChange={(open) => !open && setReconcileTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
              <Link2 className="w-5 h-5" /> Manual Payment Reconciliation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Link unmatched or disputed M-PESA payment #{reconcileTarget?.id} (Receipt: {reconcileTarget?.mpesaReceiptNumber}) to a TaskLynk order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted p-3 text-xs space-y-1">
              <div>Amount: <span className="font-bold">KES {reconcileTarget ? Math.round(reconcileTarget.amount).toLocaleString() : 0}</span></div>
              <div>Phone: <span className="font-mono">{reconcileTarget?.phoneNumber || '—'}</span></div>
              <div>Receipt: <span className="font-mono font-bold text-emerald-600">{reconcileTarget?.mpesaReceiptNumber}</span></div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-order-id" className="text-xs font-semibold">Target Order ID <span className="text-rose-500">*</span></Label>
              <Input
                id="rec-order-id"
                placeholder="e.g. 102"
                type="number"
                value={reconcileOrderId}
                onChange={(e) => setReconcileOrderId(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Enter the internal TaskLynk Order ID to attach this payment to.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-notes" className="text-xs font-semibold">Audit Notes</Label>
              <Input
                id="rec-notes"
                placeholder="Reason for manual reconciliation..."
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setReconcileTarget(null)} disabled={reconciling}>
              Cancel
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleReconcileSubmit} disabled={reconciling}>
              {reconciling ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Confirm & Mark Order Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
