import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

/**
 * POST /api/admin/fix-client-activation
 * 
 * Fixes client activation status for all approved clients
 * Ensures approved=1 clients have status='active'
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }


    // Step 1: Find all approved clients
    const approvedClients = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.role, 'client'), eq(users.role, 'account_owner')),
          eq(users.approved, true)
        )
      );


    // Step 2: Identify clients that need fixing
    const needsFixing = approvedClients.filter(client => client.status !== 'active');
    

    // Step 3: Update all approved clients to active status
    const now = new Date().toISOString();
    const updatePromises = needsFixing.map(client =>
      db.update(users)
        .set({ 
          status: 'active',
          updatedAt: now
        })
        .where(eq(users.id, client.id))
    );

    await Promise.all(updatePromises);

    // Step 4: Verify updates
    const verifiedClients = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.role, 'client'), eq(users.role, 'account_owner')),
          eq(users.approved, true)
        )
      );

    const allActive = verifiedClients.every(client => client.status === 'active');
    const stillNotActive = verifiedClients.filter(client => client.status !== 'active');

    // Step 5: Return results
    return NextResponse.json({
      success: true,
      summary: {
        totalApprovedClients: approvedClients.length,
        updated: needsFixing.length,
        currentActiveClients: verifiedClients.filter(c => c.status === 'active').length,
        allActive,
        conflicts: stillNotActive.length
      },
      before: approvedClients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        approved: c.approved
      })),
      after: verifiedClients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        approved: c.approved
      })),
      stillNotActive: stillNotActive.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        approved: c.approved
      }))
    });

  } catch (error) {
    console.error('Error fixing client activation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix client activation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fix-client-activation
 * 
 * Check current status of client activation without making changes
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Get all approved clients
    const approvedClients = await db
      .select()
      .from(users)
      .where(
        and(
          or(eq(users.role, 'client'), eq(users.role, 'account_owner')),
          eq(users.approved, true)
        )
      );

    const notActive = approvedClients.filter(client => client.status !== 'active');
    const statusDistribution = approvedClients.reduce((acc, client) => {
      const status = client.status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalApprovedClients: approvedClients.length,
      activeClients: approvedClients.filter(c => c.status === 'active').length,
      needsFixing: notActive.length,
      allActive: notActive.length === 0,
      statusDistribution,
      clientsNeedingFix: notActive.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        approved: c.approved
      }))
    });

  } catch (error) {
    console.error('Error checking client activation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check client activation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

