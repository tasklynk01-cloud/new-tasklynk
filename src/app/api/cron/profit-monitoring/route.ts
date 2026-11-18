/**
 * Profit Monitoring Cron Job
 * 
 * POST /api/cron/profit-monitoring
 * 
 * Runs periodically to check for low-margin orders and send alerts.
 * Called by Vercel cron every 6 hours.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAndAlertLowMarginOrders, analyzeOrderProfitBatch } from '@/lib/profit-monitoring';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentTimeISO = new Date().toISOString();

  try {
    // Run the profit check and alert system
    const result = await checkAndAlertLowMarginOrders();

    // Get overall summary for the response
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weeklyAnalysis = await analyzeOrderProfitBatch({
      startDate: weekAgo,
      status: ['completed', 'paid', 'delivered', 'approved'],
      limit: 500,
    });

    return NextResponse.json({
      success: true,
      timestamp: currentTimeISO,
      last24Hours: {
        warningOrders: result.warningOrders.length,
        criticalOrders: result.criticalOrders.length,
        lossOrders: result.lossOrders.length,
        alertsSent: result.alertsSent,
      },
      weeklyMetrics: {
        totalOrders: weeklyAnalysis.summary.totalOrders,
        totalRevenue: weeklyAnalysis.summary.totalRevenue,
        totalProfit: weeklyAnalysis.summary.totalProfit,
        averageMarginPercent: weeklyAnalysis.summary.averageMarginPercent,
        healthDistribution: {
          healthy: weeklyAnalysis.summary.healthyOrders,
          warning: weeklyAnalysis.summary.warningOrders,
          critical: weeklyAnalysis.summary.criticalOrders,
          loss: weeklyAnalysis.summary.lossOrders,
        },
      },
    });
  } catch (error) {
    console.error('[Profit Monitoring Cron] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// GET for manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  return POST(mockRequest as NextRequest);
}

