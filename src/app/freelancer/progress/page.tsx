'use client';
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from 'react';
import { useDashboardProtection, DashboardLoader } from '@/lib/useDashboardProtection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Award,
  Target,
  Zap,
  Star,
  CheckCircle,
  Lock,
  ArrowRight,
  DollarSign,
  FileText,
  Clock,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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

// Tier benefits data
const TIER_BENEFITS: Record<string, string[]> = {
  'Starter': [
    'Access to all standard orders',
    'Basic earnings rate',
    'Standard support',
  ],
  'Rising': [
    'Higher CPP rate (+KSh 10)',
    'Early access to new orders',
    'Priority queue consideration',
  ],
  'Established': [
    'Premium CPP rate (+KSh 20)',
    'Access to priority orders',
    'Extended deadline flexibility',
    'Dedicated support channel',
  ],
  'Expert': [
    'Expert CPP rate (+KSh 30)',
    'First access to premium orders',
    'Order preference settings',
    'Monthly bonus eligibility',
    'VIP support',
  ],
  'Master': [
    'Maximum CPP rate (+KSh 50)',
    'Exclusive premium orders',
    'Custom work preferences',
    'Quarterly performance bonus',
    'Direct admin communication',
    'Profile badge & recognition',
  ],
};

export default function CPPProgressPage() {
  const { user, loading } = useDashboardProtection('freelancer');
  const [data, setData] = useState<CPPProgressData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCPPData = async () => {
      if (!user) return;

      try {
        setLoadingData(true);
        setError(null);

        const response = await safeApiFetch(`/api/v2/freelancers/cpp?freelancerId=${user.id}`, {
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
        setLoadingData(false);
      }
    };

    if (!loading && user) {
      fetchCPPData();
    }
  }, [user, loading]);

  if (loading || !user) {
    return <DashboardLoader />;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings Tier Progress</h1>
          <p className="text-muted-foreground mt-1">Track your CPP level and progression</p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Unable to load tier information'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { cppStatus, currentLevelDetails, nextLevelDetails, cppLevels } = data;
  const isMaxLevel = cppStatus.nextLevelOrdersRequired === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings Tier Progress</h1>
          <p className="text-muted-foreground mt-1">
            Track your CPP level and unlock higher earnings
          </p>
        </div>
        <Link href="/freelancer/earnings">
          <Button variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            View Earnings
          </Button>
        </Link>
      </div>

      {/* Current Tier Hero Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10">
          <Trophy className="h-48 w-48 -mr-12 -mt-12" />
        </div>
        <CardContent className="pt-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: currentLevelDetails?.progressBarColor || '#10b981' }}
                >
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Current Tier</p>
                  <h2 className="text-3xl font-bold">{currentLevelDetails?.levelName || 'Starter'}</h2>
                </div>
              </div>
              <p className="text-blue-100 max-w-md">
                {currentLevelDetails?.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <p className="text-blue-200 text-xs mb-1">Non-Technical</p>
                <p className="text-2xl font-bold">KSh {currentLevelDetails?.cppNonTechnical}</p>
                <p className="text-blue-200 text-xs">per page</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <p className="text-blue-200 text-xs mb-1">Technical</p>
                <p className="text-2xl font-bold">KSh {currentLevelDetails?.cppTechnical}</p>
                <p className="text-blue-200 text-xs">per page</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cppStatus.totalCompletedOrders}</div>
            <p className="text-xs text-muted-foreground">Lifetime total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current CPP</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KSh {cppStatus.currentCPP}</div>
            <p className="text-xs text-muted-foreground">Active rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Level</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cppStatus.currentLevel} / {cppLevels.length}</div>
            <p className="text-xs text-muted-foreground">
              {isMaxLevel ? 'Maximum reached!' : `${cppStatus.nextLevelOrdersRequired} to next`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(cppStatus.progressPercentage)}%</div>
            <Progress value={cppStatus.progressPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Tier */}
      {!isMaxLevel && nextLevelDetails && (
        <Card className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-indigo-600" />
              Progress to {nextLevelDetails.levelName}
            </CardTitle>
            <CardDescription>
              Complete {cppStatus.nextLevelOrdersRequired} more orders to reach the next tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{currentLevelDetails?.levelName}</span>
                <span className="text-muted-foreground">
                  {cppStatus.ordersInCurrentLevel} / {cppStatus.ordersInCurrentLevel + cppStatus.nextLevelOrdersRequired} orders
                </span>
                <span className="font-medium">{nextLevelDetails.levelName}</span>
              </div>
              <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${cppStatus.progressPercentage}%`,
                    backgroundColor: currentLevelDetails?.progressBarColor || '#10b981',
                  }}
                />
              </div>
            </div>

            {/* Next Tier Preview */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3">
                  What you'll unlock:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      CPP increases to <strong>KSh {nextLevelDetails.cppNonTechnical}</strong> (Non-Tech)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">
                      Technical rate: <strong>KSh {nextLevelDetails.cppTechnical}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3">
                  New benefits:
                </p>
                <ul className="space-y-1">
                  {(TIER_BENEFITS[nextLevelDetails.levelName] || []).slice(0, 3).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Tier Celebration */}
      {isMaxLevel && (
        <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200">
                  ?? Congratulations, Master Writer!
                </h3>
                <p className="text-amber-700 dark:text-amber-300">
                  You've reached the highest tier. Enjoy maximum CPP rates on all your work!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tiers Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Award className="h-5 w-5" />
            All Earning Tiers
          </CardTitle>
          <CardDescription>
            Your progression path through all CPP levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cppLevels.map((level, index) => {
              const isCurrentLevel = level.level === cppStatus.currentLevel;
              const isUnlocked = level.level <= cppStatus.currentLevel;
              const benefits = TIER_BENEFITS[level.levelName] || [];

              return (
                <div
                  key={level.level}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isCurrentLevel
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : isUnlocked
                      ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20'
                      : 'border-gray-200 bg-gray-50 dark:bg-gray-900/50 opacity-75'
                  }`}
                >
                  {/* Current indicator */}
                  {isCurrentLevel && (
                    <Badge className="absolute -top-2 -right-2 bg-blue-600">
                      Current
                    </Badge>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Tier Icon & Name */}
                    <div className="flex items-center gap-3 md:w-48">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isUnlocked ? '' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                        style={isUnlocked ? { backgroundColor: level.progressBarColor } : {}}
                      >
                        {isUnlocked ? (
                          <Award className="h-6 w-6 text-white" />
                        ) : (
                          <Lock className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{level.levelName}</p>
                        <p className="text-xs text-muted-foreground">
                          {level.completedOrdersRequired} orders required
                        </p>
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="flex gap-4 md:w-48">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Non-Tech</p>
                        <p className="font-bold text-green-600">KSh {level.cppNonTechnical}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Technical</p>
                        <p className="font-bold text-green-600">KSh {level.cppTechnical}</p>
                      </div>
                    </div>

                    {/* Benefits Preview */}
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Benefits:</p>
                      <div className="flex flex-wrap gap-1">
                        {benefits.slice(0, 3).map((benefit, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {benefit.length > 25 ? benefit.slice(0, 25) + '...' : benefit}
                          </Badge>
                        ))}
                        {benefits.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{benefits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:w-24 text-right">
                      {isCurrentLevel ? (
                        <Badge className="bg-blue-600">Active</Badge>
                      ) : isUnlocked ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Arrow to next level */}
                  {index < cppLevels.length - 1 && (
                    <div className="hidden md:flex absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-white dark:bg-slate-900 rounded-full p-1 border">
                        <ArrowRight className="h-4 w-4 text-gray-400 rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500" />
            Tips to Level Up Faster
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-semibold mb-1">Submit Early</h4>
              <p className="text-sm text-muted-foreground">
                Complete orders before deadlines to maintain good standing and get more assignments.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <Star className="h-8 w-8 text-amber-500 mb-2" />
              <h4 className="font-semibold mb-1">Quality First</h4>
              <p className="text-sm text-muted-foreground">
                High-quality work leads to fewer revisions and faster order completion.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-semibold mb-1">Stay Consistent</h4>
              <p className="text-sm text-muted-foreground">
                Regular activity helps you progress faster through the tiers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
