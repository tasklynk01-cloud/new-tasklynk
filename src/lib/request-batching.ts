/**
 * Request Batching Utilities
 * 
 * Gap #18: Implement request batching for related API calls
 * 
 * Provides utilities to batch multiple related API requests into a single call,
 * reducing network overhead and improving performance.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Batch request item
 */
export interface BatchRequestItem {
  id: string;
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Batch response item
 */
export interface BatchResponseItem {
  id: string;
  status: number;
  data?: any;
  error?: string;
}

/**
 * Batch request handler
 */
export interface BatchHandler {
  (item: BatchRequestItem, request: NextRequest): Promise<BatchResponseItem>;
}

/**
 * Batch request registry
 * Maps paths to handlers
 */
const batchHandlers = new Map<string, BatchHandler>();

/**
 * Register a batch handler
 */
export function registerBatchHandler(path: string, handler: BatchHandler): void {
  batchHandlers.set(path, handler);
}

/**
 * Process a batch request
 */
export async function processBatchRequest(
  items: BatchRequestItem[],
  baseRequest: NextRequest
): Promise<BatchResponseItem[]> {
  const results: BatchResponseItem[] = [];
  
  // Process items in parallel (with concurrency limit)
  const concurrency = 10;
  const chunks: BatchRequestItem[][] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(async (item) => {
        const handler = batchHandlers.get(item.path);
        
        if (!handler) {
          return {
            id: item.id,
            status: 404,
            error: `No handler found for path: ${item.path}`,
          };
        }
        
        try {
          return await handler(item, baseRequest);
        } catch (error: any) {
          return {
            id: item.id,
            status: 500,
            error: error.message || 'Internal server error',
          };
        }
      })
    );
    
    chunkResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          id: chunk[index].id,
          status: 500,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });
  }
  
  return results;
}

/**
 * Create a batch API endpoint handler
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const body = await request.json();
 *   const { requests } = body;
 *   
 *   const results = await processBatchRequest(requests, request);
 *   return NextResponse.json({ results });
 * }
 * ```
 */
export function createBatchEndpoint() {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const { requests } = body;
      
      if (!Array.isArray(requests)) {
        return NextResponse.json(
          { error: 'requests must be an array' },
          { status: 400 }
        );
      }
      
      if (requests.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 requests per batch' },
          { status: 400 }
        );
      }
      
      const results = await processBatchRequest(requests, request);
      
      return NextResponse.json({
        success: true,
        results,
        count: results.length,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to process batch request' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to create batch request items
 */
export function createBatchItem(
  id: string,
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): BatchRequestItem {
  return { id, method, path, body, headers };
}

/**
 * Common batch operations
 */
export const BatchOperations = {
  /**
   * Batch fetch user data
   */
  fetchUsers: (userIds: number[]): BatchRequestItem[] => {
    return userIds.map(id => 
      createBatchItem(`user-${id}`, 'GET', `/api/v2/users/${id}`)
    );
  },
  
  /**
   * Batch fetch order data
   */
  fetchOrders: (orderIds: number[]): BatchRequestItem[] => {
    return orderIds.map(id => 
      createBatchItem(`order-${id}`, 'GET', `/api/v2/orders/${id}`)
    );
  },
  
  /**
   * Batch fetch notifications
   */
  fetchNotifications: (userIds: number[]): BatchRequestItem[] => {
    return userIds.map(id => 
      createBatchItem(`notifications-${id}`, 'GET', `/api/notifications?userId=${id}`)
    );
  },
};


