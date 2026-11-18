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
  CheckCircle, XCircle, Clock, AlertCircle, User, BarChart3,
  TrendingUp, Zap, Timer
} from 'lucide-react';

interface FreelancerResponse {
  id: number;
  orderId: number;
  orderDisplayId: string | null;
  freelancerId: number;
  freelancerName: string | null;
  freelancerEmail: string | null;
  responseStatus: string;
  responseTime: number | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface FreelancerStat {
  freelancerId: number;
  freelancerName: string | null;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalResponses: number;
  acceptanceRate: number;
  avgResponseTime: number;
}

interface ResponseStats {
  totalResponses: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  acceptanceRate: number;
  avgResponseTime: number;
  rejectionReasons: Record<string, number>;
}

export default function FreelancerResponsesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<FreelancerResponse[]>([]);
  const [stats, setStats] = useState<ResponseStats | null>(null);
  const [freelancerStats, setFreelancerStats] = useState<FreelancerStat[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics'>('analytics');
  
  // Filters
  const [filters, setFilters] = useState({
    freelancerId: '',
    responseStatus: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return;
      }
      fetchResponses();
    }
  }, [user, authLoading, router]);

  const fetchResponses = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      
      if (filters.freelancerId) params.set('freelancerId', filters.freelancerId);
      if (filters.responseStatus) params.set('responseStatus', filters.responseStatus);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const response = await safeApiFetch(`/api/v2/admin/freelancer-responses?${params}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses || []);
        setStats(data.stats || null);
        setFreelancerStats(data.freelancerStats || []);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to load response data'));
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to load response data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchResponses(1);
  };

  const clearFilters = () => {
    setFilters({ freelancerId: '', responseStatus: '', dateFrom: '', dateTo: '' });
    setTimeout(() => fetchResponses(1), 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatResponseTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3" /> },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" /> },
      expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <AlertCircle className="h-3 w-3" /> },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: null };
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
          <h1 className="text-3xl font-bold text-gray-900">Freelancer Response Analytics</h1>
          <p className="text-gray-600 mt-2">Track how freelancers respond to job assignments</p>
        </div>
        <Button variant="outline" onClick={() => fetchResponses(pagination.page)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalResponses}</p>
                  <p className="text-sm text-gray-500">Total Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.acceptanceRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Acceptance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Timer className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{formatResponseTime(stats.avgResponseTime)}</p>
                  <p className="text-sm text-gray-500">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
                  <p className="text-sm text-gray-500">Pending Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Reasons Breakdown */}
      {stats && Object.keys(stats.rejectionReasons).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Rejection Reasons Breakdown</CardTitle>
            <CardDescription>Common reasons why freelancers decline assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.rejectionReasons).map(([reason, count]) => (
                <div key={reason} className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-2xl font-bold text-red-600">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{reason.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-3 mb-4">
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Per Freelancer Stats
        </Button>
        <Button
          variant={activeTab === 'responses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('responses')}
        >
          <Zap className="h-4 w-4 mr-2" />
          Response Log
        </Button>
      </div>

      {activeTab === 'analytics' ? (
        /* Per Freelancer Analytics */
        <Card>
          <CardHeader>
            <CardTitle>Freelancer Performance</CardTitle>
            <CardDescription>Response statistics per freelancer</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
              </div>
            ) : freelancerStats.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No freelancer response data available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Freelancer</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Accepted</TableHead>
                    <TableHead className="text-center">Rejected</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Acceptance Rate</TableHead>
                    <TableHead className="text-center">Avg Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {freelancerStats.map((stat) => (
                    <TableRow key={stat.freelancerId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{stat.freelancerName || `User #${stat.freelancerId}`}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{stat.totalResponses}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800">{stat.acceptedCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-100 text-red-800">{stat.rejectedCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-100 text-yellow-800">{stat.pendingCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${stat.acceptanceRate >= 70 ? 'text-green-600' : stat.acceptanceRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {stat.acceptanceRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatResponseTime(stat.avgResponseTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Response Log */
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Freelancer ID</Label>
                  <Input
                    placeholder="Enter freelancer ID..."
                    value={filters.freelancerId}
                    onChange={(e) => setFilters({ ...filters, freelancerId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Response Status</Label>
                  <Select
                    value={filters.responseStatus}
                    onValueChange={(value) => setFilters({ ...filters, responseStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
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

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ff8c42]" />
                </div>
              ) : responses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No responses found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Freelancer</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Response Time</TableHead>
                      <TableHead>Rejection Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => {
                      const statusInfo = getStatusBadge(response.responseStatus);
                      
                      return (
                        <TableRow key={response.id}>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(response.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {response.orderDisplayId || `#${response.orderId}`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{response.freelancerName || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{response.freelancerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatResponseTime(response.responseTime)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {response.rejectionReason || '-'}
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} responses
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchResponses(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchResponses(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
