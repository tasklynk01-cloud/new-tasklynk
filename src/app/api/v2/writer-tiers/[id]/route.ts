import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { writerTiers } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/v2/writer-tiers/[id] - Get single tier
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tierId = parseInt(id);

    if (isNaN(tierId)) {
      return NextResponse.json(
        { error: 'Invalid tier ID' },
        { status: 400 }
      );
    }

    const [tier] = await db
      .select()
      .from(writerTiers)
      .where(eq(writerTiers.id, tierId))
      .limit(1);

    if (!tier) {
      return NextResponse.json(
        { error: 'Writer tier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tier: {
        ...tier,
        benefits: tier.benefits || []
      }
    });
  } catch (error) {
    console.error('Error fetching writer tier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writer tier' },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/writer-tiers/[id] - Update tier (admin only)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await context.params;
    const tierId = parseInt(id);

    if (isNaN(tierId)) {
      return NextResponse.json(
        { error: 'Invalid tier ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, minRating, minJobs, minSuccessRate, benefits, color, icon } = body;

    // Check if tier exists
    const [existingTier] = await db
      .select()
      .from(writerTiers)
      .where(eq(writerTiers.id, tierId))
      .limit(1);

    if (!existingTier) {
      return NextResponse.json(
        { error: 'Writer tier not found' },
        { status: 404 }
      );
    }

    // Validate ranges if provided
    if (minRating !== undefined && (minRating < 0 || minRating > 5)) {
      return NextResponse.json(
        { error: 'minRating must be between 0 and 5' },
        { status: 400 }
      );
    }

    if (minSuccessRate !== undefined && (minSuccessRate < 0 || minSuccessRate > 1)) {
      return NextResponse.json(
        { error: 'minSuccessRate must be between 0 and 1' },
        { status: 400 }
      );
    }

    if (minJobs !== undefined && minJobs < 0) {
      return NextResponse.json(
        { error: 'minJobs must be a positive number' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (minRating !== undefined) updateData.minRating = minRating;
    if (minJobs !== undefined) updateData.minJobs = minJobs;
    if (minSuccessRate !== undefined) updateData.minSuccessRate = minSuccessRate;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    const [updatedTier] = await db
      .update(writerTiers)
      .set(updateData)
      .where(eq(writerTiers.id, tierId))
      .returning();

    return NextResponse.json({
      success: true,
      tier: {
        ...updatedTier,
        benefits: updatedTier.benefits || []
      }
    });
  } catch (error: any) {
    console.error('Error updating writer tier:', error);

    if (error?.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A tier with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update writer tier' },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/writer-tiers/[id] - Delete tier (admin only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await context.params;
    const tierId = parseInt(id);

    if (isNaN(tierId)) {
      return NextResponse.json(
        { error: 'Invalid tier ID' },
        { status: 400 }
      );
    }

    // Check if tier exists
    const [existingTier] = await db
      .select()
      .from(writerTiers)
      .where(eq(writerTiers.id, tierId))
      .limit(1);

    if (!existingTier) {
      return NextResponse.json(
        { error: 'Writer tier not found' },
        { status: 404 }
      );
    }

    await db.delete(writerTiers).where(eq(writerTiers.id, tierId));

    return NextResponse.json({
      success: true,
      message: 'Writer tier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting writer tier:', error);
    return NextResponse.json(
      { error: 'Failed to delete writer tier' },
      { status: 500 }
    );
  }
}
