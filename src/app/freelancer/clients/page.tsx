'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  UserCheck,
  Star,
  TrendingUp,
  Repeat,
  Calendar,
  RefreshCw,
  Crown,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ClientRecord {
  clientId: number;
  clientName: string;
  clientEmail: string | null;
  clientAvatar: string | null;
  jobsCompleted: number;
  avgRating: number | null;
  lastWorkedAt: string;
  firstWorkedAt: string;
  isRepeatClient: boolean;
}

interface TopClient {
  clientId: number;
  clientName: string;
  jobsCompleted: number;
  avgRating: number | null;
  lastWorkedAt: string;
}

interface RecentJob {
  id: number;
  displayId: string;
  title: string;
  clientId: number;
  clientName: string;
  completedAt: string | null;
}

interface ClientHistoryData {
  success: boolean;
  freelancer: { id: number; name: string };
  summary: {
    totalClients: number;
    repeatClients: number;
    repeatClientRate: number;
    totalJobsCompleted: number;
    avgRating: number | null;
  };
  topRepeatClients: TopClient[];
  allClients: ClientRecord[];
  recentCompletedJobs: RecentJob[];
}

export default function ClientHistoryPage() {
  const { user, loading } = useDashboardProtection('freelancer');
  const [data, setData] = useState<ClientHistoryData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoadingData(true);
      try {
        const response = await safeApiFetch('/api/v2/freelancer/client-history', {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          toast.error('Failed to load client history');
        }
      } catch (error) {
        console.error('Failed to fetch client history:', error);
        toast.error('Network error loading client history');
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user) {
      fetchData();
    }
  }, [user, loading]);

  if (loading || !user) {
    return <DashboardLoader />;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Relationships</h1>
        <p className="text-muted-foreground mt-1">
          View your work history with clients and repeat client statistics
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">Unique clients served</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Clients</CardTitle>
            <Repeat className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.summary.repeatClients || 0}
            </div>
            <p className="text-xs text-muted-foreground">Worked with 2+ times</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.repeatClientRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Client retention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalJobsCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">Completed for clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.avgRating ? data.summary.avgRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">From client reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Repeat Clients */}
      {data?.topRepeatClients && data.topRepeatClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-amber-500" />
              Top Repeat Clients
            </CardTitle>
            <CardDescription>
              Clients you've worked with the most
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {data.topRepeatClients.map((client, index) => (
                <div
                  key={client.clientId}
                  className="relative p-4 rounded-lg border bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20"
                >
                  {index === 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-amber-500">
                      #1
                    </Badge>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-200 text-amber-800">
                        {client.clientName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{client.clientName}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jobs:</span>
                      <span className="font-bold">{client.jobsCompleted}</span>
                    </div>
                    {client.avgRating && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rating:</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          {client.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            All Clients
          </CardTitle>
          <CardDescription>
            Complete list of clients you've worked with
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.allClients.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No client history yet</p>
              <p className="text-sm">Complete orders to build your client relationships</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Jobs Completed</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead>First Worked</TableHead>
                    <TableHead>Last Worked</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.allClients.map((client) => (
                    <TableRow key={client.clientId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={client.clientAvatar || undefined} />
                            <AvatarFallback>
                              {client.clientName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.clientName}</p>
                            {client.clientEmail && (
                              <p className="text-xs text-muted-foreground">{client.clientEmail}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold">{client.jobsCompleted}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {client.avgRating ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span>{client.avgRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.firstWorkedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.lastWorkedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.isRepeatClient ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <Repeat className="h-3 w-3 mr-1" />
                            Repeat
                          </Badge>
                        ) : (
                          <Badge variant="outline">New</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Completed Jobs */}
      {data?.recentCompletedJobs && data.recentCompletedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              Recent Completed Jobs
            </CardTitle>
            <CardDescription>
              Your latest completed orders with clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentCompletedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.displayId}  {job.clientName}
                      </p>
                    </div>
                  </div>
                  {job.completedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(job.completedAt), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
