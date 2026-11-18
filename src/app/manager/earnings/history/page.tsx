"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context-v2";
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
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Filter,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { InvoiceDownload } from "@/components/invoice-download";

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

const changeTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'order_completion', label: 'Order Completed' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'assignment_fee', label: 'Assignment Fee' },
  { value: 'submission_fee', label: 'Submission Fee' },
  { value: 'fine', label: 'Fine' },
  { value: 'manual_adjustment', label: 'Manual Adjustment' },
  { value: 'payout', label: 'Payout' },
  { value: 'bonus', label: 'Bonus' },
];

export default function ManagerBalanceHistoryPage() {
  const { user } = useAuth();
  const [data, setData] = useState<BalanceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [changeType, setChangeType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchHistory = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      
      if (changeType && changeType !== 'all') {
        params.set('changeType', changeType);
      }
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      const response = await safeApiFetch(`/api/v2/balance-history?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance history');
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
    fetchHistory();
  }, [user?.id, page, changeType, startDate, endDate]);

  // Calculate summary stats
  const totalCredits = data?.history
    .filter(h => h.changeAmount > 0)
    .reduce((sum, h) => sum + h.changeAmount, 0) || 0;

  const totalDebits = data?.history
    .filter(h => h.changeAmount < 0)
    .reduce((sum, h) => sum + Math.abs(h.changeAmount), 0) || 0;

  const getChangeTypeColor = (changeType: string): string => {
    const positiveTypes = ['order_completion', 'settlement', 'assignment_fee', 'submission_fee', 'bonus'];
    const negativeTypes = ['fine', 'payout'];
    
    if (positiveTypes.includes(changeType)) return 'text-green-600 bg-green-50';
    if (negativeTypes.includes(changeType)) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Balance History</h1>
          <p className="text-muted-foreground">
            View all transactions affecting your earnings
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchHistory} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {data?.history && data.history.length > 0 && (
            <InvoiceDownload
              items={data.history.map(item => ({
                orderId: item.referenceId ? `#${item.referenceId}` : `TXN-${item.id}`,
                title: item.changeTypeLabel,
                amount: item.changeAmount,
                date: item.createdAt,
                status: item.changeType,
              }))}
              title="Manager Balance History"
              userName={data?.user?.name}
              userRole="Manager"
              totalAmount={totalCredits - totalDebits}
            />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {(data?.user?.currentBalance || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +KSh {totalCredits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -KSh {totalDebits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.pagination?.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total records</p>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Transaction Type</label>
              <Select value={changeType} onValueChange={(value) => { setChangeType(value); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {changeTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  setChangeType('all');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Showing {data?.history?.length || 0} of {data?.pagination?.totalCount || 0} transactions
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
              <Button onClick={fetchHistory} className="mt-4">Try Again</Button>
            </div>
          ) : data?.history && data.history.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance Before</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getChangeTypeColor(item.changeType)} variant="outline">
                          {item.changeTypeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 font-medium ${
                          item.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.changeAmount >= 0 ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                          KSh {Math.abs(item.changeAmount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        KSh {item.balanceBefore.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        KSh {item.balanceAfter.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {item.referenceType && item.referenceId ? (
                          <span className="text-sm">
                            {item.referenceType}: #{item.referenceId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transaction history found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your earnings history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
