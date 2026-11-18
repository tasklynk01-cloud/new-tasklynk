"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceGenerator } from '@/components/invoice-generator';
import { CheckCircle, XCircle, FileText, Download, DollarSign, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import PaystackPaymentsApproval from '@/components/paystack-payments-approval';
import { MpesaPaymentsDashboard } from '@/components/mpesa-payments-dashboard';

type Payment = {
  id: number;
  jobId: number;
  clientId: number;
  freelancerId: number;
  amount: number;
  mpesaCode: string | null;
  status: string;
  confirmedByAdmin: boolean;
  createdAt: string;
};

type PaymentRequest = {
  id: number;
  clientId: number;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  paymentMethod: string;
  phoneNumber: string;
  transactionReference: string;
  createdAt: string;
  confirmedAt?: string | null;
  rejectionReason?: string | null;
  client: { id: number; name: string; email: string };
};

type ReleaseDryRunOrder = {
  id: number;
  label?: string;
  paidAt?: string | null;
};

type ReleaseResultPayload = {
  success?: boolean;
  released?: number;
  dryRun?: boolean;
  message?: string;
  orders?: ReleaseDryRunOrder[];
  details?: Array<{
    orderId: number;
    freelancerReleased: number;
    managerReleased: number;
    completedAt: string;
  }>;
};

function ReleasePayoutsPanel() {
  const [minHours, setMinHours] = useState<number>(24);
  const [orderIdsInput, setOrderIdsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReleaseResultPayload | null>(null);

  const parseOrderIds = () =>
    orderIdsInput
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

  const triggerRelease = async (runDry: boolean) => {
    try {
      setLoading(true);
      setResult(null);
      const payload: Record<string, unknown> = {
        dryRun: runDry,
        minHoursSincePaid: Math.max(1, Number(minHours) || 24),
      };
      const orderIds = parseOrderIds();
      if (orderIds.length) {
        payload.orderIds = orderIds;
      }

      const response = await safeApiFetch('/api/v2/orders/release-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Release request failed');
      }

      setResult(data);
      toast.success(
        runDry
          ? `Dry run ready: ${data.orders?.length || 0} orders queued`
          : `Released payouts for ${data.released || 0} orders`
      );
    } catch (error) {
      console.error('[ReleasePayoutsPanel] Failed to call release API:', error);
      toast.error(error instanceof Error ? error.message : 'Release request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-emerald-100 bg-emerald-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Reserved Balance Release
        </CardTitle>
        <CardDescription>
          Run <code className="rounded bg-black/5 px-1 py-0.5 text-xs">/api/v2/orders/release-payouts</code> to move
          reserved earnings into available balances after the hold window.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Minimum Hours Since Paid</Label>
            <Input
              type="number"
              min={1}
              value={minHours}
              onChange={(event) => setMinHours(Number(event.target.value) || 1)}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Defaults to 24 hours. Increase for weekends/holidays.
            </p>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Specific Order IDs (optional)</Label>
            <Input
              placeholder="123, 456, 789"
              value={orderIdsInput}
              onChange={(event) => setOrderIdsInput(event.target.value)}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Leave blank to target every paid order older than the hold window.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>
              Always start with <strong>dry run</strong> to preview which orders will move before releasing funds.
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => triggerRelease(true)}
            className="rounded-xl border-emerald-200 bg-card text-emerald-700 hover:bg-emerald-50"
          >
            {loading ? 'Running' : 'Preview Dry Run'}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => triggerRelease(false)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Releasing' : 'Release Funds'}
          </Button>
        </div>

        {result && (
          <div className="mt-4 space-y-3 rounded-3xl border border-emerald-200 bg-card/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm font-medium text-emerald-900">
                <ShieldCheck className="h-4 w-4" />
                {result.dryRun ? 'Dry Run Summary' : 'Release Summary'}
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                {result.dryRun ? 'Preview Only' : `${result.released || 0} orders released`}
              </Badge>
            </div>
            {result.dryRun ? (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {result.orders?.length || 0} orders meet the criteria above.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(result.orders || []).map((order) => (
                    <div key={order.id} className="rounded-xl border border-dashed border-emerald-100 bg-emerald-50/50 p-4">
                      <div className="font-semibold">{order.label || `#${order.id}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Paid {order.paidAt ? format(new Date(order.paidAt), 'MMM dd, yyyy HH:mm') : 'unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Funds moved to available balance for each order below.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(result.details || []).map((detail) => (
                    <div key={detail.orderId} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="font-semibold">Order #{detail.orderId}</div>
                      <div className="text-xs text-muted-foreground">
                        Completed {format(new Date(detail.completedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                      <div className="mt-2 flex justify-between text-xs font-medium">
                        <span>Writer</span>
                        <span>KSh {(detail.freelancerReleased ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-blue-700">
                        <span>Manager</span>
                        <span>KSh {(detail.managerReleased ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for Approved Orders section
function ApprovedOrdersPaymentSection({ user, router }: { user: any; router: any }) {
  const [approvedOrders, setApprovedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [mpesaCodes, setMpesaCodes] = useState<{[key: number]: string}>({});

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    if (user?.id) {
      fetchApprovedOrders();
    }
  }, [user?.id]);

  const fetchApprovedOrders = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await safeApiFetch(`/api/v2/orders?userId=${user.id}&role=admin&status=approved`, { 
        credentials: 'include',
        headers: { ...authHeaders() },
      });
      if (response.ok) {
        const data = await response.json();
        // Handle both response structures: { success: true, data: { orders: [...] } } or { orders: [...] }
        const orders = data?.data?.orders || data?.orders || [];
        setApprovedOrders(Array.isArray(orders) ? orders : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch approved orders:', errorData);
        setApprovedOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch approved orders:', error);
      setApprovedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (orderId: number) => {
    const mpesaCode = mpesaCodes[orderId]?.trim();
    if (!mpesaCode) {
      toast.error('Please enter M-Pesa code');
      return;
    }

    try {
      setConfirming(orderId);
      // Use v2 payment endpoint to confirm payment and distribute balances
      const response = await safeApiFetch(`/api/v2/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          adminId: user?.id || 1,
          transactionId: mpesaCode,
          paymentMethod: 'mpesa',
          phoneNumber: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Payment confirmed! Balances distributed: Writer KSh ${data.distribution?.writer || 0}, Manager KSh ${data.distribution?.manager || 0}`,
          { duration: 5000 }
        );
        setMpesaCodes(prev => ({ ...prev, [orderId]: '' }));
        fetchApprovedOrders();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to confirm payment'));
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast.error('An error occurred');
    } finally {
      setConfirming(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (approvedOrders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No approved orders awaiting payment confirmation</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Freelancer</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Freelancer Payout</TableHead>
            <TableHead>Manager Fees</TableHead>
            <TableHead>M-Pesa Code</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {approvedOrders.map((order) => (
            <TableRow 
              key={order.id} 
              className="bg-yellow-50/50 cursor-pointer hover:bg-yellow-100/50"
              onClick={() => router.push(`/admin/jobs/${order.id}`)}
            >
              <TableCell className="font-mono text-sm">{order.displayId || order.orderId || `#${order.id}`}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <p className="font-medium">{order.clientName || 'Unknown Client'}</p>
                  <p className="text-xs text-muted-foreground">{order.clientEmail}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p className="font-medium">{order.freelancerName || 'Unassigned'}</p>
                  <p className="text-xs text-green-600 font-semibold">
                    KSh {(order.freelancerAmount || 0).toFixed(2)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p className="font-medium">{order.managerName || 'No Manager'}</p>
                  <p className="text-xs text-blue-600 font-semibold">
                    KSh {((order.managerAssignedFee || 0) + (order.managerDeliveryFee || 0)).toFixed(2)}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-bold text-lg">
                KSh {(order.totalAmount || order.amount || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-green-600 font-semibold">
                KSh {(order.freelancerAmount || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-blue-600 font-semibold">
                KSh {((order.managerAssignedFee || 0) + (order.managerDeliveryFee || 0)).toFixed(2)}
              </TableCell>
              <TableCell>
                <Input
                  placeholder="e.g., RK12345678"
                  value={mpesaCodes[order.id] || ''}
                  onChange={(e) => setMpesaCodes(prev => ({ ...prev, [order.id]: e.target.value }))}
                  disabled={confirming === order.id}
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => handleConfirmPayment(order.id)}
                  disabled={confirming === order.id || !mpesaCodes[order.id]?.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {confirming === order.id ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Confirming...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-1" />Confirm Payment</>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [rejectionReasons, setRejectionReasons] = useState<{[key: number]: string}>({});
  const [adminVerificationCodes, setAdminVerificationCodes] = useState<{[key: number]: string}>({});
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const hasCheckedAuth = useRef(false);

  // Batch payment states
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [batchMpesaCode, setBatchMpesaCode] = useState('');
  const [processingBatch, setProcessingBatch] = useState(false);

  // Helper function for auth headers
  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  // Auth check - runs once
  useEffect(() => {
    if (loading || hasCheckedAuth.current) return;
    
    hasCheckedAuth.current = true;
    
    if (!user || user.role !== 'admin') {
      router.replace('/');
    } else {
      fetchPayments();
      fetchPaymentRequests();
    }
  }, [loading, user, router]);

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const response = await safeApiFetch('/api/payments', { headers: { ...authHeaders() } });
      if (response.ok) {
        const data = await response.json();
        // Handle API response structure: { success: true, data: [...] } or just array
        const paymentsArray = Array.isArray(data) ? data : (data?.data || []);
        setPayments(Array.isArray(paymentsArray) ? paymentsArray : []);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await safeApiFetch('/api/payment-requests?status=pending', { headers: { ...authHeaders() } });
      if (res.ok) {
        const data = await res.json();
        // Handle API response structure: { success: true, data: [...] } or just array
        const requestsArray = Array.isArray(data) ? data : (data?.data || []);
        setPaymentRequests(Array.isArray(requestsArray) ? requestsArray : []);
      }
    } catch (e) {
      console.error('Failed to fetch payment requests:', e);
      setPaymentRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleConfirm = async (paymentId: number) => {
    const adminCode = adminVerificationCodes[paymentId]?.trim();
    if (!adminCode) {
      toast.error('Please enter your M-PESA verification code');
      return;
    }

    try {
      const response = await safeApiFetch(`/api/payments/${paymentId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ 
          confirmed: true,
          adminVerificationCode: adminCode
        }),
      });

      if (response.ok) {
        toast.success('Payment confirmed! Balances distributed to freelancer and manager.');
        setAdminVerificationCodes(prev => ({ ...prev, [paymentId]: '' }));
        fetchPayments();
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'M-PESA codes do not match'));
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast.error('An error occurred');
    }
  };

  const handleReject = async (paymentId: number) => {
    try {
      const response = await safeApiFetch(`/api/payments/${paymentId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ confirmed: false }),
      });

      if (response.ok) {
        fetchPayments();
      }
    } catch (error) {
      console.error('Failed to reject payment:', error);
    }
  };

  // Payment Request actions
  const confirmRequest = async (id: number) => {
    if (!user) return;
    try {
      const res = await safeApiFetch(`/api/payment-requests/${id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ adminId: user.id })
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(extractErrorMessage(d, 'Failed to confirm request'));
      } else {
        toast.success('Payment request confirmed and client wallet credited');
        fetchPaymentRequests();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to confirm request');
    }
  };

  const rejectRequest = async (id: number) => {
    if (!user) return;
    try {
      const reason = rejectionReasons[id]?.trim();
      if (!reason) {
        toast.error('Enter a rejection reason');
        return;
      }
      const res = await safeApiFetch(`/api/payment-requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ adminId: user.id, rejectionReason: reason })
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(extractErrorMessage(d, 'Failed to reject request'));
      } else {
        toast.success('Payment request rejected');
        setRejectionReasons(prev => ({ ...prev, [id]: '' }));
        fetchPaymentRequests();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject request');
    }
  };

  // Batch payment processing
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleAllOrders = (orders: any[]) => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const handleBatchPayment = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order');
      return;
    }

    if (!batchMpesaCode.trim()) {
      toast.error('Please enter M-Pesa code for batch payment');
      return;
    }

    try {
      setProcessingBatch(true);
      const orderIds = Array.from(selectedOrders);

      // Process each order individually (could be optimized with a batch API endpoint)
      const results = await Promise.allSettled(
        orderIds.map(orderId =>
          safeApiFetch(`/api/v2/orders/${orderId}/payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders(),
            },
            credentials: 'include',
            body: JSON.stringify({
              adminId: user?.id || 1,
              transactionId: batchMpesaCode,
              paymentMethod: 'mpesa',
              phoneNumber: null,
            }),
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`Batch payment processed: ${successful} confirmed, ${failed} failed`, { duration: 5000 });
        setSelectedOrders(new Set());
        setBatchMpesaCode('');
        // Refresh data
        fetchPayments();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        toast.error('All batch payments failed. Please try again.');
      }
    } catch (error) {
      console.error('Batch payment error:', error);
      toast.error('Batch payment processing failed');
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleExport = async (groupBy: 'client' | 'manager' | 'freelancer') => {
    try {
      const res = await safeApiFetch(`/api/admin/invoices/export?groupBy=${groupBy}`, { headers: { ...authHeaders() } });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(extractErrorMessage(d, 'Export failed'));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-invoices-${groupBy}-${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${groupBy} invoices`);
    } catch (e) {
      console.error('Export error', e);
      toast.error('Export failed');
    }
  };

  // Categorize payments into 3 columns
  // unpaidOrders: payments that are pending/processing but NO mpesaCode (client hasn't paid yet)
  const unpaidOrders = payments.filter(p => 
    (p.status === 'pending' || p.status === 'processing' || !p.status) && !p.mpesaCode
  );
  // pendingApprovalOrders: payments with mpesaCode but not yet confirmed (client paid, admin needs to verify)
  const pendingApprovalOrders = payments.filter(p => 
    p.mpesaCode && !p.confirmedByAdmin && p.status !== 'confirmed' && p.status !== 'completed'
  );
  // settledOrders: confirmed payments
  const settledOrders = payments.filter(p => 
    p.status === 'confirmed' || p.status === 'completed' || p.confirmedByAdmin
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">Invoice & Payment Processing</h1>
          <p className="text-muted-foreground">
            3-Column workflow: Unpaid ? Pending Approval ? Settled
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => handleExport('client')}>
            <Download className="w-4 h-4 mr-2" /> Export by Client
          </Button>
          <Button variant="outline" onClick={() => handleExport('manager')}>
            <Download className="w-4 h-4 mr-2" /> Export by Manager
          </Button>
          <Button variant="outline" onClick={() => handleExport('freelancer')}>
            <Download className="w-4 h-4 mr-2" /> Export by Freelancer
          </Button>
        </div>
      </div>

      {/* 🟢 SAFARICOM M-PESA DARAJA PRODUCTION DASHBOARD */}
      <div className="mb-8">
        <MpesaPaymentsDashboard />
      </div>

      {/* 💳 PAYSTACK PAYMENT VERIFICATION SECTION */}
      <div className="mb-8">
        <PaystackPaymentsApproval />
      </div>

      <div className="mb-8">
        <ReleasePayoutsPanel />
      </div>

      {/* 3-COLUMN INVOICE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* COLUMN 1: UNPAID ORDERS */}
        <Card className="border-2 border-orange-200 bg-orange-50/20">
          <CardHeader className="bg-orange-100/50">
            <CardTitle className="flex items-center gap-3 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Unpaid Orders
            </CardTitle>
            <CardDescription>Orders awaiting client payment</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingPayments ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
              </div>
            ) : unpaidOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No unpaid orders</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {unpaidOrders.map((payment) => (
                  <div 
                    key={payment.id}
                    className="p-4 bg-card border border-orange-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/admin/jobs/${payment.jobId}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-semibold text-orange-700">
                        Order #{payment.jobId}
                      </span>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Unpaid
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-orange-900 mb-1">
                      KSh {payment.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLUMN 2: PAID - PENDING ADMIN APPROVAL */}
        <Card className="border-2 border-yellow-200 bg-yellow-50/20">
          <CardHeader className="bg-yellow-100/50">
            <CardTitle className="flex items-center gap-3 text-yellow-700">
              <ShieldCheck className="w-5 h-5" />
              Paid - Awaiting Confirmation
            </CardTitle>
            <CardDescription>
              Client paid, needs admin M-Pesa verification
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingPayments ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-500" />
              </div>
            ) : pendingApprovalOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No payments awaiting approval</p>
              </div>
            ) : (
              <>
                {/* Batch Payment Controls */}
                {selectedOrders.size > 0 && (
                  <div className="mb-4 p-4 bg-yellow-100/60 dark:bg-yellow-950/20 border-2 border-yellow-400 dark:border-yellow-800/60 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-yellow-900">
                        Batch Payment: {selectedOrders.size} selected
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter M-Pesa code for all"
                        value={batchMpesaCode}
                        onChange={(e) => setBatchMpesaCode(e.target.value.toUpperCase())}
                        className="flex-1 font-mono"
                        maxLength={15}
                      />
                      <Button
                        size="sm"
                        onClick={handleBatchPayment}
                        disabled={processingBatch || !batchMpesaCode.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingBatch ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Processing...</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 mr-1" />Confirm All</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {pendingApprovalOrders.map((payment) => (
                    <div 
                      key={payment.id}
                      className={`p-4 bg-card border-2 rounded-lg transition-all ${
                        selectedOrders.has(payment.jobId) 
                          ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20' 
                          : 'border-yellow-200 hover:border-yellow-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(payment.jobId)}
                          onChange={() => toggleOrderSelection(payment.jobId)}
                          className="mt-1 w-4 h-4 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span 
                              className="font-mono text-sm font-semibold text-yellow-700 cursor-pointer hover:underline"
                              onClick={() => router.push(`/admin/jobs/${payment.jobId}`)}
                            >
                              Order #{payment.jobId}
                            </span>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              Pending
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-yellow-900 mb-2">
                            KSh {payment.amount.toFixed(2)}
                          </div>
                          {payment.mpesaCode && (
                            <div className="text-xs text-muted-foreground mb-2">
                              Client Code: <span className="font-mono font-semibold">{payment.mpesaCode}</span>
                            </div>
                          )}
                          <div className="flex gap-3 mt-2">
                            <Input
                              placeholder="Admin M-Pesa code"
                              value={adminVerificationCodes[payment.id] || ''}
                              onChange={(e) => setAdminVerificationCodes(prev => ({ 
                                ...prev, 
                                [payment.id]: e.target.value.toUpperCase() 
                              }))}
                              className="text-sm font-mono"
                              maxLength={15}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirm(payment.id);
                              }}
                              disabled={!adminVerificationCodes[payment.id]?.trim()}
                              className="bg-green-600 hover:bg-green-700 shrink-0"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* COLUMN 3: SETTLED/CONFIRMED */}
        <Card className="border-2 border-green-200 bg-green-50/20">
          <CardHeader className="bg-green-100/50">
            <CardTitle className="flex items-center gap-3 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Settled Invoices
            </CardTitle>
            <CardDescription>Admin confirmed or STK auto-approved</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingPayments ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500" />
              </div>
            ) : settledOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No settled payments yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {settledOrders.map((payment) => (
                  <div 
                    key={payment.id}
                    className="p-4 bg-card border border-green-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/admin/jobs/${payment.jobId}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-semibold text-green-700">
                        Order #{payment.jobId}
                      </span>
                      <Badge className="bg-green-600">
                        Settled
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-green-900 mb-1">
                      KSh {payment.amount.toFixed(2)}
                    </div>
                    {payment.adminVerificationCode && (
                      <div className="text-xs text-muted-foreground mb-1">
                        Code: <span className="font-mono font-semibold">{payment.adminVerificationCode}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{format(new Date(payment.confirmedAt || payment.createdAt), 'MMM dd, yyyy')}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPaymentId(payment.id);
                        }}
                        className="h-7 text-xs"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* APPROVED ORDERS (LEGACY SECTION - MOVED TO COLUMN 2) */}
      <div className="mb-8">
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Approved Orders Awaiting Payment (Legacy View)
            </CardTitle>
            <CardDescription>
              Client has approved work and paid via Till Number <strong>6392479</strong>. Enter M-PESA code to confirm payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovedOrdersPaymentSection user={user} router={router} />
          </CardContent>
        </Card>
      </div>

        {/* Payment Requests Management */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Payment Requests</CardTitle>
              <CardDescription>Confirm or reject client-submitted wallet top-ups</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : paymentRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No pending payment requests</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Rejection Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRequests.map((pr) => (
                        <TableRow key={pr.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{pr.client?.name || `Client #${pr.clientId}`}</span>
                              <span className="text-xs text-muted-foreground">{pr.client?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">KSh {Number(pr.amount).toFixed(2)}</TableCell>
                          <TableCell>{pr.phoneNumber}</TableCell>
                          <TableCell className="font-mono">{pr.transactionReference}</TableCell>
                          <TableCell>{format(new Date(pr.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell className="min-w-[220px]">
                            <Input
                              placeholder="Reason (required for reject)"
                              value={rejectionReasons[pr.id] || ''}
                              onChange={(e) => setRejectionReasons(prev => ({ ...prev, [pr.id]: e.target.value }))}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-3">
                              <Button size="sm" onClick={() => confirmRequest(pr.id)}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Confirm
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectRequest(pr.id)}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Invoice Generator Dialog */}
      {selectedPaymentId && (
        <InvoiceGenerator
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
        />
      )}
    </div>
  );
}
