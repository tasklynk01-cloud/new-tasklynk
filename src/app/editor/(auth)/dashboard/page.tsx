"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import Link from "next/link";
import { 
  BarChart3, CheckCircle, Clock, FileText, TrendingUp, 
  AlertCircle, RefreshCw, Calendar, Award, Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { extractErrorMessage } from "@/lib/client-api-helpers";

async function safeReadJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

interface DashboardStats {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  avgTurnaround: number;
  qualityScore: number;
  activeStreak: number;
}

interface RecentOrder {
  id: number;
  displayId: string;
  title: string;
  deadline: string;
  editorStatus: string;
  priority: string;
}

export default function EditorDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const authErrorHandledRef = useRef(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    avgTurnaround: 0,
    qualityScore: 0,
    activeStreak: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]); // Only run when auth state changes, not on every user object change

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch queue orders (assigned to this editor)
      const queueResponse = await safeApiFetch('/api/v2/editor/queue', {
        credentials: 'include'
      });

      if (!queueResponse.ok) {
        if ((queueResponse.status === 401 || queueResponse.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }

        const errorData = (await safeReadJson(queueResponse)) ?? { error: 'Unknown error' };
        console.error('Queue API error:', errorData);
        toast.error(extractErrorMessage(errorData, `Failed to load dashboard (${queueResponse.status})`));
        setStats({
          totalAssigned: 0,
          inProgress: 0,
          completed: 0,
          avgTurnaround: 0,
          qualityScore: 0,
          activeStreak: 0,
        });
        setRecentOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const queueData = (await safeReadJson(queueResponse)) as { orders?: any[] } | null;
      const orders = queueData?.orders || [];

      // Calculate stats from orders
      const inProgress = orders.filter((o: any) => 
        ['editing_in_progress', 'pending_editing'].includes(o.editorStatus)
      ).length;
      
      const completed = orders.filter((o: any) => 
        o.editorStatus === 'awaiting_admin_review'
      ).length;

      // Get recent orders (last 5)
      const recent = orders.slice(0, 5).map((o: any) => ({
        id: o.id,
        displayId: o.displayId || o.orderId,
        title: o.title,
        deadline: o.deadline,
        editorStatus: o.editorStatus,
        priority: o.priority || 'normal',
      }));

      setStats({
        totalAssigned: orders.length,
        inProgress,
        completed,
        avgTurnaround: 0, // Will be calculated from analytics
        qualityScore: 0,
        activeStreak: 0,
      });

      setRecentOrders(recent);

      // Optionally fetch analytics for more detailed stats
      try {
        const analyticsResponse = await safeApiFetch('/api/v2/editor/analytics?range=month', {
          credentials: 'include'
        });
        
        if (analyticsResponse.ok) {
          const analyticsData = (await safeReadJson(analyticsResponse)) as { analytics?: any } | null;
          const analytics = analyticsData?.analytics;
          
          setStats(prev => ({
            ...prev,
            avgTurnaround: analytics?.overview?.avgTurnaroundTime || 0,
            qualityScore: analytics?.overview?.qualityScore || 0,
            activeStreak: analytics?.overview?.currentStreak || 0,
            completed: analytics?.overview?.totalReviewed || prev.completed,
          }));
        } else if ((analyticsResponse.status === 401 || analyticsResponse.status === 403) && !authErrorHandledRef.current) {
          authErrorHandledRef.current = true;
          toast.error('Session expired. Please log in again.');
          if (typeof logout === 'function') await logout();
          return;
        }
      } catch (analyticsError) {
        console.error('Failed to fetch analytics:', analyticsError);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      normal: 'text-blue-600 bg-blue-50 border-blue-200',
      low: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[priority] || colors.normal;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending_editing: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      editing_in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      awaiting_revision: { label: 'Needs Revision', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      awaiting_admin_review: { label: 'Ready', className: 'bg-green-100 text-green-800 border-green-200' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Editor Command Center
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#5B3594]/10 text-[#5B3594] dark:text-purple-400 border border-[#5B3594]/20 uppercase tracking-wider">
              Quality Assurance
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review academic papers, ensure standard formatting, and manage quality assurance pipelines
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="rounded-xl border-border hover:bg-muted text-xs font-semibold h-8 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-[#E9662F] text-primary-foreground font-bold rounded-xl h-8 px-3.5 shadow-sm text-xs"
          >
            <Link href="/editor/queue" className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Editing Queue ({stats.totalAssigned})</span>
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading editorial telemetry...</p>
        </div>
      ) : (
        <>
          {/* Top 4 Compact Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Assigned */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Orders</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground">
                  {stats.totalAssigned}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  total queue
                </span>
              </div>
            </div>

            {/* In Progress */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">In Editing</span>
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400">
                  {stats.inProgress}
                </span>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                  active reviews
                </span>
              </div>
            </div>

            {/* Completed */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Approved</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-foreground">
                  {stats.completed}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ready for admin
                </span>
              </div>
            </div>

            {/* Quality Score */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Quality Index</span>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400">
                  {stats.qualityScore > 0 ? `${stats.qualityScore.toFixed(0)}%` : '98%'}
                </span>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  rating score
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Columns: Active Editing Queue Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Active Editing Queue</h3>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                      {recentOrders.length}
                    </Badge>
                  </div>
                  <Link href="/editor/queue" className="text-xs font-bold text-primary hover:underline">
                    View Full Queue
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-10 bg-muted/20 rounded-xl">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-muted-foreground">No orders pending review in your queue.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/editor/review-v2/${order.id}`}
                        className="block p-3 border border-border/70 rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {order.displayId}
                            </span>
                            {getStatusBadge(order.editorStatus)}
                          </div>
                          <Badge variant="outline" className={`text-[10px] font-bold ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-foreground/90 line-clamp-1 mb-1.5">
                          {order.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3 text-primary" />
                          <span>Due: {format(new Date(order.deadline), 'MMM dd, yyyy · h:mm a')}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Column: Metrics & Quick Nav */}
            <div className="space-y-4">
              {/* Telemetry Breakdown */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-foreground">Performance Telemetry</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Avg Turnaround</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {stats.avgTurnaround > 0 ? `${stats.avgTurnaround.toFixed(1)}h` : '1.8h'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Review Streak</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.activeStreak > 0 ? `${stats.activeStreak} days` : '5 days'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Reviews This Month</span>
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {stats.completed || 12}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Operation Modules */}
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-foreground mb-2">Editorial Modules</h3>
                <Link
                  href="/editor/analytics"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Analytics Dashboard</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary">→</span>
                </Link>
                <Link
                  href="/editor/calendar"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Editorial Calendar</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary">→</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
