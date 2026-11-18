import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { format, differenceInHours, subDays } from 'date-fns';

/**
 * GET /api/v2/editor/analytics
 * Fetch editor performance analytics
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['editor']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const editorId = authCheck.user.id;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Determine date range
    const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
    const days = daysMap[range as keyof typeof daysMap] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all reviewed orders in date range
    const reviewedOrders = await db
      .select({
        id: jobs.id,
        editorApproved: jobs.editorApproved,
        editorRequestedRevision: jobs.editorRequestedRevision,
        editorAssignedAt: jobs.editorAssignedAt,
        editorCompletedAt: jobs.editorCompletedAt,
        editorApprovedAt: jobs.editorApprovedAt,
      })
      .from(jobs)
      .where(eq(jobs.assignedEditorId, editorId));

    // Filter by date in JS to handle nulls properly
    const filteredOrders = reviewedOrders.filter(o => 
      o.editorAssignedAt && new Date(o.editorAssignedAt) >= new Date(startDate)
    );

    // Calculate metrics
    const totalReviewed = filteredOrders.filter(o => o.editorApproved || o.editorRequestedRevision).length;
    const approvedCount = filteredOrders.filter(o => o.editorApproved).length;
    const revisedCount = filteredOrders.filter(o => o.editorRequestedRevision).length;
    
    const approvalRate = totalReviewed > 0 ? (approvedCount / totalReviewed) * 100 : 0;
    const revisionRate = totalReviewed > 0 ? (revisedCount / totalReviewed) * 100 : 0;

    // Calculate turnaround times
    const turnaroundTimes = filteredOrders
      .filter(o => o.editorAssignedAt && o.editorCompletedAt)
      .map(o => {
        const assigned = new Date(o.editorAssignedAt!);
        const completed = new Date(o.editorCompletedAt!);
        return differenceInHours(completed, assigned);
      });

    const avgTurnaroundTime = turnaroundTimes.length > 0
      ? turnaroundTimes.reduce((sum, time) => sum + time, 0) / turnaroundTimes.length
      : 0;

    const fastestReview = turnaroundTimes.length > 0 ? Math.min(...turnaroundTimes) : 0;
    const slowestReview = turnaroundTimes.length > 0 ? Math.max(...turnaroundTimes) : 0;

    // Calculate current streak (simplified - consecutive days with reviews)
    const last7Days = filteredOrders
      .filter(o => o.editorCompletedAt && new Date(o.editorCompletedAt) >= subDays(new Date(), 7))
      .length;
    const currentStreak = Math.min(last7Days, 7); // Simple streak calculation

    // Calculate quality score (0-100)
    const qualityScore = Math.min(100, 
      (approvalRate * 0.4) + 
      ((100 - revisionRate) * 0.3) + 
      (Math.max(0, 100 - (avgTurnaroundTime / 48) * 100) * 0.3)
    );

    // Generate time series data (daily)
    const timeSeries: Array<{
      date: string;
      approved: number;
      revised: number;
      turnaroundHours: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MM/dd');
      const dayStart = subDays(new Date(), i);
      const dayEnd = subDays(new Date(), i - 1);

      const dayOrders = filteredOrders.filter(o => {
        if (!o.editorCompletedAt) return false;
        const completedDate = new Date(o.editorCompletedAt);
        return completedDate >= dayStart && completedDate < dayEnd;
      });

      const dayApproved = dayOrders.filter(o => o.editorApproved).length;
      const dayRevised = dayOrders.filter(o => o.editorRequestedRevision).length;
      
      const dayTurnarounds = dayOrders
        .filter(o => o.editorAssignedAt && o.editorCompletedAt)
        .map(o => differenceInHours(new Date(o.editorCompletedAt!), new Date(o.editorAssignedAt!)));
      
      const avgDayTurnaround = dayTurnarounds.length > 0
        ? dayTurnarounds.reduce((sum, time) => sum + time, 0) / dayTurnarounds.length
        : 0;

      timeSeries.push({
        date,
        approved: dayApproved,
        revised: dayRevised,
        turnaroundHours: avgDayTurnaround,
      });
    }

    // Category distribution
    const byCategory = [
      { name: 'Approved', value: approvedCount, color: '#10b981' },
      { name: 'Revised', value: revisedCount, color: '#f59e0b' },
      { name: 'Pending', value: filteredOrders.length - approvedCount - revisedCount, color: '#6b7280' },
    ];

    // Calculate performance comparisons
    const halfwayPoint = Math.floor(days / 2);
    const recentOrders = filteredOrders.filter(o => {
      if (!o.editorCompletedAt) return false;
      return new Date(o.editorCompletedAt) >= subDays(new Date(), halfwayPoint);
    });
    const olderOrders = filteredOrders.filter(o => {
      if (!o.editorCompletedAt) return false;
      const completedDate = new Date(o.editorCompletedAt);
      return completedDate >= subDays(new Date(), days) && completedDate < subDays(new Date(), halfwayPoint);
    });

    const recentCount = recentOrders.filter(o => o.editorApproved || o.editorRequestedRevision).length;
    const olderCount = olderOrders.filter(o => o.editorApproved || o.editorRequestedRevision).length;
    
    const weekOverWeek = olderCount > 0 
      ? ((recentCount - olderCount) / olderCount) * 100 
      : recentCount > 0 ? 100 : 0;

    // For month-over-month, use similar logic with longer periods
    const quarterPoint = Math.floor(days / 3);
    const latestThird = filteredOrders.filter(o => {
      if (!o.editorCompletedAt) return false;
      return new Date(o.editorCompletedAt) >= subDays(new Date(), quarterPoint);
    }).filter(o => o.editorApproved || o.editorRequestedRevision).length;

    const middleThird = filteredOrders.filter(o => {
      if (!o.editorCompletedAt) return false;
      const completedDate = new Date(o.editorCompletedAt);
      return completedDate >= subDays(new Date(), quarterPoint * 2) && completedDate < subDays(new Date(), quarterPoint);
    }).filter(o => o.editorApproved || o.editorRequestedRevision).length;

    const monthOverMonth = middleThird > 0 
      ? ((latestThird - middleThird) / middleThird) * 100 
      : latestThird > 0 ? 100 : 0;

    const avgReviewsPerDay = totalReviewed / days;

    const analytics = {
      overview: {
        totalReviewed,
        approvalRate,
        revisionRate,
        avgTurnaroundTime,
        currentStreak,
        qualityScore,
      },
      timeSeries,
      byCategory,
      performance: {
        weekOverWeek,
        monthOverMonth,
        fastestReview,
        slowestReview,
        avgReviewsPerDay,
      },
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching editor analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

