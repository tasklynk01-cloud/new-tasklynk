"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, BarChart3, Clock, CheckCircle, XCircle,
  Calendar, Award, Target, RefreshCw, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalReviewed: number;
    approvalRate: number;
    revisionRate: number;
    avgTurnaroundTime: number;
    currentStreak: number;
    qualityScore: number;
  };
  timeSeries: Array<{
    date: string;
    approved: number;
    revised: number;
    turnaroundHours: number;
  }>;
  byCategory: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  performance: {
    weekOverWeek: number;
    monthOverMonth: number;
    fastestReview: number;
    slowestReview: number;
    avgReviewsPerDay: number;
  };
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function EditorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch(`/api/v2/editor/analytics?range=${dateRange}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <BarChart3 className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Performance</h1>
            <p className="text-gray-600">Track your editing metrics and performance trends</p>
          </div>
          <div className="flex gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c42] focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-[#ff8c42] hover:bg-[#e67a32] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-3"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">Total Reviewed</p>
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalReviewed}</p>
            <div className="mt-2 flex items-center gap-1">
              {getTrendIcon(analytics.performance.weekOverWeek)}
              <span className={`text-xs font-medium ${getTrendColor(analytics.performance.weekOverWeek)}`}>
                {Math.abs(analytics.performance.weekOverWeek)}% vs last period
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">Approval Rate</p>
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{analytics.overview.approvalRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.overview.approvalRate >= 85 ? 'Excellent!' : analytics.overview.approvalRate >= 70 ? 'Good' : 'Needs improvement'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">Revision Rate</p>
              <XCircle className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{analytics.overview.revisionRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.overview.revisionRate <= 15 ? 'Low - Great!' : analytics.overview.revisionRate <= 30 ? 'Normal' : 'High'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">Avg Turnaround</p>
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics.overview.avgTurnaroundTime.toFixed(1)}h</p>
            <p className="text-xs text-gray-500 mt-2">
              Fastest: {analytics.performance.fastestReview}h
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">Current Streak</p>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{analytics.overview.currentStreak}</p>
            <p className="text-xs text-gray-500 mt-2">days active</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">Quality Score</p>
              <TrendingUp className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">{analytics.overview.qualityScore.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-2">out of 100</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Review Activity Timeline */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Review Activity Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Approved"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revised" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Revised"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Turnaround Time Trend */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Turnaround Time Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="square"
                />
                <Bar 
                  dataKey="turnaroundHours" 
                  fill="#8b5cf6" 
                  name="Hours"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Review Categories & Performance Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Review Categories Distribution */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Review Outcomes Distribution</h2>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.byCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Week over Week Growth</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {analytics.performance.weekOverWeek > 0 ? '+' : ''}{analytics.performance.weekOverWeek.toFixed(1)}%
                  </p>
                </div>
                {analytics.performance.weekOverWeek > 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Month over Month Growth</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {analytics.performance.monthOverMonth > 0 ? '+' : ''}{analytics.performance.monthOverMonth.toFixed(1)}%
                  </p>
                </div>
                {analytics.performance.monthOverMonth > 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Average Reviews Per Day</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {analytics.performance.avgReviewsPerDay.toFixed(1)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-medium mb-1">Fastest Review</p>
                  <p className="text-lg font-bold text-green-900">{analytics.performance.fastestReview}h</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 font-medium mb-1">Slowest Review</p>
                  <p className="text-lg font-bold text-orange-900">{analytics.performance.slowestReview}h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-6 bg-gradient-to-r from-[#ff8c42] to-[#e67a32] p-6 rounded-lg shadow-sm text-white">
          <h2 className="text-xl font-bold mb-3">Performance Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-2">?? Strength</p>
              <p className="text-sm font-medium">
                {analytics.overview.approvalRate >= 85 
                  ? 'Excellent approval rate - keep up the great work!' 
                  : analytics.overview.avgTurnaroundTime < 24 
                  ? 'Fast turnaround times - very efficient!' 
                  : 'Consistent review streak maintained'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-2">?? Focus Area</p>
              <p className="text-sm font-medium">
                {analytics.overview.revisionRate > 20 
                  ? 'Reduce revision rate by thorough initial reviews' 
                  : analytics.overview.avgTurnaroundTime > 48 
                  ? 'Work on reducing average turnaround time' 
                  : 'Maintain quality standards consistently'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm opacity-90 mb-2">?? Next Goal</p>
              <p className="text-sm font-medium">
                {analytics.overview.qualityScore < 80 
                  ? 'Aim for 80+ quality score' 
                  : analytics.overview.totalReviewed < 50 
                  ? 'Complete 50+ reviews this period' 
                  : 'Achieve 90%+ approval rate'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
