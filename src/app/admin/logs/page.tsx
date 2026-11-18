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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Loader2, AlertTriangle, AlertCircle, Info, Search, 
  Trash2, RefreshCw, ChevronLeft, ChevronRight, FileText,
  Clock, User, Activity
} from 'lucide-react';

interface SystemLog {
  id: number;
  type: string;
  message: string;
  userId: number | null;
  action: string | null;
  context: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
}

export default function SystemLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats>({ total: 0, errors: 0, warnings: 0, info: 0 });
  const [actions, setActions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    type: '',
    action: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return;
      }
      fetchLogs();
    }
  }, [user, authLoading, router]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      
      if (filters.type) params.set('type', filters.type);
      if (filters.action) params.set('action', filters.action);
      if (filters.search) params.set('search', filters.search);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const response = await safeApiFetch(`/api/v2/system-logs?${params}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || { total: 0, errors: 0, warnings: 0, info: 0 });
        setActions(data.actions || []);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLogs(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', action: '', search: '', dateFrom: '', dateTo: '' });
    setTimeout(() => fetchLogs(1), 100);
  };

  const handleClearOldLogs = async () => {
    if (!confirm('This will delete logs older than 30 days. Continue?')) return;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      const response = await safeApiFetch(`/api/v2/system-logs?olderThan=${thirtyDaysAgo.toISOString()}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        toast.success('Old logs cleared');
        fetchLogs();
      } else {
        toast.error('Failed to clear logs');
      }
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      error: 'bg-red-100 text-red-800 border-red-200',
      warn: 'bg-amber-100 text-amber-800 border-amber-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return variants[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
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
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-2">Monitor system errors, warnings, and activity</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchLogs(pagination.page)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={handleClearOldLogs}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Old Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.errors.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.warnings.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Info className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.info.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Info</p>
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
              <Label>Log Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                  <SelectItem value="warn">Warnings</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action || ''}>
                      {action}
                    </SelectItem>
                  ))}
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
            <div>
              <Label>Search</Label>
              <div className="flex gap-3">
                <Input
                  placeholder="Search messages..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No logs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="w-[180px]">Time</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead className="w-[80px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedLog(log)}>
                    <TableCell>
                      <Badge className={getTypeBadge(log.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(log.type)}
                          {log.type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate">
                      {log.message}
                    </TableCell>
                    <TableCell>
                      {log.action && (
                        <Badge variant="outline">{log.action}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.userName ? (
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {log.userName}
                        </span>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.context && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLog && getTypeIcon(selectedLog.type)}
              Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Type</Label>
                  <p><Badge className={getTypeBadge(selectedLog.type)}>{selectedLog.type}</Badge></p>
                </div>
                <div>
                  <Label className="text-gray-500">Time</Label>
                  <p className="text-sm">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Action</Label>
                  <p>{selectedLog.action || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">User</Label>
                  <p>{selectedLog.userName || 'System'} {selectedLog.userEmail && `(${selectedLog.userEmail})`}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Message</Label>
                <p className="p-4 bg-muted/30 rounded-lg mt-1">{selectedLog.message}</p>
              </div>
              {selectedLog.context && (
                <div>
                  <Label className="text-gray-500">Context (JSON)</Label>
                  <pre className="p-4 bg-gray-900 text-green-400 rounded-lg mt-1 text-xs overflow-x-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.context), null, 2);
                      } catch {
                        return selectedLog.context;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
