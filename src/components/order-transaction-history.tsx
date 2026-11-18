'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Receipt, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

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
}

interface OrderTransactionHistoryProps {
  orderId: number;
  compact?: boolean;
}

export function OrderTransactionHistory({ orderId, compact = false }: OrderTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, [orderId]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/v2/payment-transactions/order/${orderId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching order transactions:', error);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading transaction history...
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Receipt className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>Payment transactions for this order</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No transactions recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Transactions:</span>
              <span className="font-medium">{summary?.total || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">KSh {Math.abs(summary?.totalAmount || 0).toLocaleString()}</span>
            </div>
            {summary?.byType && (
              <div className="pt-2 border-t">
                {Object.entries(summary.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs py-1">
                    <span className="text-muted-foreground">{formatTransactionType(type)}:</span>
                    <span>{count as number}</span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href={`/admin/financials/transactions?jobId=${orderId}`}
              className="text-xs text-blue-600 hover:underline block pt-2"
            >
              View Full History →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Receipt className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} • Total: KSh {Math.abs(summary?.totalAmount || 0).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
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
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(transaction.createdAt), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                      {formatTransactionType(transaction.transactionType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{transaction.user.name}</p>
                      <p className="text-xs text-muted-foreground">{transaction.user.role}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.amount >= 0 ? 'text-green-600 flex items-center justify-end gap-1' : 'text-red-600 flex items-center justify-end gap-1'}>
                      {transaction.amount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      KSh {Math.abs(transaction.amount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    KSh {transaction.balanceBefore.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    KSh {transaction.balanceAfter.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                    {transaction.reason || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
