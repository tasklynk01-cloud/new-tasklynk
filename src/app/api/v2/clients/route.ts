import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull, or, desc } from 'drizzle-orm';

/**
 * GET /api/v2/clients
 * Fetch clients with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const unlinked = searchParams.get('unlinked');
    const search = searchParams.get('search');

    // Build query conditions
    let conditions: any[] = [
      or(eq(users.role, 'client'), eq(users.role, 'account_owner'))
    ];

    // If unlinked=true, only fetch clients not linked to any account
    if (unlinked === 'true') {
      conditions.push(isNull(users.accountId));
    }

    // Fetch clients
    const clients = await db.select({
      id: users.id,
      displayId: users.displayId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      approved: users.approved,
      accountId: users.accountId,
      accountName: users.accountName,
      totalSpent: users.totalSpent,
      completedJobs: users.completedJobs,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt));

    // Filter by search if provided
    let filteredClients = clients;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ clients: filteredClients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

