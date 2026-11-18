'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Zap,
  Timer,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface ResponseStatsData {
  success: boolean;
  stats: {
    totalResponses: number;
    acceptedCount: number;
    rejectedCount: number;
    acceptanceRate: number;
    avgResponseTimeMinutes: number;
    avgResponseTimeFormatted: string;
  };
  responseTimeDistribution: {
    under1Hour: number;
    under4Hours: number;
    under24Hours: number;
    over24Hours: number;
  };
}

interface ResponseStatsWidgetProps {
  freelancerId: number;
  period?: 'week' | 'month' | '3months' | 'year' | 'all';
  compact?: boolean;
}

export default function ResponseStatsWidget({
  freelancerId,
  period = 'month',
  compact = false,
}: ResponseStatsWidgetProps) {
  const [data, setData] = useState<ResponseStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/v2/freelancer/response-stats?period=${period}&freelancerId=${freelancerId}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch response stats');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching response stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [freelancerId, period]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <Timer className="h-5 w-5 text-blue-600" />
            Response Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded dark:bg-gray-600" />
            <div className="h-8 bg-gray-300 rounded dark:bg-gray-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Response Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error || 'Unable to load stats'}</p>
        </CardContent>
      </Card>
    );
  }

  const { stats, responseTimeDistribution } = data;

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{stats.acceptanceRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Acceptance Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{stats.avgResponseTimeFormatted}</span>
              </div>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalResponses}</div>
              <p className="text-xs text-muted-foreground">Total Responses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-3">
          <Timer className="h-5 w-5 text-blue-600" />
          Response Statistics
        </CardTitle>
        <CardDescription>
          Your order response patterns and acceptance rate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-600">{stats.acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">Acceptance Rate</p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-600">{stats.avgResponseTimeFormatted}</div>
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.acceptedCount}</div>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
        </div>

        {/* Acceptance Rate Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Acceptance Rate</span>
            <span className="text-muted-foreground">{stats.acceptanceRate}%</span>
          </div>
          <Progress 
            value={stats.acceptanceRate} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground">
            {stats.acceptanceRate >= 80 
              ? '✅ Excellent! High acceptance rates lead to more assignments.'
              : stats.acceptanceRate >= 60
              ? '⚠️ Good, but consider accepting more orders to improve visibility.'
              : '❌ Low acceptance rate may affect your order assignments.'}
          </p>
        </div>

        {/* Response Time Distribution */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Response Time Distribution</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Under 1 hour</span>
                  <span className="font-medium">{responseTimeDistribution.under1Hour}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/20 rounded-full"
                    style={{ 
                      width: `${stats.totalResponses > 0 
                        ? (responseTimeDistribution.under1Hour / stats.totalResponses) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>1-4 hours</span>
                  <span className="font-medium">{responseTimeDistribution.under4Hours}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ 
                      width: `${stats.totalResponses > 0 
                        ? (responseTimeDistribution.under4Hours / stats.totalResponses) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Timer className="h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>4-24 hours</span>
                  <span className="font-medium">{responseTimeDistribution.under24Hours}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ 
                      width: `${stats.totalResponses > 0 
                        ? (responseTimeDistribution.under24Hours / stats.totalResponses) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Over 24 hours</span>
                  <span className="font-medium">{responseTimeDistribution.over24Hours}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ 
                      width: `${stats.totalResponses > 0 
                        ? (responseTimeDistribution.over24Hours / stats.totalResponses) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
