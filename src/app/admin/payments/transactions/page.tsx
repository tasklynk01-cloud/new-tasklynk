"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  Filter,
  DollarSign,
  ArrowUp,
  ArrowDown,
  FileText,
  AlertCircle,
  RotateCcw,
  CreditCard,
  Users,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";

interface PaymentTransaction {
  id: number;
  paymentId: number;
  jobId: number;
  transactionType: string;
  userId: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  reason: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  jobTitle: string | null;
  jobDisplayId: string | null;
  typeLabel: string;
  statusLabel: string;
}

interface TransactionResponse {
  success: boolean;
  transactions: PaymentTransaction[];
  summary: {
    totalPayments: number;
    totalRollbacks: number;
    totalWriterCredits: number;
    totalManagerCredits: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

const transactionTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'payment', label: 'Client Payment' },
  { value: 'writer_credit', label: 'Writer Credit' },
  { value: 'manager_credit', label: 'Manager Credit' },
  { value: 'admin_commission', label: 'Admin Commission' },
  { value: 'rollback', label: 'Rollback' },
  { value: 'refund', label: 'Refund' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'rolled_back', label: 'Rolled Back' },
];

export default function AdminPaymentTransactionsPage() {
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [transactionType, setTransactionType] = useState('all');
  const [status, setStatus] = useState('all');
  const [jobId, setJobId] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');
      
      if (transactionType && transactionType !== 'all') {
        params.set('transactionType', transactionType);
      }
      if (status && status !== 'all') {
        params.set('status', status);
      }
      if (jobId) {
        params.set('jobId', jobId);
      }
      if (userId) {
        params.set('userId', userId);
      }
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      const response = await safeApiFetch(`/api/v2/payment-transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, transactionType, status, jobId, userId, startDate, endDate]);

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'payment': 'bg-blue-100 text-blue-800',
      'writer_credit': 'bg-green-100 text-green-800',
      'manager_credit': 'bg-purple-100 text-purple-800',
      'admin_commission': 'bg-yellow-100 text-yellow-800',
      'rollback': 'bg-red-100 text-red-800',
      'refund': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'rolled_back': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Transactions</h1>
          <p className="text-muted-foreground">
            Audit trail for all payment-related transactions
          </p>
        </div>
        <Button onClick={fetchTransactions} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary?.totalPayments || 0}</div>
            <p className="text-xs text-muted-foreground">Total payment records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Writer Credits</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {(data?.summary?.totalWriterCredits || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total credited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manager Credits</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              KSh {(data?.summary?.totalManagerCredits || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total credited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rollbacks</CardTitle>
            <RotateCcw className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data?.summary?.totalRollbacks || 0}</div>
            <p className="text-xs text-muted-foreground">Reversed transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={transactionType} onValueChange={(value) => { setTransactionType(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Job ID</label>
              <Input
                placeholder="Filter by job"
                value={jobId}
                onChange={(e) => { setJobId(e.target.value); setPage(1); }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setTransactionType('all');
                  setStatus('all');
                  setJobId('');
                  setUserId('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Log</CardTitle>
          <CardDescription>
            Showing {data?.transactions?.length || 0} of {data?.pagination?.totalCount || 0} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchTransactions} className="mt-4">Try Again</Button>
            </div>
          ) : data?.transactions && data.transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Before</TableHead>
                      <TableHead>After</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(tx.transactionType)} variant="outline">
                            {tx.typeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tx.userName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{tx.userRole}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tx.jobDisplayId ? (
                            <span className="font-mono text-sm">{tx.jobDisplayId}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? '+' : ''}KSh {tx.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          KSh {tx.balanceBefore.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          KSh {tx.balanceAfter.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tx.status)} variant="outline">
                            {tx.statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {tx.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Payment transactions will appear here once payments are processed
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
