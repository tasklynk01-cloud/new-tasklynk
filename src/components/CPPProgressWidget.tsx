'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Zap } from 'lucide-react';

interface CPPLevel {
  level: number;
  levelName: string;
  description: string;
  completedOrdersRequired: number;
  cppNonTechnical: number;
  cppTechnical: number;
  progressBarColor: string;
}

interface CPPStatus {
  currentLevel: number;
  totalCompletedOrders: number;
  ordersInCurrentLevel: number;
  progressPercentage: number;
  nextLevelOrdersRequired: number;
  currentCPP: number;
  nextLevelCPP: number;
  isWorkTypeSpecialized: boolean;
}

interface CPPProgressData {
  freelancer: { id: number; name: string };
  cppStatus: CPPStatus;
  cppLevels: CPPLevel[];
  currentLevelDetails: CPPLevel | null;
  nextLevelDetails: CPPLevel | null;
}

interface CPPProgressProps {
  freelancerId: number;
}

export default function CPPProgressWidget({ freelancerId }: CPPProgressProps) {
  const [data, setData] = useState<CPPProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCPPData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v2/freelancers/cpp?freelancerId=${freelancerId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch CPP data');
        }

        const cppData = await response.json();
        setData(cppData);
      } catch (err) {
        console.error('Error fetching CPP data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load CPP information');
      } finally {
        setLoading(false);
      }
    };

    fetchCPPData();
  }, [freelancerId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse h-16 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
        <CardContent className="p-4">
          <Alert className="border-red-300 bg-red-100 dark:bg-red-900/30">
            <Zap className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200 text-xs">
              {error || 'Unable to load tier information'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { cppStatus, currentLevelDetails, nextLevelDetails, cppLevels } = data;
  const isMaxLevel = cppStatus.nextLevelOrdersRequired === 0;
  const pct = isMaxLevel ? 100 : Math.min(100, Math.max(0, Math.round(cppStatus.progressPercentage)));
  const activeColor = currentLevelDetails?.progressBarColor || '#10b981';

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <Card className="shadow-sm border rounded-xl">
      <CardHeader className="py-2.5 px-3.5 pb-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            Earnings Tier Progress
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge style={{ backgroundColor: activeColor }} className="text-white text-[10px] px-1.5 py-0">
              {cppStatus.currentLevel} of {cppLevels.length} · {currentLevelDetails?.levelName || 'Starter'}
            </Badge>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              KSh {cppStatus.currentCPP}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3.5 pb-3 pt-1 space-y-2.5">
        <div className="flex items-center gap-3">
          {/* Circular Filling Ring */}
          <div className="relative w-13 h-13 shrink-0 flex items-center justify-center">
            <svg className="w-13 h-13 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-muted/40"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke={activeColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-[11px] font-bold">{pct}%</span>
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
              <span>
                Non-Tech: <strong className="font-semibold">KSh {currentLevelDetails?.cppNonTechnical}</strong>
              </span>
              <span>
                Tech: <strong className="font-semibold">KSh {currentLevelDetails?.cppTechnical}</strong>
              </span>
              <span className="text-muted-foreground">
                Done: <strong className="text-foreground">{cppStatus.totalCompletedOrders}</strong>
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              {isMaxLevel
                ? `Master tier reached! Earning KSh ${cppStatus.currentCPP} per page.`
                : `${cppStatus.nextLevelOrdersRequired} order${cppStatus.nextLevelOrdersRequired === 1 ? '' : 's'} remaining to unlock ${nextLevelDetails?.levelName} (KSh ${nextLevelDetails?.cppNonTechnical} / Tech KSh ${nextLevelDetails?.cppTechnical})`}
            </p>
          </div>
        </div>

        {/* Left-to-right color-segmented bar */}
        <div className="space-y-1">
          <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-muted/40">
            {cppLevels.map((lvl) => {
              const completed = lvl.level < cppStatus.currentLevel;
              const current = lvl.level === cppStatus.currentLevel;
              const segFill = completed ? 100 : current ? pct : 0;
              return (
                <div
                  key={lvl.level}
                  className="flex-1 bg-muted/60 rounded-full overflow-hidden"
                  title={`${lvl.levelName}: ${lvl.completedOrdersRequired}+ orders (KSh ${lvl.cppNonTechnical})`}
                >
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ width: `${segFill}%`, backgroundColor: lvl.progressBarColor || '#10b981' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {cppLevels.map((lvl) => (
              <span
                key={lvl.level}
                className={lvl.level === cppStatus.currentLevel ? 'font-semibold text-foreground' : ''}
              >
                {lvl.levelName}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
