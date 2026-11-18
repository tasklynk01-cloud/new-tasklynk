import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

/**
 * GET /api/admin/check-invitation-status?email=<email>&role=<role>
 * Check the status of an invitation for a given email and role
 * Supports: manager, client, freelancer, editor
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin role
    const authCheck = await requireAdminRole(req);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const role = searchParams.get('role') || 'manager'; // Default to manager for backward compatibility

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Validate role - map 'freelancer' to 'writer' for database consistency
    const validInputRoles = ['manager', 'client', 'freelancer', 'writer', 'editor'];
    if (!validInputRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Valid roles: ${validInputRoles.join(', ')}` }, { status: 400 });
    }
    
    // Map freelancer to writer for database lookup
    const dbRole = role === 'freelancer' ? 'writer' : role;

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return NextResponse.json({
        status: 'user_exists',
        email,
        role,
        message: 'User with this email already exists',
        user: {
          id: existingUser.id,
          name: existingUser.name,
          role: existingUser.role,
          approved: existingUser.approved,
        },
      });
    }

    // Check if invitation exists in the unified invitations table
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.email, email), eq(invitations.role, dbRole)));

    if (!invitation) {
      return NextResponse.json({
        status: 'no_invitation',
        email,
        role,
        message: `No ${role} invitation found for this email`,
        canInvite: true,
      });
    }

    // Check if invitation is used
    if (invitation.used) {
      return NextResponse.json({
        status: 'used',
        email,
        role,
        message: 'Invitation has already been used',
        invitation: {
          used: true,
          usedAt: invitation.usedAt,
          createdAt: invitation.createdAt,
        },
        canReinvite: true,
      });
    }

    // Check if invitation is expired
    if (invitation.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(invitation.expiresAt);
      const isExpired = now > expiryDate;

      if (isExpired) {
        return NextResponse.json({
          status: 'expired',
          email,
          role,
          message: 'Invitation link has expired',
          invitation: {
            token: invitation.token,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            isExpired: true,
          },
          canReinvite: true,
        });
      }
    }

    // Invitation exists and is valid
    return NextResponse.json({
      status: 'active',
      email,
      role,
      message: `Active ${role} invitation exists for this email`,
      invitation: {
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        used: false,
        isExpired: false,
      },
      canReinvite: true,
    });
  } catch (error) {
    console.error('Error checking invitation status:', error);
    return NextResponse.json(
      { error: 'Failed to check invitation status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


