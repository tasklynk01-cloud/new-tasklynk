"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Plus, AlertTriangle, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ActiveWritersCount } from '@/components/ActiveWritersCount';
import OnlineManagersWidget from '@/components/OnlineManagersWidget';

type Job = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  amount: number;
  status: string;
  deadline: string;
  actualDeadline: string;
  createdAt: string;
  pages: number | null;
  slides: number | null;
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, loading } = useDashboardProtection(['client', 'account_owner']);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const hasFetchedJobs = useRef(false);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/v2/orders?userId=${user.id}&role=client&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const mapped: Job[] = (data.orders || []).map((o: any) => ({
          id: o.id,
          displayId: o.orderNumber || '',
          title: o.title,
          workType: o.workType,
          amount: Number(o.clientTotal ?? 0),
          status: o.status,
          deadline: new Date(o.deadline).toISOString(),
          actualDeadline: new Date(o.deadline).toISOString(),
          createdAt: new Date(o.createdAt).toISOString(),
          pages: o.pageCount || null,
          slides: o.slideCount || null,
        }));
        setJobs(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoadingJobs(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading || !user) return;
    
    if (!hasFetchedJobs.current) {
      hasFetchedJobs.current = true;
      fetchJobs();
    }
  }, [user, loading, fetchJobs]);

  if (loading || !user) {
    return <DashboardLoader />;
  }

  // Calculate stats
  const totalSpent = jobs.reduce((sum, job) => sum + job.amount, 0);
  const activeOrders = jobs.filter(j => ['approved', 'in_progress', 'editing'].includes(j.status));
  const completedOrders = jobs.filter(j => j.status === 'completed');
  const pendingOrders = jobs.filter(j => j.status === 'pending');

  // Calculate completion percentage
  const completionRate = jobs.length > 0 ? Math.round((completedOrders.length / jobs.length) * 100) : 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="heading-lg mb-2">Welcome back, {user.name}!</h1>
            <p className="text-secondary text-lg">Here's your order overview</p>
          </div>
          {user.approved && (
            <Link href="/client/new-job">
              <button className="btn-orange">
                <Plus className="w-5 h-5 mr-2" />
                New Order
              </button>
            </Link>
          )}
        </div>

        {!user.approved && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="ml-2 text-orange-900 font-medium">
              Your account is pending approval. You'll be able to place orders once approved.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="dashboard-grid mb-8">
          {/* Total Spent Card */}
          <div className="gradient-card-orange lg:col-span-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white/90">Total Spent</h3>
                <p className="text-5xl font-bold mb-2">KSh {totalSpent.toLocaleString()}</p>
                <div className="flex items-center gap-3 text-orange-100">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{jobs.length} orders placed</span>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Order Statistics */}
          <div className="card-modern">
            <h3 className="heading-sm mb-4">Order Statistics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-secondary">Completed</span>
                  <span className="text-sm font-bold">{completionRate}%</span>
                </div>
                <div className="progress-orange">
                  <div className="fill" style={{width: `${completionRate}%`}}></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-[#2d2d5a]">{activeOrders.length}</p>
                  <p className="text-xs text-secondary mt-1">Active</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-[#2d2d5a]">{completedOrders.length}</p>
                  <p className="text-xs text-secondary mt-1">Done</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-[#2d2d5a]">{pendingOrders.length}</p>
                  <p className="text-xs text-secondary mt-1">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="card-modern lg:col-span-2 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="heading-sm">Active Orders</h3>
            <Link href="/client/orders">
              <span className="text-sm text-[#ff8c42] hover:text-[#ff7a2e] font-medium cursor-pointer">
                View All →
              </span>
            </Link>
          </div>
          
          {loadingJobs ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8c42] mx-auto"></div>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-600 mb-2">No active orders</p>
              <p className="text-sm text-gray-500 mb-6">Place a new order to get started</p>
              {user.approved && (
                <Link href="/client/new-job">
                  <button className="btn-orange">
                    <Plus className="w-5 h-5 mr-2" />
                    Place New Order
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 5).map((job) => (
                <div 
                  key={job.id}
                  onClick={() => router.push(`/client/orders/${job.id}`)}
                  className="order-card cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-[#2d2d5a]">{job.title}</p>
                      <span className="text-xs text-[#ff8c42] font-mono font-bold">{job.displayId}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Due {new Date(job.actualDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span>{job.pages ? `${job.pages} pages` : job.slides ? `${job.slides} slides` : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="badge-orange capitalize">
                      {job.status.replace('_', ' ')}
                    </span>
                    <span className="text-lg font-bold text-[#2d2d5a]">
                      KSh {job.amount.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Writers Widget */}
          <div className="card-modern">
            <h3 className="heading-sm mb-4">Available Writers</h3>
            <ActiveWritersCount showNames={false} autoRefresh={true} refreshInterval={30000} />
          </div>

          {/* Online Managers Widget */}
          <div className="card-modern">
            <h3 className="heading-sm mb-4">Support Team</h3>
            <OnlineManagersWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
