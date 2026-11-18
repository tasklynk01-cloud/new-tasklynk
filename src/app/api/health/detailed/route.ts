/**
 * Detailed Health Check Endpoint
 * 
 * Gap #19: Comprehensive health monitoring
 */

import { NextRequest } from 'next/server';
import { createDetailedHealthCheckHandler } from '@/lib/health-monitoring';
import { handleOptions } from '@/lib/api-helpers';

export const GET = createDetailedHealthCheckHandler();

export async function OPTIONS() {
  return handleOptions();
}


