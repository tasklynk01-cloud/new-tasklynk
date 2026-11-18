/**
 * Profit Monitoring & Analytics
 * 
 * Computes margin per order and emits notifications when below thresholds.
 * Part of Phase 7 automation.
 */

import { db } from '@/db';
import { jobs, users, notifications, systemSettings } from '@/db/schema';
import { eq, and, gte, lte, sql, desc, inArray } from 'drizzle-orm';

// Default profit thresholds (can be overridden via systemSettings)
const DEFAULT_THRESHOLDS = {
  MIN_MARGIN_PERCENT: 15, // Alert if margin drops below 15%
  MIN_PROFIT_AMOUNT: 50, // Alert if absolute profit drops below KSh 50
  CRITICAL_MARGIN_PERCENT: 5, // Critical alert if margin drops below 5%
} as const;

export interface OrderProfitAnalysis {
  orderId: number;
  displayId: string | null;
  title: string;
  clientAmount: number;
  freelancerEarnings: number;
  managerEarnings: number;
  adminProfit: number;
  marginPercent: number;
  status: 'healthy' | 'warning' | 'critical' | 'loss';
  breakdown: {
    grossRevenue: number;
    totalCosts: number;
    netProfit: number;
  };
}

export interface ProfitSummary {
  totalOrders: number;
  totalRevenue: number;
  totalFreelancerCosts: number;
  totalManagerCosts: number;
  totalProfit: number;
  averageMarginPercent: number;
  healthyOrders: number;
  warningOrders: number;
  criticalOrders: number;
  lossOrders: number;
}

/**
 * Get profit thresholds from system settings or use defaults
 */
export async function getProfitThresholds(): Promise<typeof DEFAULT_THRESHOLDS> {
  try {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'profit_thresholds'))
      .limit(1);

    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      return {
        MIN_MARGIN_PERCENT: parsed.minMarginPercent ?? DEFAULT_THRESHOLDS.MIN_MARGIN_PERCENT,
        MIN_PROFIT_AMOUNT: parsed.minProfitAmount ?? DEFAULT_THRESHOLDS.MIN_PROFIT_AMOUNT,
        CRITICAL_MARGIN_PERCENT: parsed.criticalMarginPercent ?? DEFAULT_THRESHOLDS.CRITICAL_MARGIN_PERCENT,
      };
    }
  } catch (err) {
    console.warn('[Profit Monitor] Could not load thresholds from settings, using defaults:', err);
  }
  return DEFAULT_THRESHOLDS;
}

/**
 * Calculate margin percentage for an order
 */
export function calculateMarginPercent(clientAmount: number, adminProfit: number): number {
  if (clientAmount <= 0) return 0;
  return Math.round((adminProfit / clientAmount) * 10000) / 100; // Round to 2 decimal places
}

/**
 * Determine profit status based on thresholds
 */
export function getProfitStatus(
  marginPercent: number,
  adminProfit: number,
  thresholds: typeof DEFAULT_THRESHOLDS
): 'healthy' | 'warning' | 'critical' | 'loss' {
  if (adminProfit < 0) return 'loss';
  if (marginPercent < thresholds.CRITICAL_MARGIN_PERCENT) return 'critical';
  if (marginPercent < thresholds.MIN_MARGIN_PERCENT || adminProfit < thresholds.MIN_PROFIT_AMOUNT) return 'warning';
  return 'healthy';
}

/**
 * Analyze profit for a single order
 */
export async function analyzeOrderProfit(orderId: number): Promise<OrderProfitAnalysis | null> {
  const [order] = await db
    .select({
      id: jobs.id,
      displayId: jobs.displayId,
      title: jobs.title,
      amount: jobs.amount,
      freelancerEarnings: jobs.freelancerEarnings,
      managerEarnings: jobs.managerEarnings,
      adminProfit: jobs.adminProfit,
    })
    .from(jobs)
    .where(eq(jobs.id, orderId))
    .limit(1);

  if (!order) return null;

  const thresholds = await getProfitThresholds();
  const clientAmount = Number(order.amount || 0);
  const freelancerEarnings = Number(order.freelancerEarnings || 0);
  const managerEarnings = Number(order.managerEarnings || 0);
  
  // Recalculate admin profit to ensure accuracy
  const calculatedProfit = clientAmount - freelancerEarnings - managerEarnings;
  const adminProfit = Number(order.adminProfit || calculatedProfit);
  const marginPercent = calculateMarginPercent(clientAmount, adminProfit);

  return {
    orderId: order.id,
    displayId: order.displayId,
    title: order.title,
    clientAmount,
    freelancerEarnings,
    managerEarnings,
    adminProfit,
    marginPercent,
    status: getProfitStatus(marginPercent, adminProfit, thresholds),
    breakdown: {
      grossRevenue: clientAmount,
      totalCosts: freelancerEarnings + managerEarnings,
      netProfit: adminProfit,
    },
  };
}

/**
 * Analyze profit for orders in a date range
 */
export async function analyzeOrderProfitBatch(params: {
  startDate?: string;
  endDate?: string;
  status?: string[];
  limit?: number;
}): Promise<{
  orders: OrderProfitAnalysis[];
  summary: ProfitSummary;
}> {
  const { startDate, endDate, status, limit = 100 } = params;
  const thresholds = await getProfitThresholds();

  // Build query conditions
  const conditions = [];
  if (startDate) {
    conditions.push(gte(jobs.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(jobs.createdAt, endDate));
  }
  if (status && status.length > 0) {
    conditions.push(inArray(jobs.status, status));
  }

  const ordersQuery = db
    .select({
      id: jobs.id,
      displayId: jobs.displayId,
      title: jobs.title,
      amount: jobs.amount,
      freelancerEarnings: jobs.freelancerEarnings,
      managerEarnings: jobs.managerEarnings,
      adminProfit: jobs.adminProfit,
    })
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(limit);

  const rawOrders = conditions.length > 0
    ? await ordersQuery.where(and(...conditions))
    : await ordersQuery;

  const orders: OrderProfitAnalysis[] = [];
  let totalRevenue = 0;
  let totalFreelancerCosts = 0;
  let totalManagerCosts = 0;
  let totalProfit = 0;
  let healthyOrders = 0;
  let warningOrders = 0;
  let criticalOrders = 0;
  let lossOrders = 0;

  for (const order of rawOrders) {
    const clientAmount = Number(order.amount || 0);
    const freelancerEarnings = Number(order.freelancerEarnings || 0);
    const managerEarnings = Number(order.managerEarnings || 0);
    const calculatedProfit = clientAmount - freelancerEarnings - managerEarnings;
    const adminProfit = Number(order.adminProfit || calculatedProfit);
    const marginPercent = calculateMarginPercent(clientAmount, adminProfit);
    const status = getProfitStatus(marginPercent, adminProfit, thresholds);

    totalRevenue += clientAmount;
    totalFreelancerCosts += freelancerEarnings;
    totalManagerCosts += managerEarnings;
    totalProfit += adminProfit;

    switch (status) {
      case 'healthy':
        healthyOrders++;
        break;
      case 'warning':
        warningOrders++;
        break;
      case 'critical':
        criticalOrders++;
        break;
      case 'loss':
        lossOrders++;
        break;
    }

    orders.push({
      orderId: order.id,
      displayId: order.displayId,
      title: order.title,
      clientAmount,
      freelancerEarnings,
      managerEarnings,
      adminProfit,
      marginPercent,
      status,
      breakdown: {
        grossRevenue: clientAmount,
        totalCosts: freelancerEarnings + managerEarnings,
        netProfit: adminProfit,
      },
    });
  }

  const averageMarginPercent = totalRevenue > 0
    ? Math.round((totalProfit / totalRevenue) * 10000) / 100
    : 0;

  return {
    orders,
    summary: {
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalFreelancerCosts: Math.round(totalFreelancerCosts * 100) / 100,
      totalManagerCosts: Math.round(totalManagerCosts * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      averageMarginPercent,
      healthyOrders,
      warningOrders,
      criticalOrders,
      lossOrders,
    },
  };
}

/**
 * Send profit alert notifications to admins
 */
export async function sendProfitAlerts(params: {
  orders: OrderProfitAnalysis[];
  alertType: 'warning' | 'critical' | 'loss';
}): Promise<{ sent: number; failed: number }> {
  const { orders, alertType } = params;
  const currentTimeISO = new Date().toISOString();

  // Get admin users
  const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));

  let sent = 0;
  let failed = 0;

  const alertConfig = {
    warning: {
      title: 'Low Margin Alert',
      type: 'profit_warning' as const,
    },
    critical: {
      title: 'Critical Margin Alert',
      type: 'profit_critical' as const,
    },
    loss: {
      title: 'Loss Order Alert',
      type: 'profit_loss' as const,
    },
  };

  const config = alertConfig[alertType];

  for (const admin of adminUsers) {
    for (const order of orders) {
      try {
        await db.insert(notifications).values({
          userId: admin.id,
          jobId: order.orderId,
          type: config.type,
          title: config.title,
          message: `Order ${order.displayId || `#${order.orderId}`}: ${order.marginPercent}% margin (KSh ${order.adminProfit} profit on KSh ${order.clientAmount} revenue)`,
          read: false,
          createdAt: currentTimeISO,
        });
        sent++;
      } catch (err) {
        console.error(`[Profit Monitor] Failed to send alert for order ${order.orderId} to admin ${admin.id}:`, err);
        failed++;
      }
    }
  }

  return { sent, failed };
}

/**
 * Check and alert on low-margin orders (designed to be called periodically)
 * Returns orders that triggered alerts
 */
export async function checkAndAlertLowMarginOrders(): Promise<{
  warningOrders: OrderProfitAnalysis[];
  criticalOrders: OrderProfitAnalysis[];
  lossOrders: OrderProfitAnalysis[];
  alertsSent: number;
}> {
  // Check orders from the last 24 hours that haven't been alerted yet
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const result = await analyzeOrderProfitBatch({
    startDate: oneDayAgo,
    status: ['completed', 'paid', 'delivered', 'approved'],
    limit: 200,
  });

  const warningOrders = result.orders.filter((o) => o.status === 'warning');
  const criticalOrders = result.orders.filter((o) => o.status === 'critical');
  const lossOrders = result.orders.filter((o) => o.status === 'loss');

  let alertsSent = 0;

  // Send alerts for critical and loss orders (most important)
  if (lossOrders.length > 0) {
    const { sent } = await sendProfitAlerts({ orders: lossOrders, alertType: 'loss' });
    alertsSent += sent;
  }

  if (criticalOrders.length > 0) {
    const { sent } = await sendProfitAlerts({ orders: criticalOrders, alertType: 'critical' });
    alertsSent += sent;
  }

  // Only alert on warning orders if there are 3+ (avoid noise)
  if (warningOrders.length >= 3) {
    const { sent } = await sendProfitAlerts({ orders: warningOrders.slice(0, 5), alertType: 'warning' });
    alertsSent += sent;
  }

  return {
    warningOrders,
    criticalOrders,
    lossOrders,
    alertsSent,
  };
}

