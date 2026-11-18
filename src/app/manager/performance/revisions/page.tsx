"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Filter,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

type RevisionOverview = {
  totalRevisions: number;
  clientRevisions: number;
  internalRevisions: number;
  completedRevisions: number;
  pendingRevisions: number;
  revisionRate: number;
  totalOrders: number;
  ordersWithRevisions: number;
};

type FreelancerRevision = {
  freelancerId: number | null;
  freelancerName: string;
  totalRevisions: number;
  clientRevisions: number;
  internalRevisions: number;
};

type WorkTypeRevision = {
  workType: string;
  totalRevisions: number;
  clientRevisions: number;
  internalRevisions: number;
};

type RecentRevision = {
  id: number;
  jobId: number;
  revisionType: string;
  reason: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  displayId: string;
  orderTitle: string;
  freelancerName: string | null;
};

type MonthlyTrend = {
  month: string;
  totalRevisions: number;
  clientRevisions: number;
  internalRevisions: number;
};

export default function ManagerRevisionAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<RevisionOverview | null>(null);
  const [byFreelancer, setByFreelancer] = useState<FreelancerRevision[]>([]);
  const [byWorkType, setByWorkType] = useState<WorkTypeRevision[]>([]);
  const [recentRevisions, setRecentRevisions] = useState<RecentRevision[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await safeApiFetch(`/api/v2/manager/revision-analytics?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setByFreelancer(data.byFreelancer);
        setByWorkType(data.byWorkType);
        setRecentRevisions(data.recentRevisions);
        setMonthlyTrend(data.monthlyTrend);
      } else {
        toast.error('Failed to load revision analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load revision analytics');
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'pending':
      case 'open':
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-600">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRevisionTypeBadge = (type: string) => {
    switch (type) {
      case 'client':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Client</Badge>;
      case 'internal':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Internal QC</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <RotateCcw className="h-6 w-6 text-primary" />
          Revision Analytics
        </h1>
        <p className="text-muted-foreground">
          Track revision patterns and identify areas for improvement
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-3">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-3 md:col-span-2">
              <Button onClick={fetchAnalytics} className="flex-1">
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revisions</p>
                      <p className="text-2xl font-bold">{overview.totalRevisions}</p>
                    </div>
                    <RotateCcw className="h-10 w-10 text-primary/20" />
                  </div>
                  <div className="mt-2 flex gap-3">
                    <Badge variant="outline" className="text-xs">
                      {overview.clientRevisions} Client
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {overview.internalRevisions} Internal
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revision Rate</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {overview.revisionRate}%
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-amber-600/20" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {overview.ordersWithRevisions} of {overview.totalOrders} orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {overview.completedRevisions}
                      </p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-600/20" />
                  </div>
                  <Progress 
                    value={overview.totalRevisions > 0 ? (overview.completedRevisions / overview.totalRevisions) * 100 : 0} 
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {overview.pendingRevisions}
                      </p>
                    </div>
                    <Clock className="h-10 w-10 text-yellow-600/20" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Awaiting completion
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revisions by Freelancer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  Revisions by Freelancer
                </CardTitle>
                <CardDescription>
                  Top freelancers by revision count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {byFreelancer.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {byFreelancer.slice(0, 5).map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{f.freelancerName}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>{f.clientRevisions} client</span>
                              <span></span>
                              <span>{f.internalRevisions} internal</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={f.totalRevisions > 5 ? 'destructive' : 'secondary'}
                        >
                          {f.totalRevisions} revisions
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revisions by Work Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-3">
                  <BarChart3 className="h-4 w-4" />
                  Revisions by Work Type
                </CardTitle>
                <CardDescription>
                  Distribution across work categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {byWorkType.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {byWorkType.map((w, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{w.workType || 'Standard'}</span>
                          <span className="text-sm text-muted-foreground">{w.totalRevisions} revisions</span>
                        </div>
                        <div className="flex gap-3">
                          <div 
                            className="h-2 bg-orange-500 rounded"
                            style={{ width: `${overview?.totalRevisions ? (w.clientRevisions / overview.totalRevisions) * 100 : 0}%` }}
                          />
                          <div 
                            className="h-2 bg-purple-500 rounded"
                            style={{ width: `${overview?.totalRevisions ? (w.internalRevisions / overview.totalRevisions) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Client: {w.clientRevisions}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            Internal: {w.internalRevisions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          {monthlyTrend.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-3">
                  <TrendingUp className="h-4 w-4" />
                  Monthly Trend (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-32">
                  {monthlyTrend.map((m, idx) => {
                    const maxValue = Math.max(...monthlyTrend.map(t => t.totalRevisions));
                    const height = maxValue > 0 ? (m.totalRevisions / maxValue) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-primary/80 rounded-t transition-all"
                          style={{ height: `${height}%`, minHeight: m.totalRevisions > 0 ? '4px' : '0' }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.month + '-01'), 'MMM')}
                        </span>
                        <span className="text-xs font-medium">{m.totalRevisions}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Revisions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-3">
                <FileText className="h-4 w-4" />
                Recent Revisions
              </CardTitle>
              <CardDescription>
                Latest revision requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentRevisions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No revisions found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Freelancer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRevisions.slice(0, 10).map((rev) => (
                        <TableRow key={rev.id}>
                          <TableCell>
                            <Link 
                              href={`/manager/orders/${rev.jobId}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {rev.displayId}
                            </Link>
                          </TableCell>
                          <TableCell>{getRevisionTypeBadge(rev.revisionType)}</TableCell>
                          <TableCell>{rev.freelancerName || '-'}</TableCell>
                          <TableCell>{getStatusBadge(rev.status)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(rev.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {rev.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
