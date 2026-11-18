"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, TrendingUp, Star, DollarSign, Loader2 } from 'lucide-react';

type CPPInfo = {
  freelancer: {
    id: number;
    name: string;
    rating: number | null;
    completedJobs: number;
    badge: string | null;
  };
  cppProgress: {
    currentLevel: number;
    totalCompletedOrders: number;
    ordersInCurrentLevel: number;
    progressPercentage: number;
    nextLevelOrdersRequired: number;
    currentLevelName: string;
    currentLevelDescription: string;
    nextLevelName: string | null;
    ordersToNextLevel: number | null;
  };
  cppRates: {
    nonTechnical: number;
    technical: number;
  };
  writerTier: {
    id: number;
    name: string;
    minRating: number;
    minJobs: number;
    minSuccessRate: number;
    benefits: string[];
    color: string;
    icon: string;
  } | null;
  nextTier: {
    name: string;
    minRating: number;
    minJobs: number;
    benefits: string[];
  } | null;
};

type FreelancerCPPDisplayProps = {
  freelancerId: number;
  compact?: boolean;
  showTier?: boolean;
  showRates?: boolean;
};

export function FreelancerCPPDisplay({ 
  freelancerId, 
  compact = false,
  showTier = true,
  showRates = true 
}: FreelancerCPPDisplayProps) {
  const [info, setInfo] = useState<CPPInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await fetch(`/api/v2/freelancer/cpp-info?freelancerId=${freelancerId}`);
        if (response.ok) {
          const data = await response.json();
          setInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch CPP info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [freelancerId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!info) {
    return <Badge variant="outline" className="text-xs">No CPP data</Badge>;
  }

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-gray-500',
      2: 'bg-blue-500',
      3: 'bg-green-500',
      4: 'bg-purple-500',
      5: 'bg-amber-500',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {/* CPP Level Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                className={`text-xs cursor-help ${getLevelColor(info.cppProgress.currentLevel)} text-primary-foreground`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                L{info.cppProgress.currentLevel}: {info.cppProgress.currentLevelName}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <div className="font-semibold">CPP Level {info.cppProgress.currentLevel}</div>
                <div className="text-xs">{info.cppProgress.currentLevelDescription}</div>
                {showRates && (
                  <div className="text-xs space-y-1 pt-1 border-t">
                    <div className="flex justify-between">
                      <span>Standard Rate:</span>
                      <span className="font-semibold">KSh {info.cppRates.nonTechnical}/page</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Technical Rate:</span>
                      <span className="font-semibold">KSh {info.cppRates.technical}/page</span>
                    </div>
                  </div>
                )}
                {info.cppProgress.nextLevelName && (
                  <div className="text-xs pt-1 border-t">
                    <span className="text-muted-foreground">
                      {info.cppProgress.ordersToNextLevel} orders to {info.cppProgress.nextLevelName}
                    </span>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Writer Tier Badge */}
          {showTier && info.writerTier && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  className="text-xs cursor-help"
                  style={{ backgroundColor: info.writerTier.color }}
                >
                  {info.writerTier.icon} {info.writerTier.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <div className="font-semibold">{info.writerTier.icon} {info.writerTier.name} Tier</div>
                  {info.writerTier.benefits.length > 0 && (
                    <ul className="text-xs space-y-1">
                      {info.writerTier.benefits.slice(0, 3).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-green-500">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {info.nextTier && (
                    <div className="text-xs pt-1 border-t text-muted-foreground">
                      Next: {info.nextTier.name} (requires {info.nextTier.minJobs} jobs, {info.nextTier.minRating} rating)
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Rates Badge */}
          {showRates && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs cursor-help">
                  <DollarSign className="h-3 w-3 mr-0.5" />
                  {info.cppRates.nonTechnical}/pg
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Standard: KSh {info.cppRates.nonTechnical}/page</div>
                  <div>Technical: KSh {info.cppRates.technical}/page</div>
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
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-3">
            <Award className="h-5 w-5 text-primary" />
            CPP Level & Tier Info
          </CardTitle>
          {info.writerTier && (
            <Badge 
              className="text-sm"
              style={{ backgroundColor: info.writerTier.color }}
            >
              {info.writerTier.icon} {info.writerTier.name}
            </Badge>
          )}
        </div>
        <CardDescription>
          Freelancer progression and earnings info
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CPP Level Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${getLevelColor(info.cppProgress.currentLevel)} text-primary-foreground`}>
                Level {info.cppProgress.currentLevel}
              </Badge>
              <span className="font-medium">{info.cppProgress.currentLevelName}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {info.cppProgress.totalCompletedOrders} orders completed
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {info.cppProgress.currentLevelDescription}
          </p>
          
          {info.cppProgress.nextLevelName && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to {info.cppProgress.nextLevelName}</span>
                <span>{info.cppProgress.ordersToNextLevel} orders remaining</span>
              </div>
              <Progress value={info.cppProgress.progressPercentage} className="h-2" />
            </div>
          )}
        </div>

        {/* Rates Section */}
        {showRates && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Standard Work</p>
              <p className="text-xl font-bold text-green-600">KSh {info.cppRates.nonTechnical}</p>
              <p className="text-xs text-muted-foreground">per page</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Technical Work</p>
              <p className="text-xl font-bold text-blue-600">KSh {info.cppRates.technical}</p>
              <p className="text-xs text-muted-foreground">per page</p>
            </div>
          </div>
        )}

        {/* Tier Benefits */}
        {showTier && info.writerTier && info.writerTier.benefits.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" />
              {info.writerTier.name} Tier Benefits
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {info.writerTier.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Tier Progress */}
        {showTier && info.nextTier && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Next Tier:</strong> {info.nextTier.name} 
              (requires {info.nextTier.minJobs} jobs & {info.nextTier.minRating} rating)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
