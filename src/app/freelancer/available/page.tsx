"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Briefcase, RefreshCw, Loader2, Search, Clock, DollarSign, FileText,
  Send, Eye, Calendar, CheckCircle, AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useFreelancerOrderCounts } from '@/hooks/use-freelancer-order-counts';
import { getFreelancerEarnings } from '@/lib/order-pricing';
import { PushNotificationBanner } from '@/components/push-notification-banner';

type Client = {
  id: number;
  name?: string | null;
  displayId?: string | null;
};

type Order = {
  id: number;
  displayId?: string | null;
  orderNumber?: string | null;
  title?: string | null;
  instructions?: string | null;
  workType?: string | null;
  pages?: number | null;
  slides?: number | null;
  amount?: number | null;
  freelancerEarnings?: number | null;
  deadline?: string | null;
  status: string;
  clientId: number | null;
  assignedFreelancerId?: number | null;
  createdAt?: string | null;
  client?: Client | null;
  isAssignedToMe?: boolean;
};

export default function AvailableOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { counts, refetch: refetchCounts } = useFreelancerOrderCounts(user?.id);

  // Filters
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [pagesFilter, setPagesFilter] = useState<string>('all');
  const [titleQuery, setTitleQuery] = useState<string>('');

  const fetchAvailableOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      const res = await safeApiFetch(`/api/v2/freelancers/available-orders?_=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch orders (${res.status})`);
      }

      const data = await res.json();
      const ordersData = data?.data?.orders || data?.orders || [];
      
      // Filter to only show accepted & unassigned orders (available for bidding)
      const availableOrders = ordersData.filter((o: Order) => 
        o.status === 'accepted' && !o.assignedFreelancerId
      );
      
      setOrders(availableOrders);
    } catch (err: any) {
      console.error('[AvailableOrdersPage] Error:', err);
      setError(err.message || 'Failed to fetch available orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAvailableOrders();
    refetchCounts?.();
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
        return;
      }
      fetchAvailableOrders();
      const interval = setInterval(fetchAvailableOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, router]);

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    const wtOk = workTypeFilter === 'all' || (order.workType || '').toLowerCase().includes(workTypeFilter.toLowerCase());
    const threshold = pagesFilter === 'all' ? 0 : parseInt(pagesFilter, 10);
    const pagesOk = (order.pages || 0) >= threshold;
    const titleOk = !titleQuery || (order.title || '').toLowerCase().includes(titleQuery.toLowerCase());
    return wtOk && pagesOk && titleOk;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Available Writing Jobs
            </h1>
            {counts.available > 0 && (
              <Badge className="bg-primary text-primary-foreground font-bold px-2 py-0.5 text-xs rounded-full">
                {counts.available} open
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse verified academic orders and place your competitive bid
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 px-3 rounded-xl border-border text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3 text-xs shadow-sm"
          >
            <Link href="/freelancer/bids">
              My Active Bids
            </Link>
          </Button>
        </div>
      </div>

      {/* Push Notification Radar Banner */}
      <PushNotificationBanner userId={user?.id} />

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <Input
            placeholder="Search by topic, paper title, or discipline..."
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-muted/30 border-border/70 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Work type (e.g. Essay)"
            value={workTypeFilter === 'all' ? '' : workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value || 'all')}
            className="h-8 text-xs w-full sm:w-[150px] bg-muted/30 border-border/70 rounded-lg"
          />

          <Select value={pagesFilter} onValueChange={setPagesFilter}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-[130px] rounded-lg border-border/70">
              <SelectValue placeholder="Pages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lengths</SelectItem>
              <SelectItem value="1">1+ Pages</SelectItem>
              <SelectItem value="3">3+ Pages</SelectItem>
              <SelectItem value="5">5+ Pages</SelectItem>
              <SelectItem value="10">10+ Pages</SelectItem>
            </SelectContent>
          </Select>

          {(titleQuery || workTypeFilter !== 'all' || pagesFilter !== 'all') && (
            <Button
              onClick={() => {
                setTitleQuery('');
                setWorkTypeFilter('all');
                setPagesFilter('all');
              }}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-destructive/30 bg-destructive/10 text-destructive text-xs py-2.5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/70 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">No Available Orders Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            {orders.length === 0 
              ? "All active orders are currently assigned. Enable push notifications above to be alerted when new orders land."
              : "No orders match your filter criteria. Try clearing search filters."}
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border h-8 text-xs font-semibold"
          >
            <Link href="/freelancer/bids">Check My Bids</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredOrders.map((order) => {
            const earnings = getFreelancerEarnings(order, user?.completedJobs || 0);
            const deadlineDate = order.deadline ? new Date(order.deadline) : null;
            
            return (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-card border border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {order.displayId || order.orderNumber || `#${order.id}`}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 capitalize">
                      {order.workType || 'Academic Writing'}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {order.title || 'Untitled Academic Order'}
                  </h3>

                  {/* Instructions Preview */}
                  <div className="bg-muted/30 rounded-lg p-2.5 text-[11px] text-muted-foreground line-clamp-2 border border-border/40">
                    {order.instructions || 'Standard academic instructions apply.'}
                  </div>

                  {/* Details Matrix */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-medium">Pages</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{order.pages || 0} pgs</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
                      <p className="text-[10px] text-muted-foreground font-medium">Slides</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{order.slides || 0} slds</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Payout</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">KSh {earnings.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>{deadlineDate ? formatDistanceToNow(deadlineDate, { addSuffix: true }) : 'Flexible'}</span>
                  </div>

                  <Button asChild size="sm" className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-lg h-7 px-3 text-xs shadow-sm">
                    <Link href={`/freelancer/orders/${order.id}`}>
                      Bid Now
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
