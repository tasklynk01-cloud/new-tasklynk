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
  Eye,
  Trophy
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
  freelancerEarnings: number;
  completedAt: string;
  paidAt: string | null;
  isSettled: boolean;
  settlementDate: string | null;
  clientName: string;
};

export default function FreelancerCompletedOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && user?.role !== 'freelancer') {
      router.push('/');
      return;
    }
    
    if (user) {
      fetchCompletedOrders();
    }
  }, [user, loading, router]);

  const fetchCompletedOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await safeApiFetch(`/api/v2/orders?userId=${user?.id}&role=freelancer&status=paid,completed`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const allOrders = data?.data?.orders || data?.orders || [];
        // Filter for orders assigned to this freelancer
        const myOrders = allOrders.filter((o: any) => 
          o.assignedFreelancerId === user?.id && 
          (o.status === 'paid' || o.status === 'completed')
        );
        setOrders(myOrders);
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
      order.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const stats = {
    total: filteredOrders.length,
    totalEarnings: filteredOrders.reduce((sum, o) => sum + (o.freelancerEarnings || 0), 0),
    settledEarnings: filteredOrders.filter(o => o.isSettled).reduce((sum, o) => sum + (o.freelancerEarnings || 0), 0),
    pendingEarnings: filteredOrders.filter(o => !o.isSettled).reduce((sum, o) => sum + (o.freelancerEarnings || 0), 0),
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
            View your work history and earnings
          </p>
        </div>
        <Link href="/freelancer/orders">
          <Button variant="outline">? Back to Active Orders</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Trophy className="w-3 h-3 inline mr-1" />
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KSh {stats.totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Settled Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              KSh {stats.settledEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Already paid out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              KSh {stats.pendingEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting settlement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by order ID or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
              <h3 className="text-lg font-semibold mb-2">No completed orders yet</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search criteria' : 'Your completed orders will appear here'}
              </p>
              <Link href="/freelancer/orders">
                <Button>View Active Orders</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Work Type</TableHead>
                    <TableHead className="text-right">My Earnings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-semibold">
                        <Link href={`/freelancer/orders/${order.id}`} className="text-primary hover:underline">
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
                      <TableCell>
                        <Badge variant="outline">{order.workType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-green-600">
                          KSh {(order.freelancerEarnings || 0).toLocaleString()}
                        </div>
                        {order.isSettled && (
                          <div className="text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Paid
                          </div>
                        )}
                        {!order.isSettled && (
                          <div className="text-xs text-orange-600">
                            Pending
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status === 'completed' ? 'Completed' : 'Paid'}
                        </Badge>
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
                        <Link href={`/freelancer/orders/${order.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
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
