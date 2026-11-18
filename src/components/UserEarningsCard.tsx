"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserEarningsCardProps {
  orderId: number;
  userRole: 'freelancer' | 'manager';
}

interface EarningsData {
  amount: number;
  currency: string;
}

export default function UserEarningsCard({ orderId, userRole }: UserEarningsCardProps) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v2/orders/${orderId}/financials`);
        
        if (!response.ok) {
          if (response.status === 403) {
            setError('You do not have permission to view financial information for this order.');
            return;
          }
          throw new Error('Failed to fetch earnings data');
        }

        const data = await response.json();
        
        // Extract only the user's earnings
        if (userRole === 'freelancer' && data.financials?.freelancerAmount !== undefined) {
          setEarnings({
            amount: data.financials.freelancerAmount,
            currency: 'KSh'
          });
        } else if (userRole === 'manager' && data.financials?.managerTotal !== undefined) {
          setEarnings({
            amount: data.financials.managerTotal,
            currency: 'KSh'
          });
        } else {
          setError('Earnings data not available for this order');
        }
      } catch (err) {
        console.error('Error fetching earnings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [orderId, userRole]);

  if (loading) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-600" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-red-600" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-green-600" />
          Your Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {earnings ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {userRole === 'freelancer' ? 'Writer Earnings' : 'Manager Earnings'}
              </span>
              <span className="text-2xl font-bold text-green-600">
                {earnings.currency} {earnings.amount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              This is your total earnings for this order.
            </p>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Earnings information is not yet available for this order.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
