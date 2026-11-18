"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  DollarSign, 
  FileText, 
  Calendar,
  Search,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';

type CompletedOrder = {
  id: number;
  displayId: string;
  title: string;
  workType: string;
  pages: number | null;
  slides: number | null;
  status: string;
  amount: number;
  freelancerEarnings: number;
  managerEarnings: number;
  adminProfit: number;
  clientName: string;
  freelancerName: string;
  completedAt: string;
  paidAt: string | null;
  invoiceNumber: string | null;
  isSettled: boolean;
  settlementDate: string | null;
};

export default function AdminCompletedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'completed'>('all');

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (user) {
      fetchCompletedOrders();
    }
  }, [user, loading, router, statusFilter]);

  const fetchCompletedOrders = async () => {
    try {
      setLoadingOrders(true);
      const statusParam = statusFilter === 'all' ? 'paid,completed' : statusFilter;
      const res = await safeApiFetch(`/api/v2/orders?userId=${user?.id}&role=admin&status=${encodeURIComponent(statusParam)}&_t=${Date.now()}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const orders = Array.isArray(data)
          ? data
          : (data?.data?.orders || data?.orders || []);
        setOrders(orders);
      } else {
        toast.error('Failed to fetch completed orders');
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      toast.error('Failed to load completed orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const stats = {
    total: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, o) => sum + o.amount, 0),
    totalPlatformProfit: filteredOrders.reduce((sum, o) => sum + (o.adminProfit || 0), 0),
    settled: filteredOrders.filter(o => o.isSettled).length,
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Completed Orders</h1>
          <p className="text-muted-foreground mt-1">
            View all paid and completed orders
          </p>
        </div>
        <Link href="/admin/orders">
          <Button variant="outline">? Back to Active Orders</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Client payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              KSh {stats.totalPlatformProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              After payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Settled Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.settled}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Payouts completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by order ID, title, client, or freelancer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('paid')}
                size="sm"
              >
                Paid Only
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                size="sm"
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No completed orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'Completed orders will appear here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Platform Profit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="font-mono font-semibold">
                        <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                          {order.displayId}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div>
                          <div className="font-medium">{order.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.pages && `${order.pages} pages`}
                            {order.pages && order.slides && '  '}
                            {order.slides && `${order.slides} slides`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{order.clientName || 'N/A'}</TableCell>
                      <TableCell>{order.freelancerName || 'Unassigned'}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        KSh {order.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        KSh {(order.adminProfit || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status === 'completed' ? 'Completed' : 'Paid'}
                          </Badge>
                          {order.isSettled && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Settled
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {order.completedAt ? format(new Date(order.completedAt), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                        {order.settlementDate && (
                          <div className="text-xs text-green-600 mt-1">
                            Settled: {format(new Date(order.settlementDate), 'MMM dd')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          {order.invoiceNumber && (
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
