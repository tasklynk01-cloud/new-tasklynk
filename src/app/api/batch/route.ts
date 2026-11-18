/**
 * Batch API Endpoint
 * 
 * Gap #18: Request batching for related API calls
 */

import { NextRequest } from 'next/server';
import { createBatchEndpoint, registerBatchHandler } from '@/lib/request-batching';
import { handleOptions, createErrorResponse } from '@/lib/api-helpers';
import { requireRole } from '@/lib/admin-auth';

// Register batch handlers (example)
// In production, register these in a separate initialization file
registerBatchHandler('/api/v2/users/:id', async (item, request) => {
  // This would call the actual user endpoint
  // For now, return a placeholder
  return {
    id: item.id,
    status: 200,
    data: { message: 'Batch handler registered' },
  };
});

export const POST = async (request: NextRequest) => {
  // Require authentication for batch requests
  const authResult = await requireRole(request, ['admin', 'manager', 'client', 'freelancer']);
  if (authResult.error) {
    return createErrorResponse(authResult.error, 'UNAUTHORIZED', authResult.status || 401);
  }
  
  const handler = createBatchEndpoint();
  return handler(request);
};

export async function OPTIONS() {
  return handleOptions();
}


