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
  Users, Star, Briefcase, TrendingUp, Award, Link2, Heart
} from 'lucide-react';

interface Relationship {
  clientId: number;
  clientName: string | null;
  clientEmail: string | null;
  freelancerId: number;
  freelancerName: string | null;
  freelancerEmail: string | null;
  totalJobs: number;
  avgRating: number | null;
  totalEarnings: number;
  firstJobDate: string;
  lastJobDate: string;
}

interface TopClient {
  clientId: number;
  clientName: string | null;
  freelancerCount: number;
  totalJobs: number;
}

interface TopFreelancer {
  freelancerId: number;
  freelancerName: string | null;
  clientCount: number;
  totalJobs: number;
}

interface RelationshipStats {
  totalRelationships: number;
  avgJobsPerRelationship: number;
  avgRating: number;
  topClients: TopClient[];
  topFreelancers: TopFreelancer[];
}

export default function ClientFreelancerHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [stats, setStats] = useState<RelationshipStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships'>('overview');
  
  // Filters
  const [filters, setFilters] = useState({
    clientId: '',
    freelancerId: '',
    minJobs: '',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/login');
        return;
      }
      fetchRelationships();
    }
  }, [user, authLoading, router]);

  const fetchRelationships = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      
      if (filters.clientId) params.set('clientId', filters.clientId);
      if (filters.freelancerId) params.set('freelancerId', filters.freelancerId);
      if (filters.minJobs) params.set('minJobs', filters.minJobs);

      const response = await safeApiFetch(`/api/v2/admin/client-freelancer-history?${params}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setRelationships(data.relationships || []);
        setStats(data.stats || null);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      } else {
        const error = await response.json();
        toast.error(extractErrorMessage(error, 'Failed to load relationship data'));
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to load relationship data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRelationships(1);
  };

  const clearFilters = () => {
    setFilters({ clientId: '', freelancerId: '', minJobs: '' });
    setTimeout(() => fetchRelationships(1), 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
          <h1 className="text-3xl font-bold text-gray-900">Client-Freelancer Relationships</h1>
          <p className="text-gray-600 mt-2">Track working relationships and repeat collaborations</p>
        </div>
        <Button variant="outline" onClick={() => fetchRelationships(pagination.page)}>
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
                <Link2 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalRelationships}</p>
                  <p className="text-sm text-gray-500">Total Relationships</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgJobsPerRelationship.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Avg Jobs/Relationship</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {relationships.filter(r => r.totalJobs >= 3).length}
                  </p>
                  <p className="text-sm text-gray-500">Repeat Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 mb-4">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Top Performers
        </Button>
        <Button
          variant={activeTab === 'relationships' ? 'default' : 'outline'}
          onClick={() => setActiveTab('relationships')}
        >
          <Users className="h-4 w-4 mr-2" />
          All Relationships
        </Button>
      </div>

      {activeTab === 'overview' ? (
        /* Top Performers Overview */
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-500" />
                Top Clients
              </CardTitle>
              <CardDescription>Clients with most freelancer relationships</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stats?.topClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No client data available
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.topClients.map((client, index) => (
                    <div key={client.clientId} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{client.clientName || `Client #${client.clientId}`}</div>
                          <div className="text-xs text-gray-500">
                            {client.freelancerCount} freelancers  {client.totalJobs} jobs
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{client.freelancerCount} connections</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Freelancers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Award className="h-5 w-5 text-green-500" />
                Top Freelancers
              </CardTitle>
              <CardDescription>Freelancers with most client relationships</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stats?.topFreelancers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No freelancer data available
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.topFreelancers.map((freelancer, index) => (
                    <div key={freelancer.freelancerId} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{freelancer.freelancerName || `Freelancer #${freelancer.freelancerId}`}</div>
                          <div className="text-xs text-gray-500">
                            {freelancer.clientCount} clients  {freelancer.totalJobs} jobs
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{freelancer.clientCount} connections</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* All Relationships List */
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Client ID</Label>
                  <Input
                    placeholder="Filter by client..."
                    value={filters.clientId}
                    onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Freelancer ID</Label>
                  <Input
                    placeholder="Filter by freelancer..."
                    value={filters.freelancerId}
                    onChange={(e) => setFilters({ ...filters, freelancerId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Min Jobs Together</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 3"
                    value={filters.minJobs}
                    onChange={(e) => setFilters({ ...filters, minJobs: e.target.value })}
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
              ) : relationships.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No relationships found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Freelancer</TableHead>
                      <TableHead className="text-center">Jobs Together</TableHead>
                      <TableHead className="text-center">Avg Rating</TableHead>
                      <TableHead className="text-right">Total Earnings</TableHead>
                      <TableHead>First Job</TableHead>
                      <TableHead>Last Job</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relationships.map((rel, index) => (
                      <TableRow key={`${rel.clientId}-${rel.freelancerId}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rel.clientName || `Client #${rel.clientId}`}</div>
                            <div className="text-xs text-gray-500">{rel.clientEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rel.freelancerName || `Freelancer #${rel.freelancerId}`}</div>
                            <div className="text-xs text-gray-500">{rel.freelancerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={rel.totalJobs >= 5 ? 'default' : 'outline'}
                            className={rel.totalJobs >= 5 ? 'bg-green-500' : ''}
                          >
                            {rel.totalJobs} jobs
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {rel.avgRating ? (
                            <span className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              {rel.avgRating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(rel.totalEarnings)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(rel.firstJobDate)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(rel.lastJobDate)}
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} relationships
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchRelationships(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchRelationships(pagination.page + 1)}
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
