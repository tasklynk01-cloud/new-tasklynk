"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect, useRef } from 'react';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import CPPProgressWidget from '@/components/CPPProgressWidget';
import { toast } from 'sonner';
import { InvoiceDownload, SingleInvoiceDownload } from '@/components/invoice-download';

type Earning = {
  id: number;
  jobId: number;
  jobTitle: string;
  amount: number;
  status: string;
  completedAt: string;
  createdAt: string;
};

export default function FreelancerEarningsPage() {
  const { user, loading } = useDashboardProtection('freelancer');
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    completedJobs: 0,
  });
  const hasFetchedData = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchEarnings();
    }
  }, [user, loading]);

  const fetchEarnings = async () => {
    if (!user) return;
    
    try {
      setLoadingData(true);
      const timestamp = Date.now();
      const response = await safeApiFetch(`/api/freelancer/earnings?userId=${user.id}&_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEarnings(data.earnings || []);
        setStats({
          totalEarned: data.totalEarned || 0,
          pendingAmount: data.pendingAmount || 0,
          completedJobs: data.completedJobs || 0,
        });
      } else {
        toast.error('Failed to load earnings data');
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      toast.error('Network error loading earnings');
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || !user) {
    return <DashboardLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings & Payments</h1>
        <p className="text-muted-foreground mt-2">
          Track your earnings from completed orders and pending payments
        </p>
      </div>

      {/* CPP Progress Widget */}
      {user && (
        <CPPProgressWidget freelancerId={user.id} />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalEarned.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.pendingAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval or payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>
              Detailed breakdown of all your earnings
            </CardDescription>
          </div>
          {earnings.length > 0 && (
            <InvoiceDownload
              items={earnings.map(earning => ({
                orderId: `#${earning.jobId}`,
                title: earning.jobTitle,
                amount: earning.amount,
                date: earning.completedAt,
                status: earning.status,
              }))}
              title="Freelancer Earnings Statement"
              userName={user?.name}
              userEmail={user?.email}
              userRole="Freelancer"
              totalAmount={stats.totalEarned}
            />
          )}
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <Alert>
              <AlertDescription>
                No earnings yet. Complete orders to start earning!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="font-medium">
                        {earning.jobTitle}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          ${earning.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            earning.status === 'completed'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {earning.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(earning.completedAt),
                          'MMM dd, yyyy'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <SingleInvoiceDownload
                          orderId={`${earning.jobId}`}
                          title={earning.jobTitle}
                          freelancer={user?.name}
                          amount={earning.amount}
                          date={earning.completedAt}
                          status={earning.status}
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
