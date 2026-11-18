/**
 * Deadline Escalation Cron Job
 * 
 * POST /api/cron/deadline-escalation
 * 
 * Handles escalating overdue orders:
 * - 2h overdue: Notify manager + admin (Level 1)
 * - 6h overdue: Critical alert + suggest reassignment (Level 2)
 * - 24h overdue: Auto-unassign + notify all parties (Level 3)
 * 
 * Called by Vercel cron every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, notifications, emailLogs } from '@/db/schema';
import { eq, and, lt, or, inArray, isNotNull } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

// Escalation thresholds in hours
const ESCALATION_LEVELS = {
  LEVEL_1: 2, // 2 hours overdue
  LEVEL_2: 6, // 6 hours overdue
  LEVEL_3: 24, // 24 hours overdue - auto-unassign
} as const;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

function buildEscalationEmail(params: {
  recipientName: string;
  jobTitle: string;
  displayId?: string | null;
  level: number;
  hoursOverdue: number;
  freelancerName?: string;
  action?: string;
}) {
  const { recipientName, jobTitle, displayId, level, hoursOverdue, freelancerName, action } = params;
  const ref = displayId ? ` (${displayId})` : '';
  
  const levelColors = {
    1: '#f59e0b', // Warning yellow
    2: '#ef4444', // Critical red
    3: '#dc2626', // Emergency dark red
  };
  
  const levelLabels = {
    1: 'WARNING',
    2: 'CRITICAL',
    3: 'EMERGENCY',
  };

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111;">
      <div style="background-color: ${levelColors[level as keyof typeof levelColors]}; color: white; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
        <strong>${levelLabels[level as keyof typeof levelLabels]}: Order Overdue</strong>
      </div>
      <p>Hi ${recipientName || 'there'},</p>
      <p>Order <strong>${jobTitle}${ref}</strong> is <strong>${Math.round(hoursOverdue)} hours overdue</strong>.</p>
      ${freelancerName ? `<p>Assigned to: <strong>${freelancerName}</strong></p>` : ''}
      ${action ? `<p style="background: #fef3c7; padding: 12px; border-radius: 4px;"><strong>Action taken:</strong> ${action}</p>` : ''}
      <p style="margin-top: 16px; color: #555; font-size: 14px;">
        Escalation Level ${level} of 3. ${level === 3 ? 'Auto-unassignment triggered.' : 'Immediate attention required.'}
      </p>
    </div>
  `;
}

async function notifyParties(params: {
  job: typeof jobs.$inferSelect;
  level: number;
  hoursOverdue: number;
  adminUsers: typeof users.$inferSelect[];
  freelancer?: typeof users.$inferSelect | null;
  manager?: typeof users.$inferSelect | null;
  action?: string;
  currentTimeISO: string;
}) {
  const { job, level, hoursOverdue, adminUsers, freelancer, manager, action, currentTimeISO } = params;
  const results = { emailsSent: 0, emailsFailed: 0, notificationsSent: 0 };

  // Notify admins
  for (const admin of adminUsers) {
    try {
      const subject = `[Level ${level}] Order ${job.displayId || `#${job.id}`} - ${Math.round(hoursOverdue)}h Overdue`;
      const html = buildEscalationEmail({
        recipientName: admin.name,
        jobTitle: job.title,
        displayId: job.displayId,
        level,
        hoursOverdue,
        freelancerName: freelancer?.name,
        action,
      });

      await sendEmail({ to: admin.email, subject, html, category: 'escalation' });
      results.emailsSent++;

      await db.insert(notifications).values({
        userId: admin.id,
        jobId: job.id,
        type: level === 3 ? 'order_reassigned' : 'deadline_escalation',
        title: `Overdue Order - Level ${level}`,
        message: `Order ${job.displayId || `#${job.id}`} is ${Math.round(hoursOverdue)}h overdue. ${action || ''}`.trim(),
        read: false,
        createdAt: currentTimeISO,
      });
      results.notificationsSent++;
    } catch (err) {
      console.error(`[Escalation] Failed to notify admin ${admin.email}:`, err);
      results.emailsFailed++;
    }
  }

  // Notify freelancer (Level 1 and 2 only - they're unassigned at Level 3)
  if (freelancer && level < 3) {
    try {
      const subject = `[URGENT] Order ${job.displayId || `#${job.id}`} is Overdue`;
      const html = buildEscalationEmail({
        recipientName: freelancer.name,
        jobTitle: job.title,
        displayId: job.displayId,
        level,
        hoursOverdue,
      });

      await sendEmail({ to: freelancer.email, subject, html, category: 'escalation' });
      results.emailsSent++;

      await db.insert(notifications).values({
        userId: freelancer.id,
        jobId: job.id,
        type: 'deadline_warning',
        title: 'Order Overdue',
        message: `Order ${job.displayId || `#${job.id}`} is ${Math.round(hoursOverdue)}h past deadline. Please submit immediately or contact admin.`,
        read: false,
        createdAt: currentTimeISO,
      });
      results.notificationsSent++;
    } catch (err) {
      console.error(`[Escalation] Failed to notify freelancer ${freelancer.email}:`, err);
      results.emailsFailed++;
    }
  }

  // Notify freelancer of unassignment (Level 3)
  if (freelancer && level === 3) {
    try {
      const subject = `Order ${job.displayId || `#${job.id}`} Reassigned`;
      const html = buildEscalationEmail({
        recipientName: freelancer.name,
        jobTitle: job.title,
        displayId: job.displayId,
        level,
        hoursOverdue,
        action: 'You have been unassigned from this order due to missed deadline.',
      });

      await sendEmail({ to: freelancer.email, subject, html, category: 'escalation' });
      results.emailsSent++;

      await db.insert(notifications).values({
        userId: freelancer.id,
        jobId: job.id,
        type: 'order_unassigned',
        title: 'Order Unassigned',
        message: `You have been unassigned from order ${job.displayId || `#${job.id}`} due to being ${Math.round(hoursOverdue)}h past deadline.`,
        read: false,
        createdAt: currentTimeISO,
      });
      results.notificationsSent++;
    } catch (err) {
      console.error(`[Escalation] Failed to notify unassigned freelancer ${freelancer.email}:`, err);
      results.emailsFailed++;
    }
  }

  // Notify manager if they assigned this order
  if (manager && manager.id !== freelancer?.id) {
    try {
      const subject = `[Escalation] Order ${job.displayId || `#${job.id}`} - ${Math.round(hoursOverdue)}h Overdue`;
      const html = buildEscalationEmail({
        recipientName: manager.name,
        jobTitle: job.title,
        displayId: job.displayId,
        level,
        hoursOverdue,
        freelancerName: freelancer?.name,
        action,
      });

      await sendEmail({ to: manager.email, subject, html, category: 'escalation' });
      results.emailsSent++;

      await db.insert(notifications).values({
        userId: manager.id,
        jobId: job.id,
        type: level === 3 ? 'order_reassigned' : 'deadline_escalation',
        title: `Managed Order Overdue - Level ${level}`,
        message: `Order ${job.displayId || `#${job.id}`} you assigned is ${Math.round(hoursOverdue)}h overdue. ${action || ''}`.trim(),
        read: false,
        createdAt: currentTimeISO,
      });
      results.notificationsSent++;
    } catch (err) {
      console.error(`[Escalation] Failed to notify manager ${manager.email}:`, err);
      results.emailsFailed++;
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentTime = new Date();
  const currentTimeISO = currentTime.toISOString();

  try {
    // Find all overdue orders that are still in progress
    const overdueStatuses = ['in_progress', 'editing', 'revision'];
    const overdueOrders = await db
      .select()
      .from(jobs)
      .where(
        and(
          lt(jobs.actualDeadline, currentTimeISO),
          inArray(jobs.status, overdueStatuses),
          isNotNull(jobs.assignedFreelancerId)
        )
      );

    if (overdueOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue orders found',
        timestamp: currentTimeISO,
        processed: 0,
      });
    }

    // Get admin users for notifications
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));

    const results = {
      level1: { orders: 0, emailsSent: 0, emailsFailed: 0 },
      level2: { orders: 0, emailsSent: 0, emailsFailed: 0 },
      level3: { orders: 0, emailsSent: 0, emailsFailed: 0, unassigned: 0 },
    };

    for (const order of overdueOrders) {
      const deadline = new Date(order.actualDeadline!);
      const hoursOverdue = (currentTime.getTime() - deadline.getTime()) / (1000 * 60 * 60);

      // Skip if not yet at Level 1 threshold
      if (hoursOverdue < ESCALATION_LEVELS.LEVEL_1) continue;

      // Get freelancer details
      const [freelancer] = order.assignedFreelancerId
        ? await db.select().from(users).where(eq(users.id, order.assignedFreelancerId)).limit(1)
        : [null];

      // Get manager details (if assigned by manager)
      const [manager] = order.assignedById
        ? await db.select().from(users).where(eq(users.id, order.assignedById)).limit(1)
        : [null];

      // Determine escalation level
      let level: 1 | 2 | 3;
      let action: string | undefined;

      if (hoursOverdue >= ESCALATION_LEVELS.LEVEL_3) {
        level = 3;
        action = 'Order auto-unassigned and returned to queue.';

        // Auto-unassign the freelancer
        await db
          .update(jobs)
          .set({
            assignedFreelancerId: null,
            status: 'accepted', // Return to assignment queue
            updatedAt: currentTimeISO,
            escalationLevel: 3,
            lastEscalationAt: currentTimeISO,
          })
          .where(eq(jobs.id, order.id));

        results.level3.unassigned++;
        results.level3.orders++;
      } else if (hoursOverdue >= ESCALATION_LEVELS.LEVEL_2) {
        level = 2;
        action = 'Consider reassigning this order immediately.';
        results.level2.orders++;

        // Update escalation tracking
        await db
          .update(jobs)
          .set({
            escalationLevel: 2,
            lastEscalationAt: currentTimeISO,
          })
          .where(eq(jobs.id, order.id));
      } else {
        level = 1;
        results.level1.orders++;

        // Update escalation tracking
        await db
          .update(jobs)
          .set({
            escalationLevel: 1,
            lastEscalationAt: currentTimeISO,
          })
          .where(eq(jobs.id, order.id));
      }

      // Skip notification if already escalated to this level recently (within 2 hours)
      if (order.lastEscalationAt && order.escalationLevel === level) {
        const lastEscalation = new Date(order.lastEscalationAt);
        const hoursSinceLastEscalation = (currentTime.getTime() - lastEscalation.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastEscalation < 2) continue;
      }

      // Send notifications
      const notifyResults = await notifyParties({
        job: order,
        level,
        hoursOverdue,
        adminUsers,
        freelancer,
        manager,
        action,
        currentTimeISO,
      });

      if (level === 1) {
        results.level1.emailsSent += notifyResults.emailsSent;
        results.level1.emailsFailed += notifyResults.emailsFailed;
      } else if (level === 2) {
        results.level2.emailsSent += notifyResults.emailsSent;
        results.level2.emailsFailed += notifyResults.emailsFailed;
      } else {
        results.level3.emailsSent += notifyResults.emailsSent;
        results.level3.emailsFailed += notifyResults.emailsFailed;
      }

      // Log escalation
      await db.insert(emailLogs).values({
        sentBy: 1, // System
        sentTo: 'escalation_log',
        recipientType: 'system',
        recipientCount: notifyResults.emailsSent,
        fromEmail: 'system@tasklynk.co.ke',
        subject: `Escalation Level ${level} - Order ${order.displayId || order.id}`,
        body: JSON.stringify({
          orderId: order.id,
          displayId: order.displayId,
          level,
          hoursOverdue: Math.round(hoursOverdue * 10) / 10,
          freelancerId: order.assignedFreelancerId,
          action,
        }),
        status: 'sent',
        jobId: order.id,
        createdAt: currentTimeISO,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: currentTimeISO,
      processed: overdueOrders.length,
      results,
    });
  } catch (error) {
    console.error('[Deadline Escalation] Error:', error);
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

  // Create a mock request with authorization header
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  return POST(mockRequest as NextRequest);
}

