import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerInvitations, invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token is required' 
      }, { status: 400 });
    }

    // Try to find invitation in both tables
    let invitation: any = null;
    let invitationType: 'unified' | 'legacy' = 'unified';

    // First check the unified invitations table (used for editors)
    const [unifiedInvitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));

    if (unifiedInvitation) {
      invitation = unifiedInvitation;
      invitationType = 'unified';
    } else {
      // Fall back to legacy managerInvitations table
      const [legacyInvitation] = await db
        .select()
        .from(managerInvitations)
        .where(eq(managerInvitations.token, token));
      
      if (legacyInvitation) {
        invitation = { ...legacyInvitation, role: legacyInvitation.role || 'manager' };
        invitationType = 'legacy';
      }
    }

    if (!invitation) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid token' 
      }, { status: 404 });
    }

    // Check if already used
    if (invitation.used) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token has already been used',
        email: invitation.email,
        role: invitation.role || 'manager'
      }, { status: 400 });
    }

    // Check if expired
    if (invitation.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(invitation.expiresAt);
      
      if (now > expiryDate) {
        // Mark as expired in appropriate database table
        if (invitationType === 'unified') {
          await db
            .update(invitations)
            .set({ status: 'expired' })
            .where(eq(invitations.id, invitation.id));
        } else {
          await db
            .update(managerInvitations)
            .set({ status: 'expired' })
            .where(eq(managerInvitations.id, invitation.id));
        }
        
        return NextResponse.json({ 
          valid: false, 
          error: 'Token has expired',
          email: invitation.email,
          expiresAt: invitation.expiresAt,
          role: invitation.role || 'manager'
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      valid: true, 
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      role: invitation.role || 'manager'
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Failed to verify token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

