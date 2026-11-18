import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

/**
 * GET /api/v2/realtime/notifications
 * Server-Sent Events endpoint for real-time notifications
 * OPTIMIZED: Hoisted DB imports and relaxed polling frequency to 25s
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'freelancer', 'editor']);
    if (authCheck.error) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = authCheck.user;

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    let lastPollTime = new Date(Date.now() - 30000).toISOString();

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        const welcomeEvent = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to real-time notifications',
          userId: user.id,
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(new TextEncoder().encode(welcomeEvent));

        // Poll notifications efficiently
        const pollNotifications = async () => {
          try {
            const checkTime = new Date().toISOString();
            
            const recentNotifications = await db
              .select()
              .from(notifications)
              .where(
                and(
                  eq(notifications.userId, user.id),
                  gte(notifications.createdAt, lastPollTime),
                  eq(notifications.read, false)
                )
              )
              .orderBy(desc(notifications.createdAt));

            lastPollTime = checkTime;

            // Send each new notification
            for (const notification of recentNotifications) {
              const eventData = `data: ${JSON.stringify({
                type: 'notification',
                id: notification.id,
                title: notification.title,
                message: notification.message,
                notificationType: notification.type,
                timestamp: notification.createdAt,
                isRead: notification.read
              })}\n\n`;
              
              controller.enqueue(new TextEncoder().encode(eventData));
            }

            // Keep connection alive with heartbeat
            const heartbeat = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: checkTime
            })}\n\n`;
            
            controller.enqueue(new TextEncoder().encode(heartbeat));
            
          } catch (error) {
            console.error('Error polling notifications:', error);
          }
        };

        // Poll every 25 seconds instead of every 5 seconds (5x CPU reduction)
        const interval = setInterval(pollNotifications, 25000);

        // Cleanup on connection close
        request.signal?.addEventListener('abort', () => {
          clearInterval(interval);
          try { controller.close(); } catch {}
        });

        // Close after 30 minutes to prevent hanging connections
        setTimeout(() => {
          clearInterval(interval);
          try { controller.close(); } catch {}
        }, 30 * 60 * 1000);
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error setting up SSE:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
