'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  Activity, 
  Users, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { resilientFetch } from '@/lib/api-resilience';

interface AuditLog {
  id: string;
  userId?: number;
  userEmail?: string;
  userRole?: string;
  eventType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resourceType?: string;
  resourceId?: number;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

interface AuditStats {
  summary: {
    period: string;
    totalEvents: number;
    successRate: number;
    activityGrowth: number;
    criticalEventsCount: number;
  };
  eventsByType: Array<{ type: string; count: number; percentage: number }>;
  eventsBySeverity: Array<{ severity: string; count: number; percentage: number }>;
  eventsOverTime: Array<{ date: string; total: number; errors: number; successRate: number }>;
  userActivity: Array<{ userId: number; email: string; role: string; activityCount: number; percentage: number }>;
  errorSummary: Array<{ message: string; eventType: string; count: number; lastOccurrence: string }>;
  recentCriticalEvents: Array<{ id: string; type: string; description: string; userEmail: string; timestamp: string; success: boolean; error?: string }>;
}

export default function AuditLogsDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    eventType: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    resourceType: '',
    resourceId: '',
    search: '',
    success: '',
    period: '7d' // for stats
  });

  const [showFilters, setShowFilters] = useState(false);

  // Load audit logs
  const loadLogs = async (pageNum = page, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      });

      // Add filters to params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && key !== 'period') {
          params.append(key, value);
        }
      });

      const response = await resilientFetch(`/api/v2/audit/logs?${params}`);

      if (response.success && response.data) {
        const data: any = response.data;
        setLogs(data.logs);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      } else {
        toast.error(response.error || 'Failed to load audit logs');
      }
    } catch (error) {
      toast.error('Error loading audit logs');
      console.error('Load logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load audit statistics
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await resilientFetch(`/api/v2/audit/stats?period=${filters.period}`);

      if (response.success) {
        setStats(response.data as any);
      } else {
        toast.error(response.error || 'Failed to load audit statistics');
      }
    } catch (error) {
      toast.error('Error loading audit statistics');
      console.error('Load stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Delete old logs
  const deleteOldLogs = async () => {
    if (!confirm('Are you sure you want to delete old audit logs? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await resilientFetch('/api/v2/audit/logs?daysToKeep=90', {
        method: 'DELETE'
      });

      if (response.success) {
        toast.success('Old audit logs deleted successfully');
        loadLogs();
        loadStats();
      } else {
        toast.error(response.error || 'Failed to delete audit logs');
      }
    } catch (error) {
      toast.error('Error deleting audit logs');
      console.error('Delete logs error:', error);
    }
  };

  // Export logs (simplified - would need backend endpoint)
  const exportLogs = () => {
    toast.info('Export functionality would be implemented with backend support');
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (key === 'period') {
      loadStats();
    }
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    loadLogs(1, filters);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      userId: '',
      eventType: '',
      severity: '',
      dateFrom: '',
      dateTo: '',
      resourceType: '',
      resourceId: '',
      search: '',
      success: '',
      period: '7d'
    };
    setFilters(clearedFilters);
    setPage(1);
    loadLogs(1, clearedFilters);
  };

  // Format severity badge
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format event type
  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Load data on mount
  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">System activity monitoring and security audit trail</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={deleteOldLogs} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
          <Button onClick={() => { loadLogs(); loadStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {statsLoading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Summary Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.summary.totalEvents.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stats.summary.activityGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    )}
                    {Math.abs(stats.summary.activityGrowth).toFixed(1)}% vs previous period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.summary.successRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">System reliability</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.summary.criticalEventsCount}</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Period</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Event Types Chart */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Events by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.eventsByType.slice(0, 10).map((event) => (
                      <div key={event.type} className="flex items-center justify-between">
                        <span className="text-sm">{formatEventType(event.type)}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{event.count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${event.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Critical Events */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Recent Critical Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentCriticalEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No critical events recently</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentCriticalEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-start space-x-2 p-4 bg-red-50 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{formatEventType(event.type)}</div>
                            <div className="text-xs text-gray-600">{event.description}</div>
                            <div className="text-xs text-gray-500">{formatDate(event.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">Failed to load statistics</div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          {/* Filters */}
          {showFilters && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search logs..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select value={filters.eventType} onValueChange={(value) => handleFilterChange('eventType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="USER_LOGIN">User Login</SelectItem>
                        <SelectItem value="ORDER_CREATED">Order Created</SelectItem>
                        <SelectItem value="PAYMENT_SUBMITTED">Payment Submitted</SelectItem>
                        <SelectItem value="SECURITY_EVENT">Security Event</SelectItem>
                        <SelectItem value="SYSTEM_ERROR">System Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All severities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Severities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="success">Status</Label>
                    <Select value={filters.success} onValueChange={(value) => handleFilterChange('success', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="true">Success Only</SelectItem>
                        <SelectItem value="false">Errors Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFrom">Date From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">Date To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button onClick={applyFilters}>
                    <Search className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs ({total.toLocaleString()} total)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading audit logs...</div>
              ) : (
                <>
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                            <span className="font-medium">{formatEventType(log.eventType)}</span>
                            {!log.success && (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                        </div>
                        
                        <p className="text-sm">{log.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                          {log.userEmail && (
                            <div><strong>User:</strong> {log.userEmail}</div>
                          )}
                          {log.userRole && (
                            <div><strong>Role:</strong> {log.userRole}</div>
                          )}
                          {log.resourceType && (
                            <div><strong>Resource:</strong> {log.resourceType} #{log.resourceId}</div>
                          )}
                          {log.ipAddress && (
                            <div><strong>IP:</strong> {log.ipAddress}</div>
                          )}
                        </div>
                        
                        {log.errorMessage && (
                          <div className="bg-red-50 p-4 rounded text-sm text-red-700">
                            <strong>Error:</strong> {log.errorMessage}
                          </div>
                        )}
                        
                        {(log.oldValues || log.newValues) && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600">View Changes</summary>
                            <div className="mt-2 p-4 bg-gray-50 rounded">
                              {log.oldValues && (
                                <div className="mb-2">
                                  <strong>Old Values:</strong>
                                  <pre className="mt-1 text-xs">{JSON.stringify(log.oldValues, null, 2)}</pre>
                                </div>
                              )}
                              {log.newValues && (
                                <div>
                                  <strong>New Values:</strong>
                                  <pre className="mt-1 text-xs">{JSON.stringify(log.newValues, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        disabled={page === 1}
                        onClick={() => {
                          const newPage = page - 1;
                          setPage(newPage);
                          loadLogs(newPage);
                        }}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        disabled={page === totalPages}
                        onClick={() => {
                          const newPage = page + 1;
                          setPage(newPage);
                          loadLogs(newPage);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {statsLoading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : stats ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.userActivity.slice(0, 10).map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <div>
                            <div className="text-sm">{user.email}</div>
                            <div className="text-xs text-gray-500">{user.role}</div>
                          </div>
                        </div>
                        <div className="text-sm">{user.activityCount} events</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Error Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Common Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.errorSummary.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No errors in selected period</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.errorSummary.slice(0, 5).map((error, index) => (
                        <div key={index} className="p-4 bg-red-50 rounded">
                          <div className="text-sm font-medium">{formatEventType(error.eventType)}</div>
                          <div className="text-xs text-gray-600 truncate">{error.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Occurred {error.count} times • Last: {formatDate(error.lastOccurrence)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">Failed to load analytics</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
