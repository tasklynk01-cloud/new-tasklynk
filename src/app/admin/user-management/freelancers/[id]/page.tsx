"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Award,
  Briefcase,
  Star,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { getCPPLevelByOrderCount, type CPPLevel } from '@/lib/cpp-calculation';

type FreelancerDetails = {
  id: number;
  displayId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  approved: boolean;
  balance: number;
  completedJobs: number;
  rating: number | null;
  freelancerBadge: string | null;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
};

type Order = {
  id: number;
  displayId: string;
  title: string;
  amount: number;
  freelancerEarnings: number | null;
  status: string;
  createdAt: string;
  deadline: string;
  pages: number;
  workType: string;
};

export default function AdminFreelancerDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const freelancerId = params.id as string;

  const [freelancer, setFreelancer] = useState<FreelancerDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [cppLevel, setCppLevel] = useState<CPPLevel | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      } else {
        fetchFreelancerDetails();
      }
    }
  }, [user, loading, router, freelancerId]);

  const fetchFreelancerDetails = async () => {
    try {
      setLoadingData(true);

      const [freelancerRes, ordersRes] = await Promise.all([
        safeApiFetch(`/api/users/${freelancerId}`, { 
          credentials: 'include',
          cache: 'no-store' 
        }),
        safeApiFetch(`/api/v2/orders?assignedFreelancerId=${freelancerId}&limit=500`, { 
          credentials: 'include',
          cache: 'no-store'
        })
      ]);

      if (freelancerRes.ok) {
        const freelancerData = await freelancerRes.json();
        setFreelancer(freelancerData);
        
        // Calculate CPP level based on completed jobs
        const level = getCPPLevelByOrderCount(freelancerData.completedJobs || 0);
        setCppLevel(level);
      } else {
        toast.error('Failed to load freelancer details');
        router.push('/admin/user-management/freelancers');
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to fetch freelancer details:', error);
      toast.error('Failed to load freelancer details');
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!freelancer) {
    return null;
  }

  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => ['in_progress', 'editing', 'delivered', 'revision'].includes(o.status));
  const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.freelancerEarnings || 0), 0);

  const badgeConfig = {
    bronze: { label: 'Bronze', color: 'bg-orange-700 text-white', icon: '🥉' },
    silver: { label: 'Silver', color: 'bg-gray-400 text-white', icon: '🥈' },
    gold: { label: 'Gold', color: 'bg-yellow-500 text-white', icon: '🥇' },
    platinum: { label: 'Platinum', color: 'bg-purple-600 text-white', icon: '💎' },
    elite: { label: 'Elite', color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', icon: '👑' },
  }[freelancer.freelancerBadge || 'bronze'] || { label: 'No Badge', color: 'bg-gray-300 text-gray-700', icon: '📝' };

  // Calculate CPP progress to next level
  const nextLevelOrders = cppLevel && cppLevel.level < 5 
    ? getCPPLevelByOrderCount(cppLevel.completedOrdersRequired + 1).completedOrdersRequired
    : null;
  const progressPercentage = nextLevelOrders 
    ? Math.min(((freelancer.completedJobs || 0) / nextLevelOrders) * 100, 100)
    : 100;

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link 
          href="/admin/user-management/freelancers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Freelancers
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-blue-600" />
                {freelancer.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">{freelancer.displayId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {freelancer.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {freelancer.phone}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Badge 
                variant={freelancer.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {freelancer.status}
              </Badge>
              {freelancer.freelancerBadge && (
                <Badge className={badgeConfig.color}>
                  <Award className="w-4 h-4 mr-1" />
                  {badgeConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Zap className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">{activeOrders.length}</p>
                <p className="text-xs text-muted-foreground">Active Orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
                <p className="text-2xl font-bold text-amber-600">KSh {freelancer.balance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Balance</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="w-5 h-5" />
                  Freelancer Information
                </CardTitle>
                <CardDescription>Account details and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                      <Badge variant={freelancer.approved ? 'default' : 'secondary'} className="capitalize">
                        {freelancer.approved ? 'Approved' : 'Pending Approval'}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Registration Date</p>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{format(new Date(freelancer.createdAt), 'MMMM dd, yyyy')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(freelancer.createdAt), 'h:mm a')}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium break-all">{freelancer.email}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{freelancer.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rating</p>
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <p className="text-lg font-semibold">
                          {freelancer.rating ? `${freelancer.rating.toFixed(1)} / 5.0` : 'No rating yet'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                      <p className="text-lg font-semibold">
                        {orders.length > 0 
                          ? Math.round((completedOrders.length / orders.length) * 100)
                          : 0}%
                      </p>
                      <Progress 
                        value={orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0} 
                        className="mt-2 h-2"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                      <p className="text-2xl font-bold text-green-600">KSh {freelancer.balance.toFixed(2)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Earnings (Completed)</p>
                      <p className="text-lg font-semibold text-blue-600">
                        KSh {totalEarnings.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CPP Tier Information */}
            {cppLevel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="w-5 h-5" />
                    CPP Tier & Progression
                  </CardTitle>
                  <CardDescription>Cost-per-page tier based on completed orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Tier</p>
                        <div className="flex items-center gap-3">
                          <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            {cppLevel.levelName}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Rate</p>
                        <p className="text-xl font-bold text-blue-600">
                          KSh {cppLevel.cppNonTechnical}/page
                        </p>
                        <p className="text-xs text-muted-foreground">
                          (KSh {cppLevel.cppTechnical} for technical)
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          Progress to Next Tier
                        </p>
                        <p className="text-sm font-medium">
                          {freelancer.completedJobs || 0} / {nextLevelOrders || cppLevel.completedOrdersRequired} orders
                        </p>
                      </div>
                      <Progress value={progressPercentage} className="h-3" />
                      {nextLevelOrders && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {nextLevelOrders - (freelancer.completedJobs || 0)} more orders to reach next tier
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Completed Jobs</p>
                        <p className="text-2xl font-bold text-green-600">{freelancer.completedJobs || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Orders Required (This Tier)</p>
                        <p className="text-2xl font-bold text-blue-600">{cppLevel.completedOrdersRequired}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Performance Badge */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Award className="w-5 h-5" />
                  Performance Badge
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-6xl mb-3">{badgeConfig.icon}</div>
                <Badge className={`${badgeConfig.color} text-lg px-4 py-2`}>
                  {badgeConfig.label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-3">
                  Based on quality and consistency
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Active Orders</span>
                  <span className="font-bold text-purple-600">{activeOrders.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-bold text-green-600">{completedOrders.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold">
                    {orders.length > 0 
                      ? Math.round((completedOrders.length / orders.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Avg. Rating</span>
                  <span className="font-bold flex items-center gap-1">
                    {freelancer.rating ? freelancer.rating.toFixed(1) : 'N/A'}
                    {freelancer.rating && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Order History ({orders.length})
            </CardTitle>
            <CardDescription>All orders assigned to this freelancer</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link 
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{order.title}</h4>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {order.displayId}
                        </p>
                      </div>
                      <Badge className="capitalize">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {order.pages} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {order.workType}
                      </span>
                      <span className="font-semibold text-green-600">
                        Earnings: KSh {(order.freelancerEarnings || 0).toFixed(2)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Due: {format(new Date(order.deadline), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

