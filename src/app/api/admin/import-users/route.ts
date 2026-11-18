import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData } = body;

    const toBool = (value: unknown) => Boolean(parseInt(String(value ?? '0')));

    const placeholderPhoneForEmail = (email: string) => {
      const hash = Array.from(email).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
      const last8 = (hash % 100_000_000).toString().padStart(8, '0');
      return `+2547${last8}`;
    };

    if (!Array.isArray(userData)) {
      return NextResponse.json(
        { success: false, error: 'userData must be an array' },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[]
    };

    for (const user of userData) {
      try {
        // Check if user exists by email
        const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        // Prepare user data - convert numeric strings to actual numbers/booleans
        const createdAtValue = String(user.created_at || user.createdAt || new Date().toISOString());
        const updatedAtValue = String(user.updated_at || user.updatedAt || new Date().toISOString());

        const mappedUserData = {
          displayId: String(user.display_id || user.displayId || `IMPR-${user.email}`),
          email: String(user.email),
          password: String(user.password), // Already bcrypt hashed
          name: String(user.name || user.email),
          role: String(user.role || 'client'),
          approved: toBool(user.approved),
          emailVerified: toBool(user.email_verified ?? user.emailVerified),
          balance: parseFloat(user.balance || '0'),
          earned: parseFloat(user.earned || '0'),
          totalEarnings: parseFloat(user.total_earnings || user.totalEarnings || '0'),
          rating: user.rating != null ? parseFloat(String(user.rating)) : null,
          phone: String(user.phone || placeholderPhoneForEmail(String(user.email))),
          status: String(user.status || 'active'),
          profilePictureUrl: user.profile_picture_url || user.profilePictureUrl || null,
          domainId: user.domain_id ? parseInt(user.domain_id) : (user.domainId ? parseInt(user.domainId) : null),
          lastLoginIp: user.last_login_ip || user.lastLoginIp || null,
          lastLoginAt: user.last_login_at || user.lastLoginAt || null,
          lastLoginDevice: user.last_login_device || user.lastLoginDevice || null,
          loginCount: parseInt(user.login_count || user.loginCount || '0'),
          clientPriority: user.client_priority || user.clientPriority || 'regular',
          freelancerBadge: user.freelancer_badge || user.freelancerBadge || null,
          clientTier: user.client_tier || user.clientTier || 'basic',
          accountId: user.account_id ? parseInt(user.account_id) : (user.accountId ? parseInt(user.accountId) : null),
          assignedManagerId: user.assigned_manager_id ? parseInt(user.assigned_manager_id) : (user.assignedManagerId ? parseInt(user.assignedManagerId) : null),
          accountName: user.account_name || user.accountName || null,
          suspendedUntil: user.suspended_until || user.suspendedUntil || null,
          suspensionReason: user.suspension_reason || user.suspensionReason || null,
          blacklistReason: user.blacklist_reason || user.blacklistReason || null,
          rejectedAt: user.rejected_at || user.rejectedAt || null,
          rejectionReason: user.rejection_reason || user.rejectionReason || null,
          totalEarned: parseFloat(user.total_earned || user.totalEarned || '0'),
          totalSpent: parseFloat(user.total_spent || user.totalSpent || '0'),
          completedJobs: parseInt(user.completed_jobs || user.completedJobs || '0'),
          completionRate: user.completion_rate != null ? parseFloat(String(user.completion_rate)) : null,
        };

        if (existing.length > 0) {
          // Update existing user
          await db.update(users)
            .set({
              ...mappedUserData,
              updatedAt: updatedAtValue
            })
            .where(eq(users.email, user.email));
          results.updated++;
        } else {
          // Insert new user
          await db.insert(users).values({
            ...mappedUserData,
            createdAt: createdAtValue,
            updatedAt: updatedAtValue
          });
          results.imported++;
        }
      } catch (error) {
        results.errors.push(`Failed to import ${user.email}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete: ${results.imported} new users, ${results.updated} updated`,
      results
    });
  } catch (error) {
    console.error('Import users error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to import users' 
      },
      { status: 500 }
    );
  }
}

