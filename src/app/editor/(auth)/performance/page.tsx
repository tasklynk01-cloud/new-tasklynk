"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context-v2";
import { TrendingUp, TrendingDown, Award, Target, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface PerformanceMetrics {
  totalReviewed: number;
  approvalRate: number;
  revisionRate: number;
  avgTurnaroundTime: number;
  currentStreak: number;
  qualityScore: number;
  weekOverWeek: number;
  monthOverMonth: number;
  fastestReview: number;
  slowestReview: number;
  avgReviewsPerDay: number;
}

export default function EditorPerformancePage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetchPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch(`/api/v2/editor/analytics?range=${timeRange}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to fetch performance data');
        toast.error('Failed to load performance data');
        // Set default metrics
        setMetrics({
          totalReviewed: 0,
          approvalRate: 0,
          revisionRate: 0,
          avgTurnaroundTime: 0,
          currentStreak: 0,
          qualityScore: 0,
          weekOverWeek: 0,
          monthOverMonth: 0,
          fastestReview: 0,
          slowestReview: 0,
          avgReviewsPerDay: 0,
        });
        setLoading(false);
        return;
      }

      const data = await response.json();
      const analytics = data.analytics || {};
      const overview = analytics.overview || {};
      const performance = analytics.performance || {};

      setMetrics({
        totalReviewed: overview.totalReviewed || 0,
        approvalRate: overview.approvalRate || 0,
        revisionRate: overview.revisionRate || 0,
        avgTurnaroundTime: overview.avgTurnaroundTime || 0,
        currentStreak: overview.currentStreak || 0,
        qualityScore: overview.qualityScore || 0,
        weekOverWeek: performance.weekOverWeek || 0,
        monthOverMonth: performance.monthOverMonth || 0,
        fastestReview: performance.fastestReview || 0,
        slowestReview: performance.slowestReview || 0,
        avgReviewsPerDay: performance.avgReviewsPerDay || 0,
      });
    } catch (error) {
      console.error('Error fetching performance:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8c42]"></div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-blue-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-600 mt-1">Track your editing performance and quality metrics</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-3">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-[#ff8c42] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Last {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Quality Score Card */}
        <Card className="mb-6 border-2 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Overall Quality Score</h2>
                <p className="text-sm text-gray-500">Composite metric of your performance</p>
              </div>
              <Award className="h-12 w-12 text-[#ff8c42]" />
            </div>
            <div className="flex items-end gap-4">
              <div className={`text-6xl font-bold ${getScoreColor(metrics.qualityScore)}`}>
                {metrics.qualityScore.toFixed(0)}
              </div>
              <div className="text-2xl text-gray-400 mb-2">/100</div>
            </div>
            <Progress value={metrics.qualityScore} className="mt-4 h-3" />
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Approval Rate</p>
                <p className="font-semibold text-gray-900">{metrics.approvalRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-600">Avg Turnaround</p>
                <p className="font-semibold text-gray-900">{metrics.avgTurnaroundTime.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-gray-600">Total Reviewed</p>
                <p className="font-semibold text-gray-900">{metrics.totalReviewed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Approval Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {metrics.approvalRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(metrics.weekOverWeek)}
                <span className={metrics.weekOverWeek > 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(metrics.weekOverWeek).toFixed(1)}% vs last period
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Revision Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                <XCircle className="h-4 w-4 text-orange-500" />
                Revision Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {metrics.revisionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">
                {metrics.revisionRate <= 15 ? 'Excellent!' : metrics.revisionRate <= 25 ? 'Good' : 'Needs improvement'}
              </p>
            </CardContent>
          </Card>

          {/* Avg Turnaround */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-500" />
                Avg Turnaround
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {metrics.avgTurnaroundTime.toFixed(1)}h
              </div>
              <p className="text-xs text-gray-500">
                Fastest: {metrics.fastestReview}h | Slowest: {metrics.slowestReview}h
              </p>
            </CardContent>
          </Card>

          {/* Current Streak */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                <Target className="h-4 w-4 text-purple-500" />
                Active Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {metrics.currentStreak}
              </div>
              <p className="text-xs text-gray-500">consecutive active days</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Productivity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-[#ff8c42]" />
                Productivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Reviewed</span>
                <Badge variant="outline" className="text-lg font-semibold">
                  {metrics.totalReviewed}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Reviews/Day</span>
                <Badge variant="outline" className="text-lg font-semibold">
                  {metrics.avgReviewsPerDay.toFixed(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Month over Month</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metrics.monthOverMonth)}
                  <span className={`text-sm font-semibold ${
                    metrics.monthOverMonth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(metrics.monthOverMonth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target className="h-5 w-5 text-[#ff8c42]" />
                Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <span className={`text-lg font-semibold ${getScoreColor(metrics.qualityScore)}`}>
                    {metrics.qualityScore.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={metrics.qualityScore} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Approval Rate</span>
                  <span className="text-lg font-semibold text-green-600">
                    {metrics.approvalRate.toFixed(0)}%
                  </span>
                </div>
                <Progress value={metrics.approvalRate} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Efficiency</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {(100 - (metrics.avgTurnaroundTime / 48 * 100)).toFixed(0)}%
                  </span>
                </div>
                <Progress value={100 - (metrics.avgTurnaroundTime / 48 * 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
