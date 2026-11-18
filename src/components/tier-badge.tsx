'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface WriterTier {
  id: number;
  name: string;
  minRating: number;
  minJobs: number;
  minSuccessRate: number;
  benefits: string[];
  color: string;
  icon: string;
}

interface FreelancerStats {
  jobsCompleted: number;
  averageRating: number;
  successRate: number;
}

interface TierBadgeProps {
  freelancerId: number;
  showIcon?: boolean;
  className?: string;
}

export function TierBadge({ freelancerId, showIcon = true, className = '' }: TierBadgeProps) {
  const [tier, setTier] = useState<WriterTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!freelancerId) {
      setLoading(false);
      return;
    }
    fetchFreelancerTier();
  }, [freelancerId]);

  const fetchFreelancerTier = async () => {
    try {
      // Fetch all tiers
      const tiersResponse = await fetch('/api/v2/writer-tiers', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!tiersResponse.ok) {
        console.warn('TierBadge: failed to load tier definitions', tiersResponse.status);
        return;
      }

      const tiersData = await tiersResponse.json();

      if (tiersData?.success) {
        const sortedTiers = tiersData.tiers.sort((a: WriterTier, b: WriterTier) => a.minJobs - b.minJobs);

        // Fetch freelancer stats
        const statsResponse = await fetch(`/api/v2/freelancers/${freelancerId}/tier-progress`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!statsResponse.ok) {
          console.warn('TierBadge: tier-progress request failed', statsResponse.status);
          return;
        }

        const statsData = await statsResponse.json();

        if (statsData?.success) {
          const stats: FreelancerStats = statsData.stats;
          
          // Determine current tier based on stats
          const qualified = sortedTiers.filter((tier: WriterTier) => 
            stats.jobsCompleted >= tier.minJobs &&
            stats.averageRating >= tier.minRating &&
            stats.successRate >= tier.minSuccessRate
          );

          const currentTier = qualified.length > 0 ? qualified[qualified.length - 1] : null;
          setTier(currentTier);
        }
      }
    } catch (error) {
      console.error('Error fetching freelancer tier:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!tier) {
    return (
      <Badge variant="secondary" className={className}>
        {showIcon && '🌱 '}New Writer
      </Badge>
    );
  }

  return (
    <Badge 
      className={className}
      style={{ 
        backgroundColor: tier.color,
        color: 'white'
      }}
    >
      {showIcon && `${tier.icon} `}{tier.name}
    </Badge>
  );
}

interface TierInfoProps {
  freelancerId: number;
  compact?: boolean;
}

export function TierInfo({ freelancerId, compact = false }: TierInfoProps) {
  const [tier, setTier] = useState<WriterTier | null>(null);
  const [stats, setStats] = useState<FreelancerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!freelancerId) {
      setLoading(false);
      return;
    }
    fetchFreelancerInfo();
  }, [freelancerId]);

  const fetchFreelancerInfo = async () => {
    try {
      // Fetch all tiers
      const tiersResponse = await fetch('/api/v2/writer-tiers', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!tiersResponse.ok) {
        console.warn('TierInfo: failed to load tier definitions', tiersResponse.status);
        return;
      }

      const tiersData = await tiersResponse.json();

      if (tiersData?.success) {
        const sortedTiers = tiersData.tiers.sort((a: WriterTier, b: WriterTier) => a.minJobs - b.minJobs);

        // Fetch freelancer stats
        const statsResponse = await fetch(`/api/v2/freelancers/${freelancerId}/tier-progress`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!statsResponse.ok) {
          console.warn('TierInfo: tier-progress request failed', statsResponse.status);
          return;
        }

        const statsData = await statsResponse.json();

        if (statsData?.success) {
          const freelancerStats: FreelancerStats = statsData.stats;
          setStats(freelancerStats);
          
          // Determine current tier
          const qualified = sortedTiers.filter((tier: WriterTier) => 
            freelancerStats.jobsCompleted >= tier.minJobs &&
            freelancerStats.averageRating >= tier.minRating &&
            freelancerStats.successRate >= tier.minSuccessRate
          );

          const currentTier = qualified.length > 0 ? qualified[qualified.length - 1] : null;
          setTier(currentTier);
        }
      }
    } catch (error) {
      console.error('Error fetching freelancer info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!stats) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        {tier ? (
          <Badge style={{ backgroundColor: tier.color }}>
            {tier.icon} {tier.name}
          </Badge>
        ) : (
          <Badge variant="secondary">🌱 New</Badge>
        )}
        <span className="text-muted-foreground">
          {stats.jobsCompleted} jobs · {stats.averageRating.toFixed(1)}★
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {tier ? (
          <Badge style={{ backgroundColor: tier.color, color: 'white' }}>
            {tier.icon} {tier.name}
          </Badge>
        ) : (
          <Badge variant="secondary">🌱 New Writer</Badge>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Jobs</p>
          <p className="font-medium">{stats.jobsCompleted}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Rating</p>
          <p className="font-medium">{stats.averageRating.toFixed(1)} ★</p>
        </div>
        <div>
          <p className="text-muted-foreground">Success</p>
          <p className="font-medium">{(stats.successRate * 100).toFixed(0)}%</p>
        </div>
      </div>
      {tier && tier.benefits.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs font-medium mb-1">Tier Benefits:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {tier.benefits.slice(0, 2).map((benefit, idx) => (
              <li key={idx}>• {benefit}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
