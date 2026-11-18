import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingMinimums } from '@/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/v2/admin/pricing-minimums
 * Retrieve all active pricing minimums
 * Public read access for all authenticated users (clients need to see prices)
 */
export async function GET(request: NextRequest) {
  try {
    // Allow any authenticated user to read pricing (clients need this for pricing calculator)
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer', 'editor']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const now = new Date().toISOString();

    // Fetch active pricing minimums (effectiveTo is null or in the future)
    const minimums = await db
      .select()
      .from(pricingMinimums);

    // Filter to only active minimums
    const activeMinimums = minimums.filter(m => 
      !m.effectiveTo || m.effectiveTo > now
    );

    return NextResponse.json({
      success: true,
      pricingMinimums: activeMinimums,
      allMinimums: minimums, // For historical reference
    });
  } catch (error) {
    console.error('Error fetching pricing minimums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing minimums' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/admin/pricing-minimums
 * Create or update pricing minimums
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { serviceType, minCpp, minCps, description } = body;

    if (!serviceType || minCpp === undefined) {
      return NextResponse.json(
        { error: 'serviceType and minCpp are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Check if service type already exists with active pricing
    const [existing] = await db
      .select()
      .from(pricingMinimums)
      .where(eq(pricingMinimums.serviceType, serviceType));

    if (existing) {
      // Update existing record
      await db
        .update(pricingMinimums)
        .set({
          minCpp: minCpp,
          minCps: minCps || null,
          description: description || existing.description,
          updatedAt: now,
        })
        .where(eq(pricingMinimums.serviceType, serviceType));

      return NextResponse.json({
        success: true,
        message: `Pricing for ${serviceType} updated successfully`,
        action: 'updated',
      });
    } else {
      // Insert new record
      await db.insert(pricingMinimums).values({
        serviceType,
        minCpp,
        minCps: minCps || null,
        description: description || `Minimum pricing for ${serviceType}`,
        effectiveFrom: now,
        effectiveTo: null,
        enforcedBy: 'admin',
        createdAt: now,
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        message: `Pricing for ${serviceType} created successfully`,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('Error updating pricing minimum:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing minimum' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v2/admin/pricing-minimums
 * Bulk update all pricing minimums
 */
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { minimums } = body;

    if (!minimums || !Array.isArray(minimums)) {
      return NextResponse.json(
        { error: 'minimums array is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const results = [];

    for (const item of minimums) {
      const { serviceType, minCpp, minCps, description } = item;

      if (!serviceType || minCpp === undefined) {
        results.push({ serviceType, error: 'Missing required fields' });
        continue;
      }

      // Check if exists
      const [existing] = await db
        .select()
        .from(pricingMinimums)
        .where(eq(pricingMinimums.serviceType, serviceType));

      if (existing) {
        await db
          .update(pricingMinimums)
          .set({
            minCpp,
            minCps: minCps || null,
            description: description || existing.description,
            updatedAt: now,
          })
          .where(eq(pricingMinimums.serviceType, serviceType));
        results.push({ serviceType, action: 'updated' });
      } else {
        await db.insert(pricingMinimums).values({
          serviceType,
          minCpp,
          minCps: minCps || null,
          description: description || `Minimum pricing for ${serviceType}`,
          effectiveFrom: now,
          effectiveTo: null,
          enforcedBy: 'admin',
          createdAt: now,
          updatedAt: now,
        });
        results.push({ serviceType, action: 'created' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing minimums updated successfully',
      results,
    });
  } catch (error) {
    console.error('Error bulk updating pricing minimums:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing minimums' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/admin/pricing-minimums
 * Deactivate a pricing minimum (set effectiveTo date)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');

    if (!serviceType) {
      return NextResponse.json(
        { error: 'serviceType query parameter is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Soft delete by setting effectiveTo
    const result = await db
      .update(pricingMinimums)
      .set({
        effectiveTo: now,
        updatedAt: now,
      })
      .where(eq(pricingMinimums.serviceType, serviceType));

    return NextResponse.json({
      success: true,
      message: `Pricing for ${serviceType} deactivated`,
    });
  } catch (error) {
    console.error('Error deactivating pricing minimum:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate pricing minimum' },
      { status: 500 }
    );
  }
}

