'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

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
  job: {
    id: number;
    displayId: string;
    title: string;
  };
}

interface UserBalanceHistoryProps {
  userId: number;
  userName?: string;
  currentBalance?: number;
  showHeader?: boolean;
}

export function UserBalanceHistory({
  userId,
  userName = 'User',
  currentBalance,
  showHeader = true
}: UserBalanceHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });

  useEffect(() => {
    fetchBalanceHistory();
  }, [userId]);

  const fetchBalanceHistory = async (offset = 0) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v2/payment-transactions/user/${userId}?limit=50&offset=${offset}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to load balance history');
      }
    } catch (error) {
      console.error('Error fetching balance history:', error);
      toast.error('Error loading balance history');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading balance history...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Wallet className="h-6 w-6" />
              Balance History - {userName}
            </h2>
            <p className="text-muted-foreground mt-1">
              Complete transaction history and balance changes
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchBalanceHistory(0)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Balance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                KSh {(currentBalance ?? summary.currentBalance).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Credits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                +KSh {summary.totalCredits.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Debits</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                -KSh {summary.totalDebits.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {summary.totalTransactions}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Type Breakdown */}
      {summary?.byType && Object.keys(summary.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(summary.byType).map(([type, count]) => (
                <div key={type} className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <Badge className={getTransactionTypeColor(type)}>
                    {formatTransactionType(type)}
                  </Badge>
                  <p className="text-2xl font-bold mt-2">{count as number}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Showing {transactions.length} of {pagination.total} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance Before</TableHead>
                      <TableHead className="text-right">Balance After</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                            {formatTransactionType(transaction.transactionType)}
                          </Badge>
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
                          <span className={transaction.amount >= 0 ? 'text-green-600 flex items-center justify-end gap-1 font-medium' : 'text-red-600 flex items-center justify-end gap-1 font-medium'}>
                            {transaction.amount >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {transaction.amount >= 0 ? '+' : ''}KSh {transaction.amount.toLocaleString()}
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
                        <TableCell className="max-w-[200px]">
                          <span className="text-sm text-muted-foreground">
                            {transaction.reason || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchBalanceHistory(pagination.offset + pagination.limit)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
