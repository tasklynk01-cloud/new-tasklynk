'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useDashboardProtection } from '@/hooks/useDashboardProtection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, RefreshCw, AlertCircle, CheckCircle, Clock, MessageSquare, FileEdit, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface Revision {
  id: number;
  orderId: number;
  revisionType: 'client' | 'internal';
  description: string;
  status: string;
  freelancerResponse: string | null;
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  order?: {
    displayId: string;
    title: string;
    orderId: string;
  };
  requestedByUser?: {
    name: string;
    role: string;
  };
}

interface RevisionStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  clientRequested: number;
  internal: number;
  avgResolutionTime: number | null;
}

export default function RevisionHistoryPage() {
  const { user, loading: isAuthLoading } = useDashboardProtection(['freelancer']);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [stats, setStats] = useState<RevisionStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    clientRequested: 0,
    internal: 0,
    avgResolutionTime: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRevision, setExpandedRevision] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchRevisions();
    }
  }, [user?.id, typeFilter, statusFilter]);

  const fetchRevisions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        freelancerId: user.id.toString(),
      });
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      const response = await safeApiFetch(`/api/v2/freelancer/revisions?${params.toString()}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch revisions');
      }
      const data = await response.json();
      setRevisions(data.revisions || []);
      
      // Calculate stats
      const allRevisions = data.revisions || [];
      const completedRevisions = allRevisions.filter((r: Revision) => r.status === 'completed');
      let totalResolutionTime = 0;
      completedRevisions.forEach((r: Revision) => {
        if (r.completedAt && r.createdAt) {
          const created = new Date(r.createdAt).getTime();
          const completed = new Date(r.completedAt).getTime();
          totalResolutionTime += (completed - created) / (1000 * 60 * 60); // hours
        }
      });
      
      setStats({
        total: allRevisions.length,
        pending: allRevisions.filter((r: Revision) => r.status === 'pending').length,
        inProgress: allRevisions.filter((r: Revision) => r.status === 'in_progress').length,
        completed: completedRevisions.length,
        clientRequested: allRevisions.filter((r: Revision) => r.revisionType === 'client').length,
        internal: allRevisions.filter((r: Revision) => r.revisionType === 'internal').length,
        avgResolutionTime: completedRevisions.length > 0 
          ? Math.round(totalResolutionTime / completedRevisions.length)
          : null,
      });
    } catch (err) {
      setError('Failed to load revision history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <Clock className="w-4 h-4" /> 
      },
      in_progress: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: <FileEdit className="w-4 h-4" /> 
      },
      completed: { 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircle className="w-4 h-4" /> 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        icon: <AlertCircle className="w-4 h-4" /> 
      },
    };
    const style = styles[status] || { color: 'bg-gray-100 text-gray-800', icon: null };
    return (
      <Badge className={`${style.color} flex items-center gap-1`}>
        {style.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'client' 
      ? <Badge className="bg-purple-100 text-purple-800">Client Requested</Badge>
      : <Badge className="bg-orange-100 text-orange-800">Internal QC</Badge>;
  };

  // Filter revisions by search
  const filteredRevisions = revisions.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.order?.displayId?.toLowerCase().includes(query) ||
      r.order?.title?.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query)
    );
  });

  const toggleExpand = (id: number) => {
    setExpandedRevision(expandedRevision === id ? null : id);
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4">
          <Link href="/freelancer/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Revision History</h1>
            <p className="text-white/80">Track all revision requests and your resolution performance</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Revisions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending + stats.inProgress}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.avgResolutionTime ? `${stats.avgResolutionTime}h` : '-'}
                </p>
                <p className="text-sm text-gray-500">Avg Resolution</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for revision types */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="client">Client ({stats.clientRequested})</TabsTrigger>
            <TabsTrigger value="internal">Internal ({stats.internal})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <CardTitle>All Revisions</CardTitle>
                    <CardDescription>Both client-requested and internal QC revisions</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchRevisions} disabled={loading}>
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-orange mx-auto"></div>
                  </div>
                ) : filteredRevisions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No revision requests found</p>
                    <p className="text-sm mt-1">Great work maintaining quality!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRevisions.map((revision) => (
                      <div key={revision.id} className="border rounded-lg overflow-hidden">
                        {/* Revision header - clickable */}
                        <div 
                          className="p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                          onClick={() => toggleExpand(revision.id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              {revision.order && (
                                <Link 
                                  href={`/freelancer/orders/${revision.orderId}`}
                                  className="text-blue-600 hover:underline font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {revision.order.displayId || revision.order.orderId}
                                </Link>
                              )}
                              <span className="text-muted-foreground hidden sm:inline"></span>
                              <span className="text-muted-foreground text-sm">
                                {revision.order?.title || 'Untitled Order'}
                              </span>
                            </div>
                            <div className="flex gap-3">
                              {getTypeBadge(revision.revisionType)}
                              {getStatusBadge(revision.status)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{new Date(revision.createdAt).toLocaleDateString()}</span>
                            {expandedRevision === revision.id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {expandedRevision === revision.id && (
                          <div className="p-4 border-t border-border bg-card">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Revision Request</h4>
                                <p className="text-foreground whitespace-pre-wrap">{revision.description}</p>
                                {revision.requestedByUser && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Requested by: {revision.requestedByUser.name} ({revision.requestedByUser.role})
                                  </p>
                                )}
                              </div>
                              
                              {revision.freelancerResponse && (
                                <div>
                                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Your Response</h4>
                                  <p className="text-foreground whitespace-pre-wrap">{revision.freelancerResponse}</p>
                                </div>
                              )}
                            </div>

                            {revision.reviewerNotes && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Reviewer Notes</h4>
                                <p className="text-foreground whitespace-pre-wrap">{revision.reviewerNotes}</p>
                              </div>
                            )}

                            {/* Timeline */}
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-medium text-sm text-gray-500 mb-2">Timeline</h4>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Created:</span>{' '}
                                  <span className="text-gray-700">
                                    {new Date(revision.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {revision.submittedAt && (
                                  <div>
                                    <span className="text-gray-400">Submitted:</span>{' '}
                                    <span className="text-gray-700">
                                      {new Date(revision.submittedAt).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {revision.completedAt && (
                                  <div>
                                    <span className="text-gray-400">Completed:</span>{' '}
                                    <span className="text-green-600 font-medium">
                                      {new Date(revision.completedAt).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action buttons for active revisions */}
                            {(revision.status === 'pending' || revision.status === 'in_progress') && (
                              <div className="mt-4 pt-4 border-t flex gap-3">
                                <Link href={`/freelancer/orders/${revision.orderId}?revision=${revision.id}`}>
                                  <Button size="sm">
                                    <FileEdit className="w-4 h-4 mr-2" />
                                    Work on Revision
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client">
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                <p>Client-requested revisions</p>
                <p className="text-sm">These are revision requests from clients after delivery</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internal">
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <FileEdit className="w-12 h-12 mx-auto mb-3 text-orange-300" />
                <p>Internal QC revisions</p>
                <p className="text-sm">Quality control revisions requested by admin/manager before delivery</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revision Performance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-1">? Best Practice</h4>
                <p className="text-sm text-green-700">
                  Address all revision points thoroughly in a single submission to avoid back-and-forth.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">?? Quick Response</h4>
                <p className="text-sm text-blue-700">
                  Aim to complete revisions within 24 hours to maintain high ratings and tier progress.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-1">?? Prevention</h4>
                <p className="text-sm text-yellow-700">
                  Follow order instructions carefully and double-check before first submission.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
