import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const approvedParam = searchParams.get('approved');

    // Validate role parameter
    if (!role) {
      return NextResponse.json(
        { 
          error: 'Role parameter is required',
          code: 'MISSING_ROLE_PARAMETER'
        },
        { status: 400 }
      );
    }

    const validRoles = ['freelancer', 'client', 'account_owner', 'manager', 'editor', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          error: `Role must be one of: ${validRoles.join(', ')}`,
          code: 'INVALID_ROLE_VALUE'
        },
        { status: 400 }
      );
    }

    // Build query with filters - if role is account_owner, also include clients
    let roleCondition;
    if (role === 'account_owner') {
      roleCondition = or(
        eq(users.role, 'account_owner'),
        eq(users.role, 'client')
      );
    } else {
      roleCondition = eq(users.role, role);
    }

    // If approvedParam is explicitly 'true', filter for active/approved
    // If approvedParam is explicitly 'false', filter for pending/not approved
    // If approvedParam is not specified (null), return all users of that role
    let whereCondition = roleCondition;
    if (approvedParam === 'true') {
      whereCondition = and(
        roleCondition,
        or(eq(users.status, 'active'), eq(users.status, 'approved'), eq(users.approved, true))
      );
    } else if (approvedParam === 'false') {
      whereCondition = and(
        roleCondition,
        or(eq(users.status, 'pending'), eq(users.approved, false))
      );
    }

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        displayId: users.displayId,
        role: users.role,
        status: users.status,
        approved: users.approved,
        phone: users.phone,
        rating: users.rating,
        balance: users.balance,
        clientTier: users.clientTier,
        clientPriority: users.clientPriority,
        freelancerBadge: users.freelancerBadge,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(desc(users.id));

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET users by role error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

