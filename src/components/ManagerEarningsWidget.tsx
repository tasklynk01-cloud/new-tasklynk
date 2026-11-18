"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, DollarSign, Briefcase, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { OrderLink } from '@/components/OrderLink';

interface EarningsRecord {
  id: number;
  jobId: number;
  earningType: 'assignment' | 'submission' | 'completion';
  amount: number;
  createdAt: string;
  orderNumber: string | null;
  orderTitle: string | null;
  orderStatus: string | null;
}

interface EarningsData {
  earnings: EarningsRecord[];
  totals: {
    assignment: number;
    submission: number;
    completion: number;
    total: number;
  };
  count: number;
}

interface ManagerEarningsWidgetProps {
  managerId: number;
  variant?: 'full' | 'compact';
}

export default function ManagerEarningsWidget({ 
  managerId, 
  variant = 'full' 
}: ManagerEarningsWidgetProps) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v2/managers/${managerId}/earnings`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch earnings data');
        }

        const earningsData = await response.json();
        setData(earningsData);
      } catch (err) {
        console.error('Error fetching manager earnings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [managerId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-8 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            Earnings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-300 bg-red-100 dark:bg-red-900/30">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error || 'Unable to load earnings information'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { totals } = data;

  if (variant === 'compact') {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            Earnings Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Earnings */}
          <div className="text-center p-4 bg-white dark:bg-slate-900/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-green-600">
              KSh {totals.total.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.count} earning{data.count !== 1 ? 's' : ''} recorded
            </p>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded text-center">
              <p className="text-xs text-muted-foreground">Assignment</p>
              <p className="font-bold text-sm text-blue-600">
                KSh {totals.assignment.toFixed(0)}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded text-center">
              <p className="text-xs text-muted-foreground">Submission</p>
              <p className="font-bold text-sm text-purple-600">
                KSh {totals.submission.toFixed(0)}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded text-center">
              <p className="text-xs text-muted-foreground">Completion</p>
              <p className="font-bold text-sm text-orange-600">
                KSh {totals.completion.toFixed(0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Earnings Overview
          </CardTitle>
          <Badge className="bg-green-600 text-primary-foreground">
            {data.count} Records
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Earnings Display */}
        <div className="text-center p-6 bg-white dark:bg-slate-900/50 rounded-lg border-2 border-green-200 dark:border-green-800">
          <p className="text-sm text-muted-foreground mb-2">Total Lifetime Earnings</p>
          <p className="text-4xl font-bold text-green-600">
            KSh {totals.total.toFixed(2)}
          </p>
        </div>

        {/* Earnings Breakdown by Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Assignment Earnings */}
          <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Assignment Fees
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              KSh {totals.assignment.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              10 KSh per assignment
            </p>
          </div>

          {/* Submission Earnings */}
          <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Submission Fees
              </p>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              KSh {totals.submission.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              10 + 5×(pages-1) per submission
            </p>
          </div>

          {/* Completion Earnings */}
          <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                Completion Fees
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              KSh {totals.completion.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Additional completion bonuses
            </p>
          </div>
        </div>

        {/* Recent Earnings (Last 5) */}
        {data.earnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Recent Earnings</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.earnings.slice(0, 5).map((earning) => (
                <div
                  key={earning.id}
                  className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          earning.earningType === 'assignment'
                            ? 'border-blue-500 text-blue-700 dark:text-blue-300'
                            : earning.earningType === 'submission'
                            ? 'border-purple-500 text-purple-700 dark:text-purple-300'
                            : 'border-orange-500 text-orange-700 dark:text-orange-300'
                        }
                      >
                        {earning.earningType}
                      </Badge>
                      <OrderLink orderId={earning.jobId} displayId={earning.orderNumber ?? undefined} className="text-sm font-medium" />
                    </div>
                    {earning.orderTitle && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {earning.orderTitle}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(earning.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      KSh {earning.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {data.earnings.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No earnings recorded yet. Earnings are added when you assign writers and orders are submitted.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

