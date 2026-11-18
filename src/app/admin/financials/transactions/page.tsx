'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Download, Filter, Search, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { InvoiceDownload } from '@/components/invoice-download';

interface Transaction {
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
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  job: {
    id: number;
    displayId: string;
    title: string;
  };
}

export default function FinancialTransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0, hasMore: false });

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchTransactions();
      }
    }
  }, [user, loading, router, typeFilter, statusFilter]);

  const fetchTransactions = async (offset = 0) => {
    try {
      setLoadingData(true);
      const params = new URLSearchParams({
        limit: '100',
        offset: offset.toString(),
      });

      if (typeFilter !== 'all') {
        params.append('transactionType', typeFilter);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await safeApiFetch(`/api/v2/payment-transactions?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to load transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error loading transactions');
    } finally {
      setLoadingData(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('transactionType', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      // TODO: Add CSV export endpoint
      toast.info('Export functionality coming soon');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  const filteredTransactions = transactions.filter(t =>
    searchTerm === '' ||
    t.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.job.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.reason && t.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-blue-100 text-blue-800';
      case 'writer_credit': return 'bg-green-100 text-green-800';
      case 'manager_credit': return 'bg-purple-100 text-purple-800';
      case 'admin_commission': return 'bg-orange-100 text-orange-800';
      case 'rollback': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'rolled_back': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading || !user) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Complete audit trail of all payment transactions and balance changes
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchTransactions(0)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {filteredTransactions.length > 0 && (
            <InvoiceDownload
              items={filteredTransactions.map(t => ({
                orderId: t.job.displayId,
                title: t.job.title,
                client: t.user.name,
                amount: t.amount,
                date: t.createdAt,
                status: t.status,
              }))}
              title="Payment Transactions Report"
              subtitle={`${typeFilter !== 'all' ? formatTransactionType(typeFilter) : 'All Types'} | ${statusFilter !== 'all' ? statusFilter : 'All Statuses'}`}
              userRole="Admin"
            />
          )}
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="writer_credit">Writer Credit</SelectItem>
                  <SelectItem value="manager_credit">Manager Credit</SelectItem>
                  <SelectItem value="admin_commission">Admin Commission</SelectItem>
                  <SelectItem value="rollback">Rollback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="rolled_back">Rolled Back</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, order, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {pagination.total} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance Before</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                          {formatTransactionType(transaction.transactionType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link
                            href={`/admin/user-management/${transaction.user.id}`}
                            className="font-medium hover:underline"
                          >
                            {transaction.user.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{transaction.user.role}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${transaction.job.id}`}
                          className="hover:underline"
                        >
                          <div>
                            <p className="font-medium">{transaction.job.displayId}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {transaction.job.title}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.amount >= 0 ? 'text-green-600 flex items-center justify-end gap-1' : 'text-red-600 flex items-center justify-end gap-1'}>
                          {transaction.amount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          KSh {Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        KSh {transaction.balanceBefore.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        KSh {transaction.balanceAfter.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transaction.reason || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3">
                          <Link href={`/admin/orders/${transaction.job.id}`}>
                            <Button variant="outline" size="sm">
                              View Order
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => fetchTransactions(pagination.offset + pagination.limit)}
              >
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
