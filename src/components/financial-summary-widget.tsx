"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context-v2';
import { extractErrorMessage, safeApiFetch } from '@/lib/client-api-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Wallet,
  Receipt,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type FinancialSummary = {
  pendingPayouts: {
    freelancers: number;
    managers: number;
    total: number;
    userCount: number;
  };
  settledThisMonth: number;
  platformProfit: {
    thisMonth: number;
    allTime: number;
  };
  ordersThisMonth: {
    total: number;
    paid: number;
    completed: number;
  };
};

export function FinancialSummaryWidget() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      void fetchSummary();
      return;
    }

    if (user) {
      setSummary(null);
      setError('Financial summary is only available to admins.');
      setLoading(false);
    }
  }, [user]);

  const fetchSummary = async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      setLoading(true);
      setError(null);
      const res = await safeApiFetch('/api/v2/admin/financial-summary', {
        credentials: 'include',
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        return;
      }

      const errorData = await res.json().catch(() => null);
      const message = extractErrorMessage(errorData, `Failed to load financial summary (${res.status})`);
      setSummary(null);
      setError(message);
      toast.error(message);
    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'Financial summary request timed out.'
        : 'Failed to fetch financial summary.';
      setSummary(null);
      setError(message);
      toast.error(message);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {error || 'Financial summary is currently unavailable.'}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void fetchSummary()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Pending Payouts */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Payouts
          </CardTitle>
          <Wallet className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            KSh {summary.pendingPayouts.total.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{summary.pendingPayouts.userCount} users awaiting payment</span>
          </div>
          <Link href="/admin/invoicing">
            <Button size="sm" variant="outline" className="w-full mt-3">
              <Receipt className="h-3 w-3 mr-1" />
              Process Payments
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Settled This Month */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Settled This Month
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            KSh {summary.settledThisMonth.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Paid out to freelancers & managers
          </p>
          <Link href="/admin/invoicing?tab=history">
            <Button size="sm" variant="outline" className="w-full mt-3">
              <Clock className="h-3 w-3 mr-1" />
              View History
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Platform Profit This Month */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Profit This Month
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            KSh {summary.platformProfit.thisMonth.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            All-time: KSh {summary.platformProfit.allTime.toLocaleString()}
          </div>
          <Link href="/admin/orders/completed">
            <Button size="sm" variant="outline" className="w-full mt-3">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Orders This Month */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Orders This Month
          </CardTitle>
          <DollarSign className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {summary.ordersThisMonth.total}
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {summary.ordersThisMonth.completed} completed
            </Badge>
          </div>
          <Link href="/admin/orders">
            <Button size="sm" variant="outline" className="w-full mt-3">
              View All Orders
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
