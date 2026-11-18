/**
 * Enhanced Health Check Endpoint
 * 
 * Gap #19: Connection health monitoring
 */

import { NextRequest } from 'next/server';
import { createHealthCheckHandler } from '@/lib/health-monitoring';
import { handleOptions } from '@/lib/api-helpers';

export const GET = createHealthCheckHandler();

export async function OPTIONS() {
  return handleOptions();
}

