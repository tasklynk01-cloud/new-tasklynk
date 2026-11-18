/**
 * GET /api/v2/admin/profit-analytics
 * 
 * Returns profit analysis for orders with margin health indicators.
 * Admin-only endpoint for monitoring platform profitability.
 * 
 * Query params:
 * - startDate: ISO date string (optional, defaults to 30 days ago)
 * - endDate: ISO date string (optional, defaults to now)
 * - status: comma-separated order statuses (optional)
 * - limit: max orders to analyze (default 100, max 500)
 * - includeUnhealthy: 'true' to only show warning/critical/loss orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import {
  analyzeOrderProfitBatch,
  analyzeOrderProfit,
  getProfitThresholds,
} from '@/lib/profit-monitoring';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  
  // Parse query parameters
  const startDate = searchParams.get('startDate') || 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();
  const statusParam = searchParams.get('status');
  const status = statusParam ? statusParam.split(',').map(s => s.trim()) : undefined;
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 500);
  const includeUnhealthy = searchParams.get('includeUnhealthy') === 'true';

  // Single order analysis
  const orderIdParam = searchParams.get('orderId');
  if (orderIdParam) {
    const orderId = parseInt(orderIdParam, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 });
    }

    const analysis = await analyzeOrderProfit(orderId);
    if (!analysis) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: analysis,
    });
  }

  try {
    const result = await analyzeOrderProfitBatch({
      startDate,
      endDate,
      status,
      limit,
    });

    // Filter to only unhealthy orders if requested
    let orders = result.orders;
    if (includeUnhealthy) {
      orders = orders.filter(o => o.status !== 'healthy');
    }

    const thresholds = await getProfitThresholds();

    return NextResponse.json({
      success: true,
      dateRange: { startDate, endDate },
      thresholds: {
        minMarginPercent: thresholds.MIN_MARGIN_PERCENT,
        minProfitAmount: thresholds.MIN_PROFIT_AMOUNT,
        criticalMarginPercent: thresholds.CRITICAL_MARGIN_PERCENT,
      },
      summary: result.summary,
      orders: orders.map(o => ({
        ...o,
        // Add visual indicators
        healthIndicator: {
          healthy: '🟢',
          warning: '🟡',
          critical: '🔴',
          loss: '⚫',
        }[o.status],
      })),
      meta: {
        totalReturned: orders.length,
        filtered: includeUnhealthy,
        limit,
      },
    });
  } catch (error) {
    console.error('[Admin Profit Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profit analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/admin/profit-analytics
 * 
 * Update profit monitoring thresholds
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireRole(request, ['admin']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { minMarginPercent, minProfitAmount, criticalMarginPercent } = body;

    // Validate inputs
    if (typeof minMarginPercent !== 'number' || minMarginPercent < 0 || minMarginPercent > 100) {
      return NextResponse.json({ error: 'Invalid minMarginPercent (must be 0-100)' }, { status: 400 });
    }
    if (typeof minProfitAmount !== 'number' || minProfitAmount < 0) {
      return NextResponse.json({ error: 'Invalid minProfitAmount (must be >= 0)' }, { status: 400 });
    }
    if (typeof criticalMarginPercent !== 'number' || criticalMarginPercent < 0 || criticalMarginPercent >= minMarginPercent) {
      return NextResponse.json({ error: 'Invalid criticalMarginPercent (must be 0 - minMarginPercent)' }, { status: 400 });
    }

    // Import db and systemSettings here to avoid circular dependency issues
    const { db } = await import('@/db');
    const { systemSettings } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const currentTimeISO = new Date().toISOString();
    const newValue = JSON.stringify({
      minMarginPercent,
      minProfitAmount,
      criticalMarginPercent,
    });

    // Upsert the setting
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'profit_thresholds'))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(systemSettings)
        .set({
          value: newValue,
          updatedAt: currentTimeISO,
        })
        .where(eq(systemSettings.key, 'profit_thresholds'));
    } else {
      await db.insert(systemSettings).values({
        key: 'profit_thresholds',
        value: newValue,
        type: 'string',
        updatedBy: null,
        createdAt: currentTimeISO,
        updatedAt: currentTimeISO,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profit thresholds updated',
      thresholds: {
        minMarginPercent,
        minProfitAmount,
        criticalMarginPercent,
      },
    });
  } catch (error) {
    console.error('[Admin Profit Analytics] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update thresholds' },
      { status: 500 }
    );
  }
}

