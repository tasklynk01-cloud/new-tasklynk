import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateDailyQuote, touchKeepalivePing } from '@/lib/quotes/daily-quotes';

export const dynamic = 'force-dynamic';

/**
 * Scheduled Cron / Edge Endpoint for Daily Quotes & Supabase Keep-Alive
 * 
 * Can be triggered by:
 * - Vercel Cron (configured in vercel.json)
 * - Supabase pg_cron
 * - GitHub Actions or external ping services (cron-job.org)
 * - Admin manual ping
 */
export async function GET(request: NextRequest) {
  return handleDailyQuoteCron(request);
}

export async function POST(request: NextRequest) {
  return handleDailyQuoteCron(request);
}

async function handleDailyQuoteCron(request: NextRequest) {
  const startTime = Date.now();

  // Verify CRON_SECRET if configured in production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // In production, if CRON_SECRET is set, reject unauthorized calls
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    // 1. Generate or retrieve today's quote from Supabase
    const quote = await getOrGenerateDailyQuote(forceRefresh);

    // 2. Extra keepalive heartbeat ping
    const pingResult = await touchKeepalivePing(quote.date);

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      quote,
      keepalive: {
        status: 'active',
        supabasePing: pingResult,
        durationMs,
        preventInactivityPause: true,
      },
      message: 'Daily quote processed and Supabase keep-alive recorded successfully.',
    });
  } catch (error) {
    console.error('[DailyQuote Cron Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cron error',
      },
      { status: 500 }
    );
  }
}

