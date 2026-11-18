import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerCPPLevels, pricingMinimums } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/admin/cpp-settings
 * Retrieve all CPP levels and pricing minimums
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Fetch CPP levels ordered by level number
    const cppLevels = await db
      .select()
      .from(freelancerCPPLevels)
      .orderBy(asc(freelancerCPPLevels.level));

    // Fetch pricing minimums
    const minimums = await db
      .select()
      .from(pricingMinimums);

    return NextResponse.json({
      success: true,
      cppLevels,
      pricingMinimums: minimums,
    });
  } catch (error) {
    console.error('Error fetching CPP settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CPP settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/admin/cpp-settings
 * Initialize or update CPP levels (bulk update)
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { cppLevels: inputLevels } = body;

    if (!inputLevels || !Array.isArray(inputLevels)) {
      return NextResponse.json(
        { error: 'cppLevels array is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const results = [];

    for (const level of inputLevels) {
      // Check if level already exists
      const [existing] = await db
        .select()
        .from(freelancerCPPLevels)
        .where(eq(freelancerCPPLevels.level, level.level));

      if (existing) {
        // Update existing level
        await db
          .update(freelancerCPPLevels)
          .set({
            levelName: level.levelName,
            description: level.description,
            completedOrdersRequired: level.completedOrdersRequired,
            cppNonTechnical: level.cppNonTechnical,
            cppTechnical: level.cppTechnical,
            orderCountInLevel: level.orderCountInLevel,
            progressBarColor: level.progressBarColor,
          })
          .where(eq(freelancerCPPLevels.level, level.level));
        results.push({ level: level.level, action: 'updated' });
      } else {
        // Insert new level
        await db.insert(freelancerCPPLevels).values({
          level: level.level,
          levelName: level.levelName,
          description: level.description,
          completedOrdersRequired: level.completedOrdersRequired,
          cppNonTechnical: level.cppNonTechnical,
          cppTechnical: level.cppTechnical,
          orderCountInLevel: level.orderCountInLevel,
          progressBarColor: level.progressBarColor,
          createdAt: now,
        });
        results.push({ level: level.level, action: 'created' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'CPP levels updated successfully',
      results,
    });
  } catch (error) {
    console.error('Error updating CPP settings:', error);
    return NextResponse.json(
      { error: 'Failed to update CPP settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/admin/cpp-settings
 * Update a single CPP level
 */
export async function PATCH(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { level, ...updates } = body;

    if (!level) {
      return NextResponse.json(
        { error: 'Level number is required' },
        { status: 400 }
      );
    }

    // Check if level exists
    const [existing] = await db
      .select()
      .from(freelancerCPPLevels)
      .where(eq(freelancerCPPLevels.level, level));

    if (!existing) {
      return NextResponse.json(
        { error: 'CPP level not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (updates.levelName !== undefined) updateData.levelName = updates.levelName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.completedOrdersRequired !== undefined) updateData.completedOrdersRequired = updates.completedOrdersRequired;
    if (updates.cppNonTechnical !== undefined) updateData.cppNonTechnical = updates.cppNonTechnical;
    if (updates.cppTechnical !== undefined) updateData.cppTechnical = updates.cppTechnical;
    if (updates.orderCountInLevel !== undefined) updateData.orderCountInLevel = updates.orderCountInLevel;
    if (updates.progressBarColor !== undefined) updateData.progressBarColor = updates.progressBarColor;

    await db
      .update(freelancerCPPLevels)
      .set(updateData)
      .where(eq(freelancerCPPLevels.level, level));

    return NextResponse.json({
      success: true,
      message: `CPP level ${level} updated successfully`,
    });
  } catch (error) {
    console.error('Error updating CPP level:', error);
    return NextResponse.json(
      { error: 'Failed to update CPP level' },
      { status: 500 }
    );
  }
}

