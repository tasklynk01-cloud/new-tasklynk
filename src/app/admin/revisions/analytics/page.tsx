"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  FileEdit,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  ArrowLeft,
  User,
  ExternalLink,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

type Revision = {
  id: number;
  orderId: number;
  revisionType: 'client' | 'internal';
  requestedBy: number;
  assignedTo: number | null;
  description: string;
  status: string;
  filesJson: string;
  freelancerResponse: string | null;
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  closedBy: number | null;
  orderDisplayId: string;
  orderTitle: string;
  orderNumber: string;
  requestedByName: string | null;
  assignedToName: string | null;
  closedByName: string | null;
};

type Analytics = {
  totalRevisions: number;
  pendingRevisions: number;
  inProgressRevisions: number;
  completedRevisions: number;
  clientRevisions: number;
  internalRevisions: number;
  completionRate: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topFreelancersByRevisions: {
    freelancerId: number;
    freelancerName: string;
    revisionCount: number;
  }[];
};

export default function AdminRevisionAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchRevisions();
    }
  }, [typeFilter, statusFilter]);

  const fetchData = async () => {
    await Promise.all([fetchAnalytics(), fetchRevisions()]);
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch('/api/v2/revisions/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchRevisions = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const response = await safeApiFetch(`/api/v2/revisions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRevisions(data.revisions || []);
      }
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: FileEdit },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-4 h-4 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'client' 
      ? <Badge variant="outline" className="border-purple-500 text-purple-600">Client</Badge>
      : <Badge variant="outline" className="border-blue-500 text-blue-600">Internal</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link 
          href="/admin/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Revision Analytics</h1>
        <p className="text-gray-600 mt-2">Track and analyze revision requests across orders</p>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileEdit className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{analytics.totalRevisions}</p>
                <p className="text-xs text-muted-foreground">Total Revisions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">{analytics.pendingRevisions}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{analytics.inProgressRevisions}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{analytics.completedRevisions}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-600">{analytics.clientRevisions}</p>
                <p className="text-xs text-muted-foreground">Client Revisions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold text-amber-600">{analytics.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="revisions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revisions">All Revisions</TabsTrigger>
          <TabsTrigger value="workload">Freelancer Workload</TabsTrigger>
        </TabsList>

        {/* Revisions List Tab */}
        <TabsContent value="revisions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Revision History</CardTitle>
                  <CardDescription>All revision requests with timeline</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revisions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileEdit className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No revisions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revisions.map((revision) => (
                      <TableRow key={revision.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{revision.orderDisplayId}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {revision.orderTitle}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(revision.revisionType)}</TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[200px]" title={revision.description}>
                            {revision.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{revision.requestedByName || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {revision.assignedToName ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{revision.assignedToName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(revision.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(revision.createdAt), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/orders/${revision.orderId}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Freelancer Workload Tab */}
        <TabsContent value="workload">
          <Card>
            <CardHeader>
              <CardTitle>Freelancer Revision Workload</CardTitle>
              <CardDescription>Top freelancers by revision count</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.topFreelancersByRevisions && analytics.topFreelancersByRevisions.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topFreelancersByRevisions.map((freelancer, index) => {
                    const maxCount = analytics.topFreelancersByRevisions[0]?.revisionCount || 1;
                    const percentage = (freelancer.revisionCount / maxCount) * 100;
                    
                    return (
                      <div key={freelancer.freelancerId || index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <span className="font-medium">{freelancer.freelancerName}</span>
                          </div>
                          <Badge variant="secondary">{freelancer.revisionCount} revisions</Badge>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No revision workload data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
