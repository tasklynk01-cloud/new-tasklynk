import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userCategories, users } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq, inArray, sql } from 'drizzle-orm';

// POST /api/admin/user-categories/bulk-assign - Assign category to multiple users
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { userIds, category, notes } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const assignedBy = authCheck.user?.id || null;

    // Process each user - upsert category
    const results = [];
    let assigned = 0;
    let errors = 0;

    for (const userId of userIds) {
      try {
        // Check if user exists
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          errors++;
          continue;
        }

        // Check if category record exists
        const [existing] = await db
          .select()
          .from(userCategories)
          .where(eq(userCategories.userId, userId))
          .limit(1);

        if (existing) {
          // Update existing
          await db
            .update(userCategories)
            .set({
              category,
              assignedBy,
              assignedAt: now,
              notes: notes || null,
              updatedAt: now,
            })
            .where(eq(userCategories.userId, userId));
        } else {
          // Insert new
          await db.insert(userCategories).values({
            userId,
            category,
            assignedBy,
            assignedAt: now,
            notes: notes || null,
            createdAt: now,
            updatedAt: now,
          });
        }

        assigned++;
        results.push({ userId, status: 'success' });
      } catch (err) {
        console.error(`Error assigning category to user ${userId}:`, err);
        errors++;
        results.push({ userId, status: 'error' });
      }
    }

    return NextResponse.json({
      success: true,
      assigned,
      errors,
      total: userIds.length,
      category,
      results,
    });
  } catch (error) {
    console.error('Error in bulk category assignment:', error);
    return NextResponse.json(
      { error: 'Failed to assign categories' },
      { status: 500 }
    );
  }
}

