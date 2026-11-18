"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Eye, Clock, TrendingDown, ArrowRight, AlignJustify, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderRow } from '@/components/orders/order-row';
import { getFreelancerEarnings } from '@/lib/order-pricing';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Job = {
  id: number;
  clientId: number;
  displayId: string | null;
  orderNumber: string | null;
  title: string;
  instructions: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  amount: number;
  freelancerEarnings: number | null;
  deadline: string;
  actualDeadline: string | null;
  freelancerDeadline: string | null;
  status: string;
  assignedFreelancerId: number | null;
  managerId: number | null;
  requestDraft: boolean | null;
  requestPrintableSources: boolean | null;
  revisionRequested: boolean | null;
  createdAt: string;
  client: {
    id: number;
    name: string | null;
    displayId: string | null;
  } | null;
  isAssignedToMe: boolean;
  // Legacy fields for compatibility
  adminApproved?: boolean;
  isRealOrder?: boolean;
  singleSpaced?: boolean | null;
  baseCpp?: number | null;
  effectiveCpp?: number | null;
};

type Bid = {
  id: number;
  jobId: number;
  freelancerId: number;
  bidAmount: number;
  message: string;
  status: string;
  createdAt: string;
};

export default function FreelancerOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [placingBid, setPlacingBid] = useState(false);
  const [academicLevel, setAcademicLevel] = useState('All Available');
  const [discipline, setDiscipline] = useState('');
  const [deadline, setDeadline] = useState('All available');
  const [pages, setPages] = useState('All available');
  const [cost, setCost] = useState('All available');
  const [topicTitle, setTopicTitle] = useState('');
  const [orderId, setOrderId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tab, setTab] = useState<'available' | 'my-bids'>('available');
  const [completedBalance, setCompletedBalance] = useState<{ balance: number; count: number; avg: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [freelancerCompletedJobs, setFreelancerCompletedJobs] = useState<number>(0);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
        return;
      } 
      
      if (!user.approved) {
        router.push('/freelancer/dashboard');
        return;
      } 
      
      // Set freelancer's completed jobs for CPP calculation
      setFreelancerCompletedJobs((user as any).completedJobs ?? 0);
      
      // Fetch data with error handling
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchJobs(),
            fetchMyBids(),
            fetchCompletedBalance()
          ]);
        } catch (error) {
          console.error('[Freelancer Orders] Error fetching data:', error);
          setErrorMessage('Failed to load orders. Please refresh the page.');
        }
      };
      
      fetchData();
      
      // Refresh every 15 seconds (reduced frequency for stability)
      const interval = setInterval(() => {
        fetchData();
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  // Update time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    setErrorMessage(null);
    
    // ?? CRITICAL: Ensure user and user.id exist before fetching
    if (!user || !user.id) {
      console.warn('[Freelancer Orders] Cannot fetch orders: user or user.id is undefined');
      setErrorMessage('Unable to identify freelancer. Please refresh the page.');
      setLoadingJobs(false);
      return;
    }

    try {
      const timestamp = Date.now();
      const freelancerId = user.id;
      
      console.log('[Freelancer Orders] Fetching available orders for freelancer:', freelancerId);
      
      // Use v2 endpoint - returns orders based on manager assignments
      const response = await safeApiFetch(`/api/v2/freelancers/available-orders?status=accepted&_=${timestamp}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      console.log('[Freelancer Orders] API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('[Freelancer Orders] API Response data:', {
          success: data.success,
          hasOrders: !!data.orders,
          ordersCount: data.orders?.length || 0,
          hasMessage: !!data.message,
          message: data.message,
          debug: data.debug
        });
        
        // Check for message (e.g., "No manager assigned")
        if (data.message) {
          setErrorMessage(data.message);
          setJobs([]);
        } else {
          // ? Show ALL orders available for bidding (API already filters appropriately)
          // Orders include: accepted orders, pending orders with approval, unassigned only
          const allOrders = data.orders || [];
          
          console.log('[Freelancer Orders] All available orders from API:', allOrders.length);
          
          // Fetch freelancer's bids to exclude orders they've already bid on
          const bidsResponse = await safeApiFetch(`/api/bids?freelancerId=${freelancerId}`, {
            credentials: 'include',
          });
          
          let bidJobIds: number[] = [];
          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            // Get job IDs where freelancer has placed bids
            bidJobIds = (bidsData || []).map((bid: Bid) => bid.jobId);
            console.log('[Freelancer Orders] Freelancer has bids on jobs:', bidJobIds);
          }
          
          // Filter out orders where freelancer has already placed a bid
          const availableOrders = allOrders.filter((j: Job) => 
            !bidJobIds.includes(j.id)
          );
          
          console.log('[Freelancer Orders] Final available orders (excluding bids):', availableOrders.length);
          console.log('[Freelancer Orders] Available order IDs:', availableOrders.map((j: { id: number }) => j.id));
          
          setJobs(availableOrders);
          
          // Show helpful message if no orders found
          if (availableOrders.length === 0) {
            if (allOrders.length > 0) {
              setErrorMessage('You have already placed bids on all available orders. Check "My Bids" tab.');
            } else {
              setErrorMessage('No available orders at the moment. New orders will appear here automatically.');
            }
          } else {
            setErrorMessage(null);
          }
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch orders' }));
        console.error('[Freelancer Orders] API error:', error, {
          status: response.status,
          statusText: response.statusText,
          freelancerId
        });
        setErrorMessage(error.error || `Failed to fetch available orders (${response.status})`);
      }
    } catch (error) {
      console.error('[Freelancer Orders] Failed to fetch jobs:', error);
      setErrorMessage('Failed to fetch available orders. Please check your connection and try again.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchMyBids = async () => {
    if (!user) return;
    try {
      // Fetch bids for unassigned orders only - backend filters by unassignedOnly=true
      const response = await safeApiFetch(`/api/bids?freelancerId=${user.id}&unassignedOnly=true`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Backend already filters for unassigned orders, just set the data
        // Only show pending bids (accepted/rejected bids are removed once processed)
        const pendingBids = (data || []).filter((bid: Bid) => bid.status === 'pending');
        setMyBids(pendingBids);
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    }
  };

  const fetchCompletedBalance = async () => {
    if (!user) return;
    try {
      // Use cookie-based authentication instead of bearer token
      const res = await safeApiFetch(`/api/freelancer/completed-orders-balance?userId=${user.id}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedBalance({
          balance: Number(data.completedOrdersBalance || 0),
          count: Number(data.completedOrdersCount || 0),
          avg: Number(data.averageOrderValue || 0),
        });
      }
    } catch (e) {
      console.error('Failed to fetch completed balance', e);
    }
  };

  const handleSearch = () => {
    fetchJobs();
  };

  // Available jobs are only those without bids from current user AND not assigned
  const availableJobs = jobs;

  const filteredJobs = availableJobs.filter(job => {
    if (discipline) {
      const normalizedWorkType = job.workType?.toLowerCase() ?? '';
      if (normalizedWorkType !== discipline.toLowerCase()) return false;
    }
    if (topicTitle && !job.title.toLowerCase().includes(topicTitle.toLowerCase())) return false;
    if (orderId && job.id.toString() !== orderId) return false;
    return true;
  });

  // Calculate remaining time from freelancer deadline (60% of actual time) or actual deadline
  const getCountdown = (job: Job) => {
    // Use freelancerDeadline if available, otherwise fall back to actualDeadline or deadline
    const deadlineStr = job.freelancerDeadline || job.actualDeadline || job.deadline;
    if (!deadlineStr) {
      return { text: 'No deadline', expired: false, urgent: false };
    }
    
    const due = new Date(deadlineStr);
    const diffMs = due.getTime() - currentTime.getTime();
    
    if (diffMs <= 0) {
      return { text: 'Expired', expired: true, urgent: true };
    }

    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const isUrgent = diffMs <= twelveHoursMs;
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffDays > 0) {
      return { text: `${diffDays}d ${diffHours}h ${diffMins}m`, expired: false, urgent: isUrgent };
    }
    if (diffHours > 0) {
      return { text: `${diffHours}h ${diffMins}m ${diffSecs}s`, expired: false, urgent: isUrgent };
    }
    return { text: `${diffMins}m ${diffSecs}s`, expired: false, urgent: isUrgent };
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="order-container py-4 space-y-4">
      <section className="space-y-3 rounded-lg border border-border/60 bg-background/80 p-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Available Orders</h1>
          <p className="text-sm text-muted-foreground">
            Browse approved jobs, review key details, and place a competitive bid without leaving the page.
          </p>
        </div>
        <Alert className="border border-primary/20 bg-primary/5 py-2">
          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          <AlertDescription className="text-xs sm:text-sm text-muted-foreground">
            <strong className="font-semibold text-primary">Competitive bidding:</strong> act quicklyorders disappear once assigned to another writer.
          </AlertDescription>
        </Alert>
      </section>

      {errorMessage && (
        <Alert className="border border-amber-300/60 bg-amber-50 text-amber-900 shadow-sm">
          <AlertDescription className="text-xs sm:text-sm">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {completedBalance && (
        <Card className="shadow-sm border border-border/70">
          <CardContent className="py-3 sm:py-4 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">Completed Orders Balance</div>
              <div className="text-xl sm:text-2xl font-semibold text-green-600">KES {completedBalance.balance.toFixed(0)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-3">
              <Badge variant="secondary" className="text-xs">Completed: {completedBalance.count}</Badge>
              <Badge variant="outline" className="text-xs">Avg per order: KES {completedBalance.avg.toFixed(0)}</Badge>
              <Link href="/freelancer/financial-overview">
                <Button variant="default" size="sm">View Financials</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Showing {filteredJobs.length} available orders</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3">
            {/* Academic Level */}
            <div>
              <Label htmlFor="academicLevel" className="text-xs sm:text-sm">Academic Level:</Label>
              <Select value={academicLevel} onValueChange={setAcademicLevel}>
                <SelectTrigger id="academicLevel" className="text-xs sm:text-sm h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Available">All Available</SelectItem>
                  <SelectItem value="High School">High School</SelectItem>
                  <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discipline */}
            <div>
              <Label htmlFor="discipline" className="text-xs sm:text-sm">Discipline:</Label>
              <Input
                id="discipline"
                placeholder="Art (Fine arts, Performing arts)"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="text-xs sm:text-sm h-8 sm:h-10"
              />
            </div>

            {/* Deadline */}
            <div>
              <Label htmlFor="deadline" className="text-xs sm:text-sm">Deadline:</Label>
              <Select value={deadline} onValueChange={setDeadline}>
                <SelectTrigger id="deadline" className="text-xs sm:text-sm h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All available">All available</SelectItem>
                  <SelectItem value="Within 24h">Within 24h</SelectItem>
                  <SelectItem value="Within 3 days">Within 3 days</SelectItem>
                  <SelectItem value="Within 7 days">Within 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Track ID */}
            <div>
              <Label htmlFor="trackId" className="text-xs sm:text-sm">Track ID</Label>
              <Input
                id="trackId"
                placeholder="Track ID"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="text-xs sm:text-sm h-8 sm:h-10"
              />
            </div>

            {/* Pages */}
            <div>
              <Label htmlFor="pages" className="text-xs sm:text-sm">Pages:</Label>
              <Select value={pages} onValueChange={setPages}>
                <SelectTrigger id="pages" className="text-xs sm:text-sm h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All available">All available</SelectItem>
                  <SelectItem value="1-5">1-5 pages</SelectItem>
                  <SelectItem value="6-10">6-10 pages</SelectItem>
                  <SelectItem value="11+">11+ pages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost */}
            <div>
              <Label htmlFor="cost" className="text-xs sm:text-sm">Your Earnings:</Label>
              <Select value={cost} onValueChange={setCost}>
                <SelectTrigger id="cost" className="text-xs sm:text-sm h-8 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All available">All available</SelectItem>
                  <SelectItem value="0-600">KES 0-600</SelectItem>
                  <SelectItem value="600-3000">KES 600-3000</SelectItem>
                  <SelectItem value="3000+">KES 3000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Topic Title */}
            <div>
              <Label htmlFor="topicTitle" className="text-xs sm:text-sm">Topic Title</Label>
              <Input
                id="topicTitle"
                placeholder="Topic Title"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                className="text-xs sm:text-sm h-8 sm:h-10"
              />
            </div>

            {/* Order ID */}
            <div>
              <Label htmlFor="orderId" className="text-xs sm:text-sm">Order ID</Label>
              <div className="flex gap-1 sm:gap-3">
                <Input
                  id="orderId"
                  placeholder="Order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
                <Button onClick={handleSearch} size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button onClick={handleSearch} size="sm">Search</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'available' | 'my-bids')}>
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="available" className="text-xs sm:text-sm">Available Orders ({filteredJobs.length})</TabsTrigger>
          <TabsTrigger value="my-bids" className="text-xs sm:text-sm">My Bids ({myBids.length})</TabsTrigger>
        </TabsList>

        {/* Available Orders - table layout with clickable rows */}
        <TabsContent value="available" className="mt-3 sm:mt-4">
          {loadingJobs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 space-y-3">
                <div className="text-6xl">??</div>
                <p className="text-muted-foreground text-sm font-medium">
                  {errorMessage ? errorMessage :
                   availableJobs.length === 0 ? 
                    'No available orders at the moment. New orders appear here once approved by admin.' : 
                    'No orders match your current filters. Try adjusting your search criteria.'
                  }
                </p>
                {availableJobs.length === 0 && myBids.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You have {myBids.length} active bid{myBids.length > 1 ? 's' : ''}. Switch to "My Bids" tab to view them.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 sm:w-20 md:w-24 text-xs sm:text-sm">id</TableHead>
                    <TableHead className="text-xs sm:text-sm">Topic</TableHead>
                    <TableHead className="w-20 sm:w-24 md:w-28 text-xs sm:text-sm">Price</TableHead>
                    <TableHead className="w-12 sm:w-16 md:w-20 text-xs sm:text-sm">Pg</TableHead>
                    <TableHead className="w-12 sm:w-16 md:w-20 text-xs sm:text-sm">Sl</TableHead>
                    <TableHead className="w-24 sm:w-28 md:w-36 text-xs sm:text-sm">Subject</TableHead>
                    <TableHead className="w-28 sm:w-32 md:w-40 text-xs sm:text-sm">Deadline</TableHead>
                    <TableHead className="w-40 sm:w-48 md:w-56 text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => {
                    const countdown = getCountdown(job);
                    // Use freelancerEarnings from v2 API if available, otherwise calculate with CPP tier
                    const freelancerAmount = getFreelancerEarnings(job, freelancerCompletedJobs);
                    
                    return (
                      <OrderRow 
                        key={job.id} 
                        orderId={job.id}
                        roleOverride="freelancer"
                        as="tr"
                        className={`${countdown.expired ? 'opacity-60' : ''} hover:bg-muted/50`}
                      >
                        <TableCell className="font-mono text-primary text-xs sm:text-sm">
                          <div className="flex flex-col gap-1">
                            <span>{job.displayId || job.orderNumber || job.id}</span>
                            {job.singleSpaced && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 text-[10px] w-fit">
                                <AlignJustify className="w-4 h-4 mr-1" />
                                SS
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] sm:max-w-[300px] md:max-w-[360px]">
                          <div className="flex flex-col gap-1">
                            <div className="truncate font-semibold text-xs sm:text-sm">{job.title}</div>
                            {job.client && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                Client: {job.client.name || job.client.displayId || `#${job.client.id}`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600 text-xs sm:text-sm">KES {freelancerAmount.toFixed(0)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{job.pages ?? '-'}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{job.slides ?? '-'}</TableCell>
                        <TableCell className="capitalize text-xs sm:text-sm">{job.workType}</TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${countdown.expired || countdown.urgent ? 'text-red-600' : 'text-green-600'}`}> 
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="text-[10px] sm:text-xs">{countdown.text}</span>
                            {countdown.urgent && !countdown.expired && (
                              <Badge variant="destructive" className="ml-1 text-[8px] sm:text-xs px-1 py-0">&lt;12h</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job);
                                // Suggest CPP estimate as placeholder
                                setBidAmount('');
                                setBidDialogOpen(true);
                              }}
                              disabled={countdown.expired}
                              className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                            >
                              Place Bid
                            </Button>
                          </div>
                        </TableCell>
                      </OrderRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* My Bids - enhanced with status indicators and clickable rows */}
        <TabsContent value="my-bids" className="mt-3 sm:mt-4">
          {/* Info Alert */}
          <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200">
            <AlertDescription className="text-xs sm:text-sm">
              <strong>Bid Status:</strong> Only pending bids are shown here. Once an order is assigned to you or another freelancer, it automatically moves to "In Progress" and disappears from this list.
            </AlertDescription>
          </Alert>

          {myBids.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground text-sm">You have not placed any bids yet, or your bids have been processed (assigned or rejected).</p>
                <div className="mt-4">
                  <Button onClick={() => setTab('available')} size="sm">
                    Browse Orders <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Pending: {myBids.filter(b => b.status === 'pending').length}
                </Badge>
                <Badge variant="default" className="gap-1 bg-green-600 text-xs">
                  Accepted: {myBids.filter(b => b.status === 'accepted').length}
                </Badge>
                <Badge variant="destructive" className="gap-1 text-xs">
                  Rejected: {myBids.filter(b => b.status === 'rejected').length}
                </Badge>
              </div>
              
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 sm:w-20 md:w-24 text-xs sm:text-sm">Order id</TableHead>
                      <TableHead className="text-xs sm:text-sm">Message</TableHead>
                      <TableHead className="w-20 sm:w-24 md:w-28 text-xs sm:text-sm">Your Bid</TableHead>
                      <TableHead className="w-20 sm:w-24 md:w-28 text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="w-28 sm:w-32 md:w-40 text-xs sm:text-sm">Placed</TableHead>
                      <TableHead className="w-16 sm:w-20 md:w-24 text-xs sm:text-sm">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myBids.map((bid) => (
                      <TableRow 
                        key={bid.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          // Navigate to appropriate page based on bid status
                          if (bid.status === 'accepted') {
                            router.push(`/freelancer/jobs/${bid.jobId}`);
                          } else {
                            router.push(`/freelancer/orders/${bid.jobId}`);
                          }
                        }}
                      >
                        <TableCell className="font-mono text-primary text-xs sm:text-sm">{bid.jobId}</TableCell>
                        <TableCell className="max-w-[200px] sm:max-w-[300px] md:max-w-[420px] truncate text-xs sm:text-sm">{bid.message || '-'}</TableCell>
                        <TableCell className="font-semibold text-xs sm:text-sm">KES {Number(bid.bidAmount || 0).toFixed(0)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              bid.status === 'accepted' ? 'default' : 
                              bid.status === 'rejected' ? 'destructive' : 
                              'secondary'
                            } 
                            className="capitalize text-xs"
                          >
                            {bid.status === 'accepted' && '? '}
                            {bid.status === 'rejected' && '? '}
                            {bid.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{new Date(bid.createdAt).toLocaleString()}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <Link href={bid.status === 'accepted' ? `/freelancer/jobs/${bid.jobId}` : `/freelancer/orders/${bid.jobId}`}>
                              <Button size="sm" variant={bid.status === 'accepted' ? 'default' : 'outline'} className="h-7 sm:h-8 text-xs px-2 sm:px-3">
                                <Eye className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" /> 
                                <span className="hidden sm:inline">{bid.status === 'accepted' ? 'Work' : 'View'}</span>
                              </Button>
                            </Link>
                            {bid.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm('Are you sure you want to withdraw this bid?')) return;
                                  
                                  try {
                                    const response = await safeApiFetch(`/api/bids/${bid.id}`, {
                                      method: 'DELETE',
                                      credentials: 'include',
                                    });
                                    const { toast } = await import('sonner');
                                    if (response.ok) {
                                      toast.success('Bid withdrawn successfully');
                                      fetchMyBids();
                                      fetchJobs(); // Refresh available orders
                                    } else {
                                      const error = await response.json();
                                      toast.error(extractErrorMessage(error, 'Failed to withdraw bid'));
                                    }
                                  } catch (error) {
                                    console.error('Failed to withdraw bid:', error);
                                    const { toast } = await import('sonner');
                                    toast.error('Failed to withdraw bid');
                                  }
                                }}
                              >
                                <XCircle className="w-4 h-4 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Withdraw</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Place Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place Your Bid</DialogTitle>
            <DialogDescription>
              {selectedJob ? `Order: ${selectedJob.title}` : 'Enter your bid amount'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bidAmount">Bid Amount (KSh) *</Label>
              <Input
                id="bidAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder={selectedJob ? `Estimate: ${getFreelancerEarnings(selectedJob, freelancerCompletedJobs).toFixed(2)}` : '0.00'}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBidDialogOpen(false)} disabled={placingBid}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedJob) return;
                const amount = parseFloat(bidAmount || '0');
                if (isNaN(amount) || amount <= 0) {
                  // dynamic import to avoid circulars; toast exists on page top
                  const { toast } = await import('sonner');
                  toast.error('Enter a valid bid amount');
                  return;
                }
                try {
                  setPlacingBid(true);
                  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
                  const res = await safeApiFetch('/api/bids', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                      jobId: selectedJob.id,
                      freelancerId: user?.id,
                      bidAmount: amount,
                      message: '',
                    }),
                    credentials: 'include',
                  });
                  if (res.ok) {
                    const { toast } = await import('sonner');
                    console.log('[Bid Placed] Successfully placed bid, refreshing lists...');
                    toast.success('Bid placed successfully! Order moved to "My Bids" tab.');
                    setBidDialogOpen(false);
                    setBidAmount('');
                    setSelectedJob(null);
                    // Force immediate refresh of both lists
                    await fetchJobs();
                    await fetchMyBids();
                    // Switch to My Bids tab to show the newly placed bid
                    setTab('my-bids');
                  } else if (res.status === 409) {
                    const { toast } = await import('sonner');
                    toast.info("You've already placed a bid for this order");
                  } else {
                    const data = await res.json().catch(() => ({}));
                    const { toast } = await import('sonner');
                    toast.error(extractErrorMessage(data, 'Failed to place bid'));
                  }
                } catch (err) {
                  const { toast } = await import('sonner');
                  toast.error('Failed to place bid');
                } finally {
                  setPlacingBid(false);
                }
              }}
              disabled={placingBid || !bidAmount || parseFloat(bidAmount) <= 0}
            >
              {placingBid ? 'Placing' : 'Submit Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
