'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Star } from 'lucide-react';

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

interface TierProgressProps {
  userId: number;
}

export function TierProgress({ userId }: TierProgressProps) {
  const [tiers, setTiers] = useState<WriterTier[]>([]);
  const [currentTier, setCurrentTier] = useState<WriterTier | null>(null);
  const [nextTier, setNextTier] = useState<WriterTier | null>(null);
  const [stats, setStats] = useState<FreelancerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchTierProgress = async () => {
      try {
        const tiersResponse = await fetch('/api/v2/writer-tiers', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!tiersResponse.ok) return;
        const tiersData = await tiersResponse.json();
        if (!tiersData?.success) return;

        const sortedTiers = tiersData.tiers.sort((a: WriterTier, b: WriterTier) => a.minJobs - b.minJobs);
        setTiers(sortedTiers);

        const statsResponse = await fetch(`/api/v2/freelancers/${userId}/tier-progress`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!statsResponse.ok) return;
        const statsData = await statsResponse.json();
        if (!statsData?.success) return;

        setStats(statsData.stats);
        const qualified = sortedTiers.filter(
          (tier: WriterTier) =>
            statsData.stats.jobsCompleted >= tier.minJobs &&
            statsData.stats.averageRating >= tier.minRating &&
            statsData.stats.successRate >= tier.minSuccessRate
        );
        setCurrentTier(qualified.length > 0 ? qualified[qualified.length - 1] : null);

        const next = sortedTiers.find(
          (tier: WriterTier) =>
            statsData.stats.jobsCompleted < tier.minJobs ||
            statsData.stats.averageRating < tier.minRating ||
            statsData.stats.successRate < tier.minSuccessRate
        );
        setNextTier(next || null);
      } catch (error) {
        console.error('Error fetching tier progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTierProgress();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">Loading tier progress...</CardContent>
      </Card>
    );
  }

  if (!stats || tiers.length === 0) return null;

  const jobsPct = nextTier
    ? nextTier.minJobs > 0
      ? Math.min((stats.jobsCompleted / nextTier.minJobs) * 100, 100)
      : 100
    : 100;
  const ringColor = currentTier?.color || nextTier?.color || '#10b981';

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (jobsPct / 100) * circumference;

  const remainingParts: string[] = [];
  if (nextTier) {
    const jobsLeft = Math.max(0, nextTier.minJobs - stats.jobsCompleted);
    if (jobsLeft > 0) remainingParts.push(`${jobsLeft} more job${jobsLeft === 1 ? '' : 's'}`);
    if (stats.averageRating < nextTier.minRating) {
      remainingParts.push(`${nextTier.minRating.toFixed(1)}★ rating`);
    }
    if (stats.successRate < nextTier.minSuccessRate) {
      remainingParts.push(`${Math.round(nextTier.minSuccessRate * 100)}% success`);
    }
  }

  return (
    <Card className="shadow-sm border rounded-xl">
      <CardHeader className="py-3 px-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Writer Tier Progress
          </CardTitle>
          <Badge style={{ backgroundColor: ringColor }} className="text-white text-[11px]">
            {currentTier ? `${currentTier.icon} ${currentTier.name}` : '🌱 Getting Started'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1 space-y-3">
        <div className="flex items-center gap-4">
          {/* Circular Filling Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 68 68">
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/40"
              />
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-xs font-bold">{Math.round(jobsPct)}%</span>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span>
                <strong className="font-semibold">{stats.jobsCompleted}</strong> Jobs
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <strong className="font-semibold">{stats.averageRating.toFixed(1)}</strong>
              </span>
              <span>
                <strong className="font-semibold">{(stats.successRate * 100).toFixed(0)}%</strong> Success
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-snug">
              {nextTier
                ? remainingParts.length > 0
                  ? `Remaining for ${nextTier.icon} ${nextTier.name}: ${remainingParts.join(' • ')}`
                  : `Ready to unlock ${nextTier.icon} ${nextTier.name}`
                : 'Maximum tier achieved!'}
            </p>
          </div>
        </div>

        {/* Left-to-right tier color bar */}
        {tiers.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-muted/40">
              {tiers.map((tier) => {
                const unlocked =
                  stats.jobsCompleted >= tier.minJobs &&
                  stats.averageRating >= tier.minRating &&
                  stats.successRate >= tier.minSuccessRate;
                const isNext = nextTier?.id === tier.id;
                const fill = unlocked ? 100 : isNext ? jobsPct : 0;
                return (
                  <div key={tier.id} className="flex-1 bg-muted/60 rounded-full overflow-hidden" title={tier.name}>
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ width: `${fill}%`, backgroundColor: tier.color || '#10b981' }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              {tiers.map((tier) => (
                <span
                  key={tier.id}
                  className={currentTier?.id === tier.id ? 'font-semibold text-foreground' : ''}
                >
                  {tier.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
