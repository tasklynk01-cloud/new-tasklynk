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
import { Search, Eye, ArrowRight, AlignJustify, XCircle, CheckCircle, PlayCircle, FileText, Package, RotateCcw, Receipt, PauseCircle, Ban, Loader2, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderRow } from '@/components/orders/order-row';
import { toast } from 'sonner';
import { extractErrorMessage, unwrapOrderList } from '@/lib/client-api-helpers';
import { getStatusLabel, getStatusColorClasses } from '@/lib/status-display';
import { format, parseISO } from 'date-fns';

type Job = {
  id: number;
  clientId: number;
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
  freelancerName?: string | null;
  managerName?: string | null;
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
}

// Client-facing status mapping
const getClientFacingStatus = (status: string) => {
  switch (status) {
    case 'pending':
    case 'accepted':
    case 'in_progress':
    case 'editing':
    case 'internal_revision':
      return 'In Progress';
    case 'delivered':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'revision':
    case 'client_revision':
      return 'Revision Requested';
    case 'paid':
    case 'completed':
      return 'Completed';
    case 'on_hold':
    case 'on-hold':
      return 'On Hold';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    default:
      return status;
  }
};

export default function ClientOrdersPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <ClientOrdersContent />
    </Suspense>
  );
}

function ClientOrdersContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
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
    total: 0
  });

  const normalizeTab = (tab: string) => {
    const raw = (tab || '').trim();
    if (!raw) return 'all';
    // Backwards compatible aliases (kebab-case tabs used by older UI)
    if (raw === 'on-hold') return 'on_hold';
    if (raw === 'inprogress') return 'in-progress';
    if (raw === 'underreview') return 'under-review';
    if (raw === 'revisions') return 'revision';
    return raw;
  };

  // Get initial tab from URL params
  const initialTab = normalizeTab(searchParams.get('tab') || 'all');
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sync activeTab with URL parameter changes
  useEffect(() => {
    const tabFromUrl = normalizeTab(searchParams.get('tab') || 'all');
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams.get('tab'), activeTab]); // Re-run when tab parameter changes

  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const timestamp = Date.now();
      const response = await safeApiFetch(`/api/v2/orders?clientId=${user.id}&_t=${timestamp}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      const allJobs = unwrapOrderList<Job>(data);
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
    const counts = {
      pending: allJobs.filter((j: Job) => j.status === 'pending').length,
      accepted: allJobs.filter((j: Job) => j.status === 'accepted').length,
      inProgress: allJobs.filter((j: Job) => ['in_progress', 'editing'].includes(j.status)).length,
      editing: allJobs.filter((j: Job) => j.status === 'editing').length,
      delivered: allJobs.filter((j: Job) => j.status === 'delivered').length,
      approved: allJobs.filter((j: Job) => j.status === 'approved').length,
      revision: allJobs.filter((j: Job) => ['revision', 'client_revision', 'internal_revision'].includes(j.status)).length,
      paid: allJobs.filter((j: Job) => j.status === 'paid').length,
      completed: allJobs.filter((j: Job) => ['paid', 'completed'].includes(j.status)).length,
      onHold: allJobs.filter((j: Job) => j.status === 'on_hold' || j.status === 'on-hold').length,
      cancelled: allJobs.filter((j: Job) => j.status === 'cancelled' || j.status === 'canceled').length,
      total: allJobs.length
    };
    setOrderCounts(counts);
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [fetchJobs, user]);

  // Filter jobs based on current filters and active tab
  useEffect(() => {
    let filtered = jobs;

    // Filter by tab (status)
    if (activeTab !== 'all') {
      if (activeTab === 'in-progress') {
        filtered = filtered.filter(job => ['pending', 'accepted', 'in_progress', 'editing'].includes(job.status));
      } else if (activeTab === 'under-review') {
        filtered = filtered.filter(job => job.status === 'delivered');
      } else if (activeTab === 'completed') {
        filtered = filtered.filter(job => ['paid', 'completed'].includes(job.status));
      } else if (activeTab === 'on_hold') {
        filtered = filtered.filter(job => job.status === 'on_hold' || job.status === 'on-hold');
      } else if (activeTab === 'revision') {
        filtered = filtered.filter(job => ['revision', 'client_revision', 'internal_revision'].includes(job.status));
      } else {
        filtered = filtered.filter(job => job.status === activeTab);
      }
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(search) ||
        job.displayId.toLowerCase().includes(search) ||
        job.orderNumber?.toLowerCase().includes(search) ||
        job.freelancerName?.toLowerCase().includes(search)
      );
    }

    // Work type filter
    if (workTypeFilter !== 'all') {
      filtered = filtered.filter(job => job.workType === workTypeFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, workTypeFilter, activeTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newUrl = new URL(window.location.href);
    if (newTab === 'all') {
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', newTab);
    }
    window.history.replaceState({}, '', newUrl);
  };

  const getTabIcon = (status: string) => {
    switch (status) {
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'under-review': return <Eye className="h-4 w-4" />;
      case 'pending': return <PauseCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'revision': return <RotateCcw className="h-4 w-4" />;
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
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Order Directory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track deliverables, download completed files, and review writing progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchJobs} variant="outline" size="sm" disabled={loading} className="h-8 px-3 rounded-lg border-border text-xs font-semibold">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Clock className="h-3.5 w-3.5 mr-1.5" />}
            Refresh
          </Button>
          <Link href="/client/new-job">
            <Button size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-lg h-8 px-3 text-xs shadow-sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
          <Input
            placeholder="Search orders by ID, title, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs bg-muted/30 border-border/70 rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-[160px] rounded-lg border-border/70">
              <SelectValue placeholder="All work types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Types</SelectItem>
              <SelectItem value="writing">Academic Writing</SelectItem>
              <SelectItem value="technical">Technical / Coding</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || workTypeFilter !== 'all') && (
            <Button
              onClick={() => {
                setSearchTerm('');
                setWorkTypeFilter('all');
              }}
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-3">
        <TabsList className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-xl h-auto scrollbar-none w-full flex-wrap sm:flex-nowrap">
          <TabsTrigger value="all" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            All ({orderCounts.total})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            In Progress ({orderCounts.pending + orderCounts.accepted + orderCounts.inProgress})
          </TabsTrigger>
          <TabsTrigger value="under-review" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Under Review ({orderCounts.delivered})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Approved ({orderCounts.approved})
          </TabsTrigger>
          <TabsTrigger value="revision" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Revision ({orderCounts.revision})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Completed ({orderCounts.completed})
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="mt-0">
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                {getTabIcon(activeTab)}
                <h3 className="text-xs sm:text-sm font-bold text-foreground capitalize">
                  {activeTab === 'all' ? 'All Active Orders' : 
                   activeTab === 'in-progress' ? 'In Progress Queue' :
                   activeTab === 'under-review' ? 'Files Ready for Review' :
                   getStatusLabel(activeTab as any, 'client')}
                </h3>
                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">{filteredJobs.length}</Badge>
              </div>
            </div>

            <div>
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h3 className="text-sm font-bold text-foreground mb-1">No orders found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                    {activeTab === 'all' && !searchTerm && workTypeFilter === 'all'
                      ? 'You haven\'t placed any academic orders yet.'
                      : 'Try adjusting your search query or selected category filter.'}
                  </p>
                  {activeTab === 'all' && !searchTerm && workTypeFilter === 'all' && (
                    <Link href="/client/new-job">
                      <Button size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-lg text-xs h-8">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Place Your First Order
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60">
                        <TableHead className="text-[11px] font-bold uppercase">Order</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase">Title</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase">Type</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase">Amount</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase">Deadline</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase">Writer</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <OrderRow 
                          key={job.id} 
                          orderId={job.id} 
                          roleOverride="client"
                          as="tr"
                          className="hover:bg-muted/50 cursor-pointer"
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
                            <div className="font-mono text-sm">
                              {formatAmount(job.amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                {formatDate(job.deadline)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(job.createdAt), 'MMM dd')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {job.freelancerName ? (
                              <div className="font-medium">{job.freelancerName}</div>
                            ) : (
                              <Badge variant="outline">Not Assigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColorClasses(job.status as any)}>
                              {getClientFacingStatus(job.status)}
                            </Badge>
                          </TableCell>
                        </OrderRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
