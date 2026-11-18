import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerCPPLevels, pricingMinimums } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq } from 'drizzle-orm';

// Default CPP Level Definitions
const DEFAULT_CPP_LEVELS = [
  {
    level: 1,
    levelName: 'Starter',
    description: 'Beginning your journey with us',
    completedOrdersRequired: 0,
    cppNonTechnical: 150,
    cppTechnical: 170,
    orderCountInLevel: 3,
    progressBarColor: '#10b981',
  },
  {
    level: 2,
    levelName: 'Rising',
    description: 'Showing consistent quality work',
    completedOrdersRequired: 3,
    cppNonTechnical: 160,
    cppTechnical: 180,
    orderCountInLevel: 5,
    progressBarColor: '#06b6d4',
  },
  {
    level: 3,
    levelName: 'Established',
    description: 'Building a strong reputation',
    completedOrdersRequired: 8,
    cppNonTechnical: 170,
    cppTechnical: 190,
    orderCountInLevel: 15,
    progressBarColor: '#3b82f6',
  },
  {
    level: 4,
    levelName: 'Expert',
    description: 'Trusted by many clients',
    completedOrdersRequired: 23,
    cppNonTechnical: 180,
    cppTechnical: 200,
    orderCountInLevel: 27,
    progressBarColor: '#8b5cf6',
  },
  {
    level: 5,
    levelName: 'Master',
    description: 'Excellence in every project',
    completedOrdersRequired: 50,
    cppNonTechnical: 200,
    cppTechnical: 220,
    orderCountInLevel: 999,
    progressBarColor: '#fbbf24',
  },
];

// Default pricing minimums
const DEFAULT_PRICING_MINIMUMS = [
  { serviceType: 'writing_page', minCpp: 240, minCps: null, description: 'Standard writing page minimum' },
  { serviceType: 'technical_page', minCpp: 270, minCps: null, description: 'Technical writing page minimum' },
  { serviceType: 'slide', minCpp: 200, minCps: 200, description: 'Slide/presentation minimum' },
  { serviceType: 'data_analysis', minCpp: 300, minCps: null, description: 'Data analysis work minimum' },
  { serviceType: 'programming', minCpp: 350, minCps: null, description: 'Programming task minimum' },
];

/**
 * POST /api/v2/admin/cpp-settings/seed
 * Initialize the database with default CPP levels and pricing minimums
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const now = new Date().toISOString();
    const results = {
      cppLevels: { created: 0, skipped: 0 },
      pricingMinimums: { created: 0, skipped: 0 },
    };

    // Seed CPP Levels
    for (const level of DEFAULT_CPP_LEVELS) {
      try {
        const [existing] = await db
          .select()
          .from(freelancerCPPLevels)
          .where(eq(freelancerCPPLevels.level, level.level));

        if (!existing) {
          await db.insert(freelancerCPPLevels).values({
            ...level,
            createdAt: now,
          });
          results.cppLevels.created++;
        } else {
          results.cppLevels.skipped++;
        }
      } catch (error) {
        console.error(`Error seeding CPP level ${level.level}:`, error);
      }
    }

    // Seed Pricing Minimums
    for (const pricing of DEFAULT_PRICING_MINIMUMS) {
      try {
        const [existing] = await db
          .select()
          .from(pricingMinimums)
          .where(eq(pricingMinimums.serviceType, pricing.serviceType));

        if (!existing) {
          await db.insert(pricingMinimums).values({
            ...pricing,
            effectiveFrom: now,
            effectiveTo: null,
            enforcedBy: 'system',
            createdAt: now,
            updatedAt: now,
          });
          results.pricingMinimums.created++;
        } else {
          results.pricingMinimums.skipped++;
        }
      } catch (error) {
        console.error(`Error seeding pricing for ${pricing.serviceType}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'CPP settings seeded successfully',
      results,
    });
  } catch (error) {
    console.error('Error seeding CPP settings:', error);
    return NextResponse.json(
      { error: 'Failed to seed CPP settings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/admin/cpp-settings/seed
 * Check if CPP settings are initialized
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const levels = await db.select().from(freelancerCPPLevels);
    const minimums = await db.select().from(pricingMinimums);

    return NextResponse.json({
      initialized: levels.length > 0 || minimums.length > 0,
      cppLevelsCount: levels.length,
      pricingMinimumsCount: minimums.length,
      expectedCppLevels: DEFAULT_CPP_LEVELS.length,
      expectedPricingMinimums: DEFAULT_PRICING_MINIMUMS.length,
    });
  } catch (error) {
    console.error('Error checking CPP settings:', error);
    return NextResponse.json(
      { error: 'Failed to check CPP settings' },
      { status: 500 }
    );
  }
}

