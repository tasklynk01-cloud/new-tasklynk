"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, ArrowRight, AlignJustify, XCircle, CheckCircle, PlayCircle, FileText, Package, RotateCcw, Receipt, PauseCircle, Ban, Loader2, Edit } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderRow } from '@/components/orders/order-row';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import { getStatusLabel, getStatusColorClasses } from '@/lib/status-display';
import { format, parseISO } from 'date-fns';

type Job = {
  id: number;
  clientId: number;
  clientName?: string | null;
  displayId: string;
  orderNumber: string | null;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  deadline: string;
  freelancerDeadline?: string;
  status: string;
  assignedFreelancerId: number | null;
  managerId: number | null;
  editorId: number | null;
  freelancerName?: string | null;
  managerName?: string | null;
  editorName?: string | null;
  adminApproved: boolean;
  createdAt: string;
  singleSpaced: boolean | null;
  baseCpp: number | null;
  effectiveCpp: number | null;
  clientCpp?: number | null;
  totalAmount?: number | null;
  freelancerEarnings?: number | null;
  managerEarnings?: number | null;
};

interface OrderCounts {
  pending: number;
  accepted: number;
  inProgress: number;
  editing: number;
  delivered: number;
  approved: number;
  revision: number;
  paid: number;
  completed: number;
  onHold: number;
  cancelled: number;
  total: number;
  myOrders: number;
}

export default function EditorOrdersPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <EditorOrdersContent />
    </Suspense>
  );
}

function EditorOrdersContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    pending: 0,
    accepted: 0,
    inProgress: 0,
    editing: 0,
    delivered: 0,
    approved: 0,
    revision: 0,
    paid: 0,
    completed: 0,
    onHold: 0,
    cancelled: 0,
    total: 0,
    myOrders: 0
  });

  // Get initial tab from URL params
  const initialTab = searchParams.get('tab') || 'my-orders';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sync activeTab with URL parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'my-orders';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams.get('tab'), activeTab]); // Re-run when tab parameter changes

  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await safeApiFetch('/api/v2/editor/orders', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        // Fallback to general orders endpoint with editor filtering
        const fallbackResponse = await safeApiFetch('/api/v2/admin/orders', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        const allJobs = fallbackData.orders || [];
        setJobs(allJobs);
        updateOrderCounts(allJobs);
        return;
      }

      const data = await response.json();
      const allJobs = data.orders || [];
      
      setJobs(allJobs);
      updateOrderCounts(allJobs);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateOrderCounts = (allJobs: Job[]) => {
    // Editor focuses on orders in editing phase and assigned to them
    const myOrders = allJobs.filter((j: Job) => j.editorId === user?.id);
    const editingOrders = allJobs.filter((j: Job) => j.status === 'editing');
    
    const counts = {
      pending: allJobs.filter((j: Job) => j.status === 'pending').length,
      accepted: allJobs.filter((j: Job) => j.status === 'accepted').length,
      inProgress: allJobs.filter((j: Job) => j.status === 'in_progress').length,
      editing: editingOrders.length,
      delivered: allJobs.filter((j: Job) => j.status === 'delivered').length,
      approved: allJobs.filter((j: Job) => j.status === 'approved').length,
      revision: allJobs.filter((j: Job) => j.status === 'revision').length,
      paid: allJobs.filter((j: Job) => j.status === 'paid').length,
      completed: allJobs.filter((j: Job) => j.status === 'completed').length,
      onHold: allJobs.filter((j: Job) => j.status === 'on_hold').length,
      cancelled: allJobs.filter((j: Job) => j.status === 'cancelled').length,
      total: allJobs.length,
      myOrders: myOrders.length
    };
    setOrderCounts(counts);
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Filter jobs based on current filters and active tab
  useEffect(() => {
    let filtered = jobs;

    // Filter by tab (status or ownership)
    if (activeTab === 'my-orders') {
      filtered = filtered.filter(job => job.editorId === user?.id);
    } else if (activeTab === 'editing-queue') {
      // Show all orders in editing status that are either unassigned or assigned to this editor
      filtered = filtered.filter(job => 
        job.status === 'editing' && (!job.editorId || job.editorId === user?.id)
      );
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(job => job.status === activeTab);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(search) ||
        job.displayId.toLowerCase().includes(search) ||
        job.orderNumber?.toLowerCase().includes(search) ||
        job.clientName?.toLowerCase().includes(search) ||
        job.freelancerName?.toLowerCase().includes(search) ||
        job.managerName?.toLowerCase().includes(search)
      );
    }

    // Work type filter
    if (workTypeFilter !== 'all') {
      filtered = filtered.filter(job => job.workType === workTypeFilter);
    }

    // Assignment filter (for editing queue)
    if (assignmentFilter !== 'all' && activeTab === 'editing-queue') {
      if (assignmentFilter === 'assigned') {
        filtered = filtered.filter(job => job.editorId);
      } else if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter(job => !job.editorId);
      }
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, workTypeFilter, assignmentFilter, activeTab, user?.id]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL without triggering a navigation
    const newUrl = new URL(window.location.href);
    if (newTab === 'my-orders') {
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', newTab);
    }
    window.history.replaceState({}, '', newUrl);
  };

  const getTabIcon = (status: string) => {
    switch (status) {
      case 'my-orders': return <Edit className="h-4 w-4" />;
      case 'editing-queue': return <FileText className="h-4 w-4" />;
      case 'pending': return <PauseCircle className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4" />;
      case 'editing': return <FileText className="h-4 w-4" />;
      case 'delivered': return <Package className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'revision': return <RotateCcw className="h-4 w-4" />;
      case 'paid': return <Receipt className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'on_hold': return <PauseCircle className="h-4 w-4" />;
      case 'cancelled': return <Ban className="h-4 w-4" />;
      default: return <AlignJustify className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Editor Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and edit orders assigned to you
          </p>
        </div>
        <Button
          onClick={fetchJobs}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Work Type</label>
              <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All work types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Work Types</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assignment</label>
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="assigned">Assigned to Editor</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Actions</label>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setWorkTypeFilter('all');
                  setAssignmentFilter('all');
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full p-1">
            <TabsTrigger value="my-orders" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              My Assignments ({orderCounts.myOrders})
            </TabsTrigger>
            <TabsTrigger value="editing-queue" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Editing Queue ({orderCounts.editing})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <AlignJustify className="h-4 w-4" />
              All Orders ({orderCounts.total})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Delivered ({orderCounts.delivered})
            </TabsTrigger>
            <TabsTrigger value="revision" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Revision ({orderCounts.revision})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({orderCounts.completed})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTabIcon(activeTab)}
                {activeTab === 'my-orders' ? 'My Assignments' : 
                 activeTab === 'editing-queue' ? 'Editing Queue' :
                 activeTab === 'all' ? 'All Orders' : getStatusLabel(activeTab as any, 'manager')}
                <Badge variant="secondary">{filteredJobs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">
                    {activeTab === 'my-orders' 
                      ? 'You have no orders assigned to you yet.'
                      : activeTab === 'editing-queue'
                      ? 'No orders in the editing queue at the moment.'
                      : searchTerm || workTypeFilter !== 'all' || assignmentFilter !== 'all'
                      ? 'Try adjusting your search criteria or filters.'
                      : 'No orders in this category yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Pages/Slides</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Writer</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Editor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <OrderRow 
                          key={job.id} 
                          orderId={job.id}
                          roleOverride="editor"
                          as="tr"
                          className={`hover:bg-muted/50 cursor-pointer ${job.editorId === user?.id ? 'bg-blue-50/50' : ''}`}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-mono text-sm font-medium">
                                {job.displayId}
                              </div>
                              {job.orderNumber && (
                                <div className="text-xs text-muted-foreground">
                                  {job.orderNumber}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {job.clientName || 'Unknown Client'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {job.clientId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={job.title}>
                              {job.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={job.workType === 'technical' ? 'default' : 'secondary'}>
                              {job.workType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {job.pages && <div>{job.pages} pages</div>}
                              {job.slides && <div>{job.slides} slides</div>}
                              {!job.pages && !job.slides && <div className="text-muted-foreground">-</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {formatAmount(job.amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                {formatDate(job.deadline)}
                              </div>
                              {job.freelancerDeadline && (
                                <div className="text-xs text-muted-foreground">
                                  Writer: {formatDate(job.freelancerDeadline)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {job.freelancerName ? (
                              <div className="space-y-1">
                                <div className="font-medium">{job.freelancerName}</div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {job.assignedFreelancerId}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Unassigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {job.managerName ? (
                              <div className="space-y-1">
                                <div className="font-medium">{job.managerName}</div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {job.managerId}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">No Manager</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {job.editorName ? (
                              <div className="space-y-1">
                                <div className="font-medium">{job.editorName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {job.editorId === user?.id ? '(You)' : `ID: ${job.editorId}`}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Unassigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColorClasses(job.status as any)}>
                              {getStatusLabel(job.status as any, 'manager')}
                            </Badge>
                          </TableCell>
                        </OrderRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
