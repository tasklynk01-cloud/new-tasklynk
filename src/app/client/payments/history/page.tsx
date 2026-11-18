"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';

type PaymentRecord = {
  paymentId: number;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
  mpesaCode: string | null;
  phoneNumber: string | null;
  createdAt: string;
  updatedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
  jobId: number | null;
  jobDisplayId: string | null;
  jobTitle: string | null;
  jobAmount: number | null;
  jobStatus: string | null;
  userName: string | null;
  userEmail: string | null;
};

type PaginationInfo = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export default function PaymentHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/client/payments/history');
    }
  }, [user, loading, router]);

  const fetchPayments = async (offset = 0) => {
    try {
      setLoadingPayments(true);
      const response = await safeApiFetch(`/api/v2/payments/history?userId=${user?.id}&limit=50&offset=${offset}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.data.payments);
        setPagination(data.data.pagination);
      } else {
        toast.error(extractErrorMessage(data, 'Failed to load payment history'));
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
      case 'confirmed':
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700"><Clock className="w-4 h-4 mr-1" />Pending</Badge>;
      case 'pending_verification':
        return <Badge className="bg-blue-600 hover:bg-blue-700"><Clock className="w-4 h-4 mr-1" />Verifying</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'pesapal':
        return 'M-Pesa (Pesapal)';
      case 'till':
        return 'M-Pesa (Till 6392479)';
      case 'mpesa':
        return 'M-Pesa';
      default:
        return method;
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          Payment History
        </h1>
        <p className="text-muted-foreground">
          View all your payment transactions and their status
        </p>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Transaction History</CardTitle>
              <CardDescription>
                {pagination.total} total transaction{pagination.total !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPayments(pagination.offset)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">No Payment History</p>
              <p className="text-muted-foreground mb-6">
                Your payment transactions will appear here
              </p>
              <Link href="/client/wallet/add-funds">
                <Button variant="default">
                  Add Funds
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.paymentId}
                  className="border-2 rounded-lg p-4 transition-all border-border hover:border-primary/40"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">
                          {payment.jobTitle || 'Wallet Top-Up'}
                        </h3>
                        {payment.jobDisplayId && (
                          <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-semibold text-primary bg-primary/10">
                            {payment.jobDisplayId}
                          </span>
                        )}
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Method:</span> {getMethodLabel(payment.method)}
                        </div>
                        {payment.phoneNumber && (
                          <div>
                            <span className="font-medium">Phone:</span> {payment.phoneNumber}
                          </div>
                        )}
                        {payment.transactionId && (
                          <div>
                            <span className="font-medium">Transaction ID:</span> {payment.transactionId}
                          </div>
                        )}
                        {payment.mpesaCode && (
                          <div>
                            <span className="font-medium">M-Pesa Code:</span> {payment.mpesaCode}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Date:</span> {new Date(payment.createdAt).toLocaleString()}
                        </div>
                        {payment.verifiedAt && (
                          <div>
                            <span className="font-medium">Verified:</span> {new Date(payment.verifiedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {payment.notes && (
                        <div className="mt-2 text-sm italic text-muted-foreground">
                          Note: {payment.notes}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        KSh {payment.amount.toFixed(2)}
                      </div>
                      {payment.jobId && (
                        <Link href={`/client/orders/${payment.jobId}`}>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            View Order
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => fetchPayments(pagination.offset - pagination.limit)}
                disabled={pagination.offset === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchPayments(pagination.offset + pagination.limit)}
                disabled={!pagination.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link href="/client/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
