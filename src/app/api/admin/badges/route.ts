import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { badges, userBadges, users } from '@/db/schema';
import { requireAdminRole } from '@/lib/admin-auth';
import { and, eq } from 'drizzle-orm';

// Define available badges
const AVAILABLE_BADGES = {
  TOP_PERFORMER: {
    name: 'Top Performer',
    icon: '⭐',
    description: 'Maintained a 4.8+ rating',
    criteria: 'rating >= 4.8',
  },
  FAST_RESPONDER: {
    name: 'Fast Responder',
    icon: '⚡',
    description: 'Replies within 20 minutes average',
    criteria: 'avgResponseTime <= 20',
  },
  ORDERS_100: {
    name: 'Century Club',
    icon: '💯',
    description: 'Completed 100+ orders',
    criteria: 'completedJobs >= 100',
  },
  ZERO_REVISIONS: {
    name: 'Perfect Quality',
    icon: '✨',
    description: 'Zero revision requests',
    criteria: 'revisionRate == 0',
  },
  TECHNICAL_EXPERT: {
    name: 'Technical Expert',
    icon: '🔧',
    description: 'Expert in technical orders',
    criteria: 'specialization == technical',
  },
  TOP_CLIENT: {
    name: 'Top Client',
    icon: '👑',
    description: 'Placed 20+ orders',
    criteria: 'totalOrders >= 20',
  },
  EXCELLENT_COMMUNICATOR: {
    name: 'Excellent Communicator',
    icon: '💬',
    description: 'Clear instructions and responsive',
    criteria: 'communicationScore >= 4.5',
  },
  FAIR_REVIEWER: {
    name: 'Fair Reviewer',
    icon: '⚖️',
    description: 'Fair and reasonable feedback',
    criteria: 'fairnessScore >= 4.5',
  },
  LONG_TERM_PARTNER: {
    name: 'Long-Term Partner',
    icon: '🤝',
    description: '1+ year on platform',
    criteria: 'accountAge >= 365',
  },
};

/**
 * GET /api/users/[id]/badges
 * Fetch all badges for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);

    // Fetch user's badges
    const userBadgesList = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, parsedUserId));

    return NextResponse.json({
      userId: parsedUserId,
      badges: userBadgesList,
      totalBadges: userBadgesList.length,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/badges
 * Assign or remove badge for a user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const { userId, badgeId, action } = body;

    if (!userId || !badgeId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action !== 'assign' && action !== 'remove') {
      return NextResponse.json(
        { error: 'Invalid action. Must be assign or remove' },
        { status: 400 }
      );
    }

    const parsedUserId = typeof userId === 'string' ? parseInt(userId) : Number(userId);
    if (Number.isNaN(parsedUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedUserId));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'assign') {
      // Assign badge
      const badgeInfo = (AVAILABLE_BADGES as any)[badgeId];
      if (!badgeInfo) {
        return NextResponse.json(
          { error: 'Invalid badge ID' },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();

      // Ensure badge exists in badges table
      const [existingBadge] = await db
        .select({ id: badges.id, name: badges.name })
        .from(badges)
        .where(eq(badges.name, String(badgeId)))
        .limit(1);

      const badgeRowId = existingBadge
        ? existingBadge.id
        : (
            await db
              .insert(badges)
              .values({
                name: String(badgeId),
                description: badgeInfo.description,
                icon: badgeInfo.icon,
                criteria: { criteria: badgeInfo.criteria },
                category: String(badgeId).includes('CLIENT') ? 'client' : 'writer',
                createdAt: now,
                updatedAt: now,
              })
              .returning({ id: badges.id })
          )[0].id;

      // Check if badge already assigned
      const [alreadyAssigned] = await db
        .select({ id: userBadges.id })
        .from(userBadges)
        .where(and(eq(userBadges.userId, parsedUserId), eq(userBadges.badgeId, badgeRowId)))
        .limit(1);

      if (alreadyAssigned) {
        return NextResponse.json(
          { error: 'User already has this badge' },
          { status: 400 }
        );
      }

      await db.insert(userBadges).values({
        userId: parsedUserId,
        badgeId: badgeRowId,
        badgeName: badgeInfo.name,
        badgeIcon: badgeInfo.icon,
        description: badgeInfo.description,
        awardedAt: now,
        awardedBy: authCheck.user!.id,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: `Badge "${badgeInfo.name}" assigned to user`,
        badge: {
          name: badgeInfo.name,
          icon: badgeInfo.icon,
          description: badgeInfo.description,
        },
      });
    } else {
      // Remove badge
      const [badgeRow] = await db
        .select({ id: badges.id })
        .from(badges)
        .where(eq(badges.name, String(badgeId)))
        .limit(1);

      if (badgeRow) {
        await db
          .delete(userBadges)
          .where(and(eq(userBadges.userId, parsedUserId), eq(userBadges.badgeId, badgeRow.id)));
      }

      return NextResponse.json({
        success: true,
        message: 'Badge removed from user',
      });
    }
  } catch (error) {
    console.error('Error managing badge:', error);
    return NextResponse.json(
      { error: 'Failed to manage badge' },
      { status: 500 }
    );
  }
}

