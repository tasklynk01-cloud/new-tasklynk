'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useDashboardProtection } from '@/hooks/useDashboardProtection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Filter, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';

interface PaymentTransaction {
  id: number;
  paymentId: number;
  jobId: number;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  reason: string | null;
  createdAt: string;
  job?: {
    displayId: string;
    title: string;
    orderId: string;
  };
}

export default function PaymentTransactionsPage() {
  const { user, loading: isAuthLoading } = useDashboardProtection(['freelancer']);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user?.id, page, typeFilter, statusFilter]);

  const fetchTransactions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (typeFilter !== 'all') params.append('transactionType', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await safeApiFetch(`/api/v2/payment-transactions/user/${user.id}?${params.toString()}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (err) {
      setError('Failed to load payment transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      payment: 'bg-blue-100 text-blue-800',
      writer_credit: 'bg-green-100 text-green-800',
      manager_credit: 'bg-purple-100 text-purple-800',
      admin_commission: 'bg-yellow-100 text-yellow-800',
      rollback: 'bg-red-100 text-red-800',
      withdrawal: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment: 'Payment',
      writer_credit: 'Writer Credit',
      manager_credit: 'Manager Credit',
      admin_commission: 'Admin Commission',
      rollback: 'Rollback',
      withdrawal: 'Withdrawal',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      rolled_back: 'bg-gray-100 text-gray-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatAmount = (amount: number, type: string) => {
    const isCredit = type === 'writer_credit' || type === 'payment';
    return (
      <span className={isCredit ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
        {isCredit ? '+' : '-'}KSh {Math.abs(amount).toLocaleString()}
      </span>
    );
  };

  // Filter transactions by search query
  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.job?.displayId?.toLowerCase().includes(query) ||
      t.job?.title?.toLowerCase().includes(query) ||
      t.transactionType.toLowerCase().includes(query) ||
      t.reason?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalCount / limit);

  // Calculate summary stats
  const totalCredits = transactions
    .filter(t => t.transactionType === 'writer_credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions
    .filter(t => t.transactionType === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4">
          <Link href="/freelancer/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Transactions</h1>
            <p className="text-white/80">Detailed breakdown of all your earnings and transactions</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-4 bg-green-100 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Credits</p>
                  <p className="text-xl font-bold text-green-600">KSh {totalCredits.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-4 bg-orange-100 rounded-lg">
                  <ArrowDownRight className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Withdrawals</p>
                  <p className="text-xl font-bold text-orange-600">KSh {totalWithdrawals.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-4 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-xl font-bold text-blue-600">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by order ID, title, or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="writer_credit">Writer Credit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="rollback">Rollback</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View all your payment transactions with detailed information</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-orange mx-auto"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No transactions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance Before</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            {transaction.job ? (
                              <Link href={`/freelancer/orders/${transaction.jobId}`} className="text-blue-600 hover:underline">
                                {transaction.job.displayId || transaction.job.orderId}
                              </Link>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                              {getTransactionTypeLabel(transaction.transactionType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatAmount(transaction.amount, transaction.transactionType)}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            KSh {transaction.balanceBefore.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            KSh {transaction.balanceAfter.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={transaction.reason || ''}>
                            {transaction.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount}
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
                      <span className="px-4 py-2 text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
