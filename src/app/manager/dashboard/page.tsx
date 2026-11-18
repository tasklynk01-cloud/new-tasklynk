"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { useAuth } from '@/lib/auth-context-v2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Activity, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/client-api-helpers';
import Link from 'next/link';
import ActiveClientsWidget from '@/components/ActiveClientsWidget';
import BalanceWidget from '@/components/BalanceWidget';
import ManagerEarningsWidget from '@/components/ManagerEarningsWidget';

type Order = {
  id: number;
  displayId?: string;
  orderNumber: string;
  title: string;
  pages: number | null;
  slides: number | null;
  deadline: string;
  actualDeadline: string;
  status: string;
  amount: number;
  client?: { name: string };
  writer?: { name: string };
};

type DashboardData = {
  manager: any;
  stats: {
    totalClients: number;
    totalWriters: number;
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    deliveredOrders: number;
    completedOrders: number;
    revisionOrders: number;
  };
  clients: any[];
  writers: any[];
  orders: Order[];
};

const safeReadJson = async (response: Response): Promise<any | null> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export default function ManagerDashboardPage() {
  // ?? Standardized dashboard protection
  const { user, loading } = useDashboardProtection('manager');
  const { logout } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetchedData = useRef(false);
  const authErrorHandledRef = useRef(false);
  
  // Online users state
  const [onlineFreelancers, setOnlineFreelancers] = useState(0);
  const [onlineClients, setOnlineClients] = useState(0);

  const fetchOnlineUsers = async () => {
    try {
      // Fetch online freelancers
      const freelancersRes = await safeApiFetch('/api/v2/users/online?role=freelancer', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (freelancersRes.ok) {
        const data = (await safeReadJson(freelancersRes)) ?? {};
        setOnlineFreelancers(data.count || 0);
      }

      // Fetch online clients
      const clientsRes = await safeApiFetch('/api/v2/users/online?role=client', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (clientsRes.ok) {
        const data = (await safeReadJson(clientsRes)) ?? {};
        setOnlineClients(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      setError(null);
      const timestamp = Date.now();
      const token = localStorage.getItem('bearer_token');

      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };

      // Only set Authorization if we actually have a token.
      // Sending `Bearer null` (or stale tokens) can cause auth middleware to reject the request
      // even when the httpOnly cookie session is valid.
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await safeApiFetch(`/api/manager/dashboard?managerId=${user.id}&_=${timestamp}`, {
        cache: 'no-store',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        const data = await safeReadJson(response);
        setDashboardData(data);
      } else {
        const errorData = await safeReadJson(response);
        const message = extractErrorMessage(errorData, `Failed to load dashboard (${response.status})`);

        if ((response.status === 401 || response.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          await logout();
          return;
        }

        setError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      const message = error instanceof Error ? error.message : 'Network error. Please check your connection.';
      setError(message);
      toast.error(message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loading || !user) return;
    
    // Fetch data only once on mount
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchDashboardData();
      fetchOnlineUsers();
    }

    // No auto-refresh - user can manually refresh if needed
  }, [user, loading]);

  const handleExportOrders = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await safeApiFetch(`/api/manager/orders?managerId=${user.id}&format=csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manager-orders-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Orders exported successfully');
      } else {
        toast.error('Failed to export orders');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const statusFlow = [
    { label: 'Pending', count: dashboardData?.stats.pendingOrders || 0, color: 'bg-yellow-500' },
    { label: 'Progress', count: dashboardData?.stats.inProgressOrders || 0, color: 'bg-orange-500' },
    { label: 'Delivered', count: dashboardData?.stats.deliveredOrders || 0, color: 'bg-blue-500' },
    { label: 'Completed', count: dashboardData?.stats.completedOrders || 0, color: 'bg-green-500' },
    { label: 'Revision', count: dashboardData?.stats.revisionOrders || 0, color: 'bg-cyan-500' },
  ];

  const filteredOrders = (dashboardData?.orders || []).filter(order =>
    (order.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading || !user) {
    return <DashboardLoader />;
  }

  const activeOrders = (dashboardData?.orders || []).filter(o => ['in_progress'].includes(o.status));
  const completedOrders = (dashboardData?.orders || []).filter(o => o.status === 'completed');
  const totalOrders = dashboardData?.stats.totalOrders || 0;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Manager Command Center
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#5B3594]/10 text-[#5B3594] dark:text-purple-400 border border-[#5B3594]/20 uppercase tracking-wider">
              Project Lead
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your writer team, assign incoming orders, and track project deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleExportOrders}
            variant="outline"
            size="sm"
            className="rounded-xl border-border hover:bg-muted text-xs font-semibold h-8 px-3"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border hover:bg-muted text-xs font-semibold h-8 px-3"
          >
            <Link href="/manager/writers" className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Writers ({dashboardData?.stats.totalWriters || 0})</span>
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 shadow-sm text-xs"
          >
            <Link href="/manager/orders" className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Manage Orders</span>
            </Link>
          </Button>
        </div>
      </div>

      {loadingData ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Compiling team telemetry...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-card border border-destructive/30 rounded-2xl">
          <p className="text-xs text-destructive mb-3 font-semibold">{error}</p>
          <Button onClick={fetchDashboardData} size="sm" className="rounded-xl h-8 text-xs font-bold">
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* Top 4 Compact Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Clients */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Client Accounts</span>
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground">
                  {dashboardData?.stats.totalClients || 0}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {onlineClients} online
                </span>
              </div>
            </div>

            {/* Total Writers */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Writer Team</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground">
                  {dashboardData?.stats.totalWriters || 0}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {onlineFreelancers} online
                </span>
              </div>
            </div>

            {/* Total Orders */}
            <Link
              href="/manager/orders"
              className="group p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 hover:border-primary/50 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Managed Orders</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  {dashboardData?.stats.totalOrders || 0}
                </span>
                <span className="text-[10px] font-semibold text-primary">
                  {dashboardData?.stats.inProgressOrders || 0} active
                </span>
              </div>
            </Link>

            {/* Completed Orders */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground">
                  {dashboardData?.stats.completedOrders || 0}
                </span>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  {dashboardData?.stats.revisionOrders || 0} revisions
                </span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Command Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Columns: Financial Streams + Recent Orders Feed */}
            <div className="lg:col-span-2 space-y-4">
              {/* Financial Balance & Earnings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BalanceWidget
                  userId={user.id}
                  variant="compact"
                  showWithdrawButton={true}
                  onWithdrawClick={() => router.push('/manager/payments')}
                  autoRefresh={true}
                  userRole="manager"
                />
                <ManagerEarningsWidget managerId={user.id} variant="compact" />
              </div>

              {/* Recent Orders Queue Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Active Orders Queue</h3>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                      {filteredOrders.length}
                    </Badge>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                    <Input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs bg-muted/30 border-border/70 rounded-lg"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs">
                      No orders found matching your criteria.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                          <th className="py-2 px-2.5">Order</th>
                          <th className="py-2 px-2.5">Topic</th>
                          <th className="py-2 px-2.5">Client</th>
                          <th className="py-2 px-2.5">Writer</th>
                          <th className="py-2 px-2.5">Status</th>
                          <th className="py-2 px-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-xs">
                        {filteredOrders.slice(0, 8).map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => router.push(`/manager/orders/${order.id}`)}
                            className="hover:bg-muted/40 cursor-pointer transition-colors group"
                          >
                            <td className="py-2.5 px-2.5 font-mono text-[11px] font-bold text-foreground">
                              {order.displayId || order.orderNumber}
                            </td>
                            <td className="py-2.5 px-2.5 max-w-[180px] truncate font-medium text-foreground group-hover:text-primary transition-colors">
                              {order.title}
                            </td>
                            <td className="py-2.5 px-2.5 text-muted-foreground text-[11px]">
                              {order.client?.name || '—'}
                            </td>
                            <td className="py-2.5 px-2.5 text-muted-foreground text-[11px]">
                              {order.writer?.name || (
                                <span className="text-amber-600 font-medium">Unassigned</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5">
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold capitalize px-2 py-0.5">
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              KSh {order.amount?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Column: Lifecycle Distribution & Active Clients */}
            <div className="space-y-4">
              {/* Order Status Distribution Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">Status Distribution</h3>
                  <Link href="/manager/orders" className="text-xs font-bold text-primary hover:underline">
                    View All
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-base font-black text-amber-600 dark:text-amber-400">
                      {dashboardData?.stats.pendingOrders || 0}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">Pending Review</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-base font-black text-blue-600 dark:text-blue-400">
                      {dashboardData?.stats.inProgressOrders || 0}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">In Progress</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-base font-black text-purple-600 dark:text-purple-400">
                      {dashboardData?.stats.deliveredOrders || 0}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">Delivered</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {dashboardData?.stats.completedOrders || 0}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">Completed</p>
                  </div>
                </div>
              </div>

              {/* Active Clients Widget */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <ActiveClientsWidget />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
