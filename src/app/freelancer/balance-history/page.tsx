'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BalanceHistoryItem {
  id: number;
  userId: number;
  balanceBefore: number;
  balanceAfter: number;
  changeAmount: number;
  changeType: string;
  referenceType: string | null;
  referenceId: number | null;
  notes: string | null;
  changedBy: number | null;
  changedByName: string | null;
  createdAt: string;
  formattedAmount: string;
  changeTypeLabel: string;
}

interface BalanceHistoryResponse {
  success: boolean;
  user: {
    id: number;
    name: string;
    currentBalance: number;
  };
  history: BalanceHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

const CHANGE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'order_completion', label: 'Order Completed' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'payout', label: 'Payout' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'fine', label: 'Fine' },
  { value: 'revision_deduction', label: 'Revision Deduction' },
  { value: 'revision_restoration', label: 'Revision Restored' },
  { value: 'manual_adjustment', label: 'Manual Adjustment' },
  { value: 'refund', label: 'Refund' },
];

export default function BalanceHistoryPage() {
  const { user, loading } = useDashboardProtection('freelancer');
  const [data, setData] = useState<BalanceHistoryResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [changeTypeFilter, setChangeTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    setLoadingData(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (changeTypeFilter) params.append('changeType', changeTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await safeApiFetch(`/api/v2/balance-history?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error('Failed to load balance history');
      }
    } catch (error) {
      console.error('Failed to fetch balance history:', error);
      toast.error('Network error loading balance history');
    } finally {
      setLoadingData(false);
    }
  }, [user, page, changeTypeFilter, startDate, endDate]);

  useEffect(() => {
    if (!loading && user) {
      fetchHistory();
    }
  }, [loading, user, fetchHistory]);

  const handleFilterApply = () => {
    setPage(1);
    fetchHistory();
  };

  const handleClearFilters = () => {
    setChangeTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getChangeIcon = (amount: number) => {
    return amount >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  const getChangeBadgeVariant = (changeType: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const positiveTypes = ['order_completion', 'bonus', 'revision_restoration', 'refund'];
    const negativeTypes = ['fine', 'revision_deduction', 'payout'];
    
    if (positiveTypes.includes(changeType)) return 'default';
    if (negativeTypes.includes(changeType)) return 'destructive';
    return 'secondary';
  };

  // Calculate summary stats
  const summaryStats = data?.history.reduce(
    (acc, item) => {
      if (item.changeAmount > 0) {
        acc.totalCredits += item.changeAmount;
        acc.creditCount++;
      } else {
        acc.totalDebits += Math.abs(item.changeAmount);
        acc.debitCount++;
      }
      return acc;
    },
    { totalCredits: 0, totalDebits: 0, creditCount: 0, debitCount: 0 }
  ) || { totalCredits: 0, totalDebits: 0, creditCount: 0, debitCount: 0 };

  if (loading || !user) {
    return <DashboardLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance History</h1>
          <p className="text-muted-foreground mt-1">
            Track all changes to your account balance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Current Balance Card */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Current Balance</p>
              <p className="text-4xl font-bold mt-1">
                KSh {(data?.user.currentBalance || 0).toLocaleString()}
              </p>
            </div>
            <Wallet className="h-12 w-12 text-green-200" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +KSh {summaryStats.totalCredits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.creditCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -KSh {summaryStats.totalDebits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.debitCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              summaryStats.totalCredits - summaryStats.totalDebits >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {summaryStats.totalCredits - summaryStats.totalDebits >= 0 ? '+' : ''}
              KSh {(summaryStats.totalCredits - summaryStats.totalDebits).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.pagination.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {CHANGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value || "all"}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-3">
              <Button onClick={handleFilterApply} className="flex-1">
                Apply
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Showing {data?.history.length || 0} of {data?.pagination.totalCount || 0} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.history.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
              <p className="text-sm">Your balance history will appear here</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Before</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right">After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(item.createdAt), 'HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getChangeBadgeVariant(item.changeType)}>
                            {item.changeTypeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {item.notes || (
                              <span className="text-muted-foreground">
                                {item.referenceType && item.referenceId
                                  ? `${item.referenceType} #${item.referenceId}`
                                  : '-'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          KSh {item.balanceBefore.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {getChangeIcon(item.changeAmount)}
                            <span
                              className={`font-bold ${
                                item.changeAmount >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {item.formattedAmount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          KSh {item.balanceAfter.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
