"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { 
  Loader2, Search, RefreshCw, ChevronLeft, ChevronRight, 
  ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown,
  DollarSign, Clock, User, FileText
} from 'lucide-react';

interface BalanceHistoryEntry {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
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
}

interface BalanceStats {
  totalCredits: number;
  totalDebits: number;
  netChange: number;
}

export default function BalanceHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<BalanceHistoryEntry[]>([]);
  const [stats, setStats] = useState<BalanceStats>({ totalCredits: 0, totalDebits: 0, netChange: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  
  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    changeType: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return;
      }
      fetchHistory();
    }
  }, [user, authLoading, router]);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.changeType) params.set('changeType', filters.changeType);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const response = await safeApiFetch(`/api/v2/admin/balance-history?${params}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setStats(data.stats || { totalCredits: 0, totalDebits: 0, netChange: 0 });
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to load balance history'));
      }
    } catch (error) {
      console.error('Error fetching balance history:', error);
      toast.error('Failed to load balance history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchHistory(1);
  };

  const clearFilters = () => {
    setFilters({ userId: '', changeType: '', dateFrom: '', dateTo: '' });
    setTimeout(() => fetchHistory(1), 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getChangeTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      credit: { label: 'Credit', color: 'bg-green-100 text-green-800 border-green-200' },
      debit: { label: 'Debit', color: 'bg-red-100 text-red-800 border-red-200' },
      adjustment: { label: 'Adjustment', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      refund: { label: 'Refund', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      payout: { label: 'Payout', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance History</h1>
          <p className="text-gray-600 mt-2">Track all user balance changes and transactions</p>
        </div>
        <Button variant="outline" onClick={() => fetchHistory(pagination.page)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCredits)}</p>
                <p className="text-sm text-gray-500">Total Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDebits)}</p>
                <p className="text-sm text-gray-500">Total Debits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.netChange >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {stats.netChange >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
              <div>
                <p className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(stats.netChange))}
                </p>
                <p className="text-sm text-gray-500">Net Change</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>User ID</Label>
              <Input
                placeholder="Enter user ID..."
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </div>
            <div>
              <Label>Change Type</Label>
              <Select
                value={filters.changeType}
                onValueChange={(value) => setFilters({ ...filters, changeType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="payout">Payout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-3">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear
              </Button>
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No balance history found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Changed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => {
                  const typeInfo = getChangeTypeBadge(entry.changeType);
                  const isPositive = entry.changeAmount >= 0;
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.userName || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{entry.userEmail}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {entry.userRole || 'N/A'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(entry.balanceBefore)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(entry.changeAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(entry.balanceAfter)}
                      </TableCell>
                      <TableCell>
                        {entry.referenceType && (
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <FileText className="h-3 w-3" />
                            {entry.referenceType}
                            {entry.referenceId && ` #${entry.referenceId}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                        {entry.notes || '-'}
                      </TableCell>
                      <TableCell>
                        {entry.changedByName ? (
                          <span className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {entry.changedByName}
                          </span>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchHistory(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchHistory(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
