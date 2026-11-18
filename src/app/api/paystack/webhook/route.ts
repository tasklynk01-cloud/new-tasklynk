import { NextRequest } from 'next/server';
import { POST as centralizedWebhookPost, OPTIONS as centralizedWebhookOptions } from '@/app/api/payments/webhook/route';

/**
 * Backward compatibility alias for legacy webhook endpoint
 * Routes directly to centralized handler in /api/payments/webhook
 */
export async function OPTIONS(request: NextRequest) {
  return centralizedWebhookOptions(request);
}

export async function POST(request: NextRequest) {
  return centralizedWebhookPost(request);
}
