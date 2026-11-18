import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

// Map role_id to role names for raw SQL rows - must match ROLE_ID_MAP in
// @/lib/role-map (the source of truth used when roleId is assigned at
// registration/PATCH time). This previously used a different mapping
// (3=freelancer, 4=account_owner, 5=manager) that silently disagreed with
// it; harmless today since `users.role` is always populated and takes
// precedence via `??` below, but a landmine for any row that ever needs
// this fallback.
const ROLE_NAMES: Record<number, string> = {
  1: 'admin',
  2: 'client',
  3: 'manager',
  4: 'freelancer',
  5: 'editor',
  6: 'account_owner',
};

function normalizeStatus(raw: unknown): 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'blacklisted' {
  const s = String(raw || '').trim().toLowerCase();
  if (['approved', 'active'].includes(s)) return s as 'approved' | 'active';
  if (['pending', 'awaiting_approval', 'awaiting-approval', 'unverified', 'new', 'inactive', 'not_approved'].includes(s)) return 'pending';
  if (s === 'rejected') return 'rejected';
  if (s === 'suspended') return 'suspended';
  if (s === 'blacklisted') return 'blacklisted';
  return 'pending';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Use drizzle query
    const res = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const row: any = res.rows[0];

    // Get assigned manager info if exists
    let assignedManagerName = null;
    if (row.assigned_manager_id) {
      const managerRes = await db.execute(sql`SELECT name FROM users WHERE id = ${row.assigned_manager_id}`);
      if (managerRes.rows.length > 0) {
        assignedManagerName = managerRes.rows[0].name;
      }
    }
    
    const status = normalizeStatus(row.status);
    const approved = status === 'approved' || status === 'active';
    const role = row.role ?? ROLE_NAMES[Number(row.role_id)] ?? 'client';

    // Shape response consistently with frontend User type
    const payload = {
      id: row.id,
      displayId: row.display_id ?? `TL-U${String(row.id).padStart(3, '0')}`,
      email: row.email,
      name: row.name,
      role,
      approved,
      balance: Number(row.balance_available ?? row.balance ?? 0),
      rating: Number(row.rating ?? 0),
      phone: row.phone,
      status: approved ? 'active' : status,
      suspendedUntil: row.suspended_until ?? null,
      suspensionReason: row.suspension_reason ?? null,
      blacklistReason: row.blacklist_reason ?? null,
      rejectedAt: status === 'rejected' ? (row.rejected_at ?? row.updated_at ?? row.created_at ?? null) : null,
      rejectionReason: row.rejection_reason ?? null,
      totalEarned: Number(row.total_earned ?? row.earned ?? 0),
      totalSpent: Number(row.total_spent ?? 0),
      completedJobs: Number(row.completed_orders ?? row.completed_jobs ?? 0),
      completionRate: row.completion_rate ?? null,
      lastLoginAt: row.last_login_at ?? null,
      lastLoginIp: row.last_login_ip ?? null,
      lastLoginDevice: row.last_login_device ?? null,
      loginCount: Number(row.login_count ?? 0),
      clientTier: row.client_tier ?? null,
      clientPriority: row.client_priority ?? null,
      paymentTerms: row.payment_terms ?? null,
      freelancerBadge: row.freelancer_badge ?? null,
      assignedManagerId: row.assigned_manager_id ?? null,
      assignedManagerName,
      profilePictureUrl: row.profile_picture_url ?? null,
      avatar: row.profile_picture_url ?? null, // Include for compatibility
      createdAt: row.created_at ?? new Date().toISOString(),
    };

    return NextResponse.json(payload, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      phone,
      email,
      paymentTerms,
      clientTier,
      clientPriority,
      freelancerBadge,
      role,
      status,
      balance,
      rating
    } = body;
    const targetUser = existingUser[0];

    // Build update object with only provided fields
    const updates: any = {};

    // Validate name if provided
    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (trimmedName === '') {
        return NextResponse.json(
          { 
            error: 'Name must be a non-empty string',
            code: 'INVALID_NAME' 
          },
          { status: 400 }
        );
      }
      updates.name = trimmedName;
    }

    // Validate phone if provided
    if (phone !== undefined) {
      const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
      if (trimmedPhone === '') {
        return NextResponse.json(
          { 
            error: 'Phone must be a non-empty string',
            code: 'INVALID_PHONE' 
          },
          { status: 400 }
        );
      }
      updates.phone = trimmedPhone;
    }

    // Validate email if provided
    if (email !== undefined) {
      const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { 
            error: 'Invalid email format',
            code: 'INVALID_EMAIL' 
          },
          { status: 400 }
        );
      }

      // Check if email is different from current email
      if (trimmedEmail !== existingUser[0].email) {
        // Check if email is already used by another user
        const emailExists = await db.select()
          .from(users)
          .where(and(
            eq(users.email, trimmedEmail),
            ne(users.id, userId)
          ))
          .limit(1);

        if (emailExists.length > 0) {
          return NextResponse.json(
            { 
              error: 'Email is already in use by another user',
              code: 'EMAIL_IN_USE' 
            },
            { status: 400 }
          );
        }
      }

      updates.email = trimmedEmail;
    }

    // Validate paymentTerms if provided (for clients/account_owners)
    if (paymentTerms !== undefined) {
      const validTerms = ['pod', 'poa'];
      if (!validTerms.includes(paymentTerms)) {
        return NextResponse.json(
          { 
            error: 'Payment terms must be either "pod" or "poa"',
            code: 'INVALID_PAYMENT_TERMS' 
          },
          { status: 400 }
        );
      }
      updates.paymentTerms = paymentTerms;
    }

    // Validate clientTier if provided (for clients)
    if (clientTier !== undefined) {
      const validTiers = ['basic', 'silver', 'gold', 'platinum'];
      if (!validTiers.includes(clientTier)) {
        return NextResponse.json(
          { 
            error: 'Client tier must be one of: basic, silver, gold, platinum',
            code: 'INVALID_CLIENT_TIER' 
          },
          { status: 400 }
        );
      }
      updates.clientTier = clientTier;
    }

    // Validate clientPriority if provided
    if (clientPriority !== undefined) {
      const validPriorities = ['regular', 'priority', 'vip'];
      if (!validPriorities.includes(clientPriority)) {
        return NextResponse.json(
          { 
            error: 'Client priority must be one of: regular, priority, vip',
            code: 'INVALID_CLIENT_PRIORITY' 
          },
          { status: 400 }
        );
      }
      updates.clientPriority = clientPriority;
    }

    // Validate freelancerBadge if provided
    if (freelancerBadge !== undefined) {
      updates.freelancerBadge = freelancerBadge || null;
    }

    // Validate role if provided
    if (role !== undefined) {
      const validRoles = ['admin', 'client', 'freelancer', 'manager', 'editor', 'account_owner'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { 
            error: `Role must be one of: ${validRoles.join(', ')}`,
            code: 'INVALID_ROLE' 
          },
          { status: 400 }
        );
      }
      updates.role = role;
      
      // Update roleId based on role
      const roleMap: Record<string, number> = {
        'admin': 1,
        'client': 2,
        'manager': 3,
        'freelancer': 4,
        'editor': 5,
        'account_owner': 6,
      };
      updates.roleId = roleMap[role];
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'active', 'approved', 'suspended', 'blacklisted', 'rejected'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { 
            error: `Status must be one of: ${validStatuses.join(', ')}`,
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      updates.status = status;
      
      // Auto-approve if status is set to approved/active
      if (['approved', 'active'].includes(status)) {
        updates.approved = true;
      }
    }

    // Validate balance if provided
    if (balance !== undefined) {
      const numBalance = Number(balance);
      if (isNaN(numBalance)) {
        return NextResponse.json(
          { 
            error: 'Balance must be a valid number',
            code: 'INVALID_BALANCE' 
          },
          { status: 400 }
        );
      }
      updates.balance = numBalance;
    }

    // Validate rating if provided (admin manual override, e.g. for freelancers)
    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 0 || numRating > 5) {
        return NextResponse.json(
          {
            error: 'Rating must be a number between 0 and 5',
            code: 'INVALID_RATING'
          },
          { status: 400 }
        );
      }
      updates.rating = numRating;
      updates.ratingAverage = numRating;
    }

    // Handle assignedManagerId updates
    if (Object.prototype.hasOwnProperty.call(body, 'assignedManagerId')) {
      const allowedRolesForManagerAssignment = ['client', 'freelancer', 'account_owner'];
      if (!allowedRolesForManagerAssignment.includes(targetUser.role)) {
        return NextResponse.json(
          {
            error: `Cannot assign manager to role: ${targetUser.role}. Allowed roles: ${allowedRolesForManagerAssignment.join(', ')}`,
            code: 'INVALID_USER_ROLE',
          },
          { status: 400 }
        );
      }

      const rawManagerId = body.assignedManagerId;
      let managerIdToSet: number | null = null;

      const normalizeValue = (value: unknown) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value;

      const normalized = normalizeValue(rawManagerId);

      if (
        normalized === null ||
        normalized === undefined ||
        normalized === '' ||
        normalized === 'null' ||
        normalized === 'none'
      ) {
        managerIdToSet = null;
      } else if (typeof rawManagerId === 'number') {
        if (!Number.isInteger(rawManagerId)) {
          return NextResponse.json(
            { error: 'Manager ID must be an integer', code: 'INVALID_MANAGER_ID' },
            { status: 400 }
          );
        }
        managerIdToSet = rawManagerId;
      } else if (typeof rawManagerId === 'string') {
        const parsed = parseInt(rawManagerId, 10);
        if (Number.isNaN(parsed)) {
          return NextResponse.json(
            { error: 'Invalid manager ID', code: 'INVALID_MANAGER_ID' },
            { status: 400 }
          );
        }
        managerIdToSet = parsed;
      } else {
        return NextResponse.json(
          { error: 'Invalid manager ID type', code: 'INVALID_MANAGER_ID' },
          { status: 400 }
        );
      }

      if (managerIdToSet !== null) {
        const [manager] = await db.select()
          .from(users)
          .where(eq(users.id, managerIdToSet))
          .limit(1);

        if (!manager) {
          return NextResponse.json(
            { error: 'Manager not found', code: 'MANAGER_NOT_FOUND' },
            { status: 404 }
          );
        }

        const managerRole = (manager.role || '').toString().toLowerCase();
        const isManagerRole = managerRole === 'manager' || manager.roleId === 3;
        if (!isManagerRole) {
          return NextResponse.json(
            { error: 'User is not a manager', code: 'FORBIDDEN_NOT_MANAGER' },
            { status: 403 }
          );
        }

        if (!manager.approved) {
          return NextResponse.json(
            { error: 'Manager is not approved', code: 'MANAGER_NOT_APPROVED' },
            { status: 403 }
          );
        }
      }

      updates.assignedManagerId = managerIdToSet;
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    // Update user in database
    const updatedUser = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json(userWithoutPassword, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}