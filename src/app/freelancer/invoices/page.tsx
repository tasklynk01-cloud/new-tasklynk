"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { InvoiceDownload, SingleInvoiceDownload } from '@/components/invoice-download';

type InvoiceOrder = {
  orderId: string;
  client: string;
  manager: string;
  freelancer: string;
  earnings: number;
  date: string;
  title: string;
};

export default function FreelancerInvoicesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<InvoiceOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'freelancer') {
        router.push('/');
      } else {
        fetchInvoices();
      }
    }
  }, [user, loading, router]);

  const fetchInvoices = async () => {
    if (!user?.id) return;
    
    setLoadingOrders(true);
    try {
      const response = await safeApiFetch(`/api/freelancer/invoices?freelancerId=${user.id}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error('Failed to fetch invoices');
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const totalEarnings = orders.reduce((sum, order) => sum + order.earnings, 0);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invoices</h1>
        <p className="text-muted-foreground">
          Summary of billable orders and earnings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Approved, paid, and completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KSh {totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From approved orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Invoice Summary</CardTitle>
            <CardDescription>
              Billable orders showing Order ID, Client, Manager, Freelancer, Earnings, and Date
            </CardDescription>
          </div>
          {orders.length > 0 && (
            <InvoiceDownload
              items={orders.map(order => ({
                orderId: order.orderId,
                title: order.title,
                client: order.client,
                freelancer: order.freelancer,
                manager: order.manager,
                amount: order.earnings,
                date: order.date,
              }))}
              title="Freelancer Invoice Statement"
              userName={user?.name}
              userEmail={user?.email}
              userRole="Freelancer"
              totalAmount={totalEarnings}
            />
          )}
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No billable orders found</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Freelancer</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-semibold">
                        {order.orderId}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.title}
                      </TableCell>
                      <TableCell>{order.client}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.manager}</Badge>
                      </TableCell>
                      <TableCell>{order.freelancer}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        KSh {order.earnings.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {order.date ? format(new Date(order.date), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <SingleInvoiceDownload
                          orderId={order.orderId}
                          title={order.title}
                          client={order.client}
                          freelancer={order.freelancer}
                          amount={order.earnings}
                          date={order.date}
                        />
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

