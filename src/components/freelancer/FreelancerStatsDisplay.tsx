"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

type FreelancerStats = {
  totalResponses: number;
  acceptedCount: number;
  rejectedCount: number;
  acceptanceRate: number;
  rejectionRate: number;
  averageResponseTimeSeconds: number;
};

type FreelancerStatsDisplayProps = {
  freelancerId: number;
  compact?: boolean;
};

export function FreelancerStatsDisplay({ freelancerId, compact = false }: FreelancerStatsDisplayProps) {
  const [stats, setStats] = useState<FreelancerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/v2/orders/stats/freelancer-response?freelancerId=${freelancerId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch freelancer stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [freelancerId]);

  if (loading) {
    return (
      <div className="flex gap-1">
        <div className="h-5 w-12 bg-muted animate-pulse rounded"></div>
        <div className="h-5 w-12 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (!stats || stats.totalResponses === 0) {
    return <Badge variant="outline" className="text-xs">No assignments yet</Badge>;
  }

  const formatResponseTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex gap-1">
          {/* Acceptance Rate */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={stats.acceptanceRate >= 80 ? 'default' : stats.acceptanceRate >= 50 ? 'secondary' : 'destructive'}
                className={`text-xs cursor-help ${
                  stats.acceptanceRate >= 80 ? 'bg-green-600 hover:bg-green-700' : 
                  stats.acceptanceRate >= 50 ? 'bg-yellow-600 hover:bg-yellow-700' : 
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {stats.acceptanceRate.toFixed(0)}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-semibold mb-1">Acceptance Rate</div>
                <div>Accepted: {stats.acceptedCount}/{stats.totalResponses}</div>
                <div>Avg Response: {formatResponseTime(stats.averageResponseTimeSeconds)}</div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Rejection Rate (only show if > 0) */}
          {stats.rejectedCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="text-xs cursor-help">
                  <XCircle className="h-3 w-3 mr-1" />
                  {stats.rejectionRate.toFixed(0)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-semibold mb-1">Rejection Rate</div>
                  <div>Rejected: {stats.rejectedCount}/{stats.totalResponses}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Full display
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {/* Acceptance Rate */}
        <Badge 
          variant={stats.acceptanceRate >= 80 ? 'default' : stats.acceptanceRate >= 50 ? 'secondary' : 'destructive'}
          className={`flex items-center gap-1 ${
            stats.acceptanceRate >= 80 ? 'bg-green-600' : 
            stats.acceptanceRate >= 50 ? 'bg-yellow-600' : 
            'bg-red-600'
          }`}
        >
          {stats.acceptanceRate >= 80 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          Accept: {stats.acceptanceRate.toFixed(1)}%
        </Badge>

        {/* Rejection Rate */}
        {stats.rejectedCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Reject: {stats.rejectionRate.toFixed(1)}%
          </Badge>
        )}

        {/* Response Time */}
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Avg: {formatResponseTime(stats.averageResponseTimeSeconds)}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground">
        {stats.acceptedCount} accepted, {stats.rejectedCount} rejected out of {stats.totalResponses} total assignments
      </div>
    </div>
  );
}
