import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * DEBUG ONLY: Test order insertion to diagnose production database issues
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow admin access
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const now = new Date().toISOString();
    const testDisplayId = `DEBUG-TEST-${Date.now()}`;

    console.log('[DEBUG] Attempting minimal order insert with these values:', {
      displayId: testDisplayId,
      orderNumber: testDisplayId,
      orderId: testDisplayId,
      clientId: authCheck.user!.id,
      title: 'Debug Test Order',
      instructions: 'Testing database insert',
      workType: 'writing',
      pages: 1,
      amount: 100,
      deadline: now,
      actualDeadline: now,
      freelancerDeadline: now,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    // Attempt 1: Minimal insert with only required fields
    try {
      const result = await db.insert(jobs).values({
        displayId: testDisplayId,
        orderNumber: testDisplayId,
        orderId: testDisplayId,
        clientId: authCheck.user!.id,
        title: 'Debug Test Order',
        instructions: 'Testing database insert',
        workType: 'writing',
        pages: 1,
        slides: null,
        amount: 100,
        deadline: now,
        actualDeadline: now,
        freelancerDeadline: now,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }).returning();

      const insertedOrder = result[0];
      console.log('[DEBUG] ✅ Insert successful!', {
        id: insertedOrder.id,
        displayId: insertedOrder.displayId,
      });

      // Clean up immediately
      await db.delete(jobs).where(eq(jobs.id, insertedOrder.id));
      console.log('[DEBUG] ✅ Test record cleaned up');

      return NextResponse.json({
        success: true,
        message: 'Database insert test passed',
        insertedId: insertedOrder.id,
        insertedFields: Object.keys(insertedOrder),
      });
    } catch (insertError: any) {
      console.error('[DEBUG] ❌ Insert failed:', {
        message: insertError.message,
        code: insertError.code,
        cause: insertError.cause,
        stack: insertError.stack,
      });

      return NextResponse.json({
        success: false,
        error: 'Insert failed',
        details: {
          message: insertError.message,
          code: insertError.code,
          sqliteError: insertError.cause,
          hint: 'This likely means the production database schema is out of sync with the code schema. Run `npm run db:push` to sync.',
        },
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[DEBUG] ❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
    }, { status: 500 });
  }
}

