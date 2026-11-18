import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingMinimums } from '@/db/schema';
import { eq, and, or, isNull, lte, gte } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager', 'client', 'account_owner', 'freelancer']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');
    
    const now = new Date().toISOString();
    
    let query;
    if (serviceType) {
      query = db.select()
        .from(pricingMinimums)
        .where(
          and(
            eq(pricingMinimums.serviceType, serviceType),
            lte(pricingMinimums.effectiveFrom, now),
            or(
              isNull(pricingMinimums.effectiveTo),
              gte(pricingMinimums.effectiveTo, now)
            )
          )
        )
        .limit(1);
    } else {
      query = db.select()
        .from(pricingMinimums)
        .where(
          and(
            lte(pricingMinimums.effectiveFrom, now),
            or(
              isNull(pricingMinimums.effectiveTo),
              gte(pricingMinimums.effectiveTo, now)
            )
          )
        );
    }
    
    const minimums = await query;
    
    const formattedMinimums = minimums.reduce((acc, min) => {
      acc[min.serviceType] = {
        minCPP: min.minCpp,
        minCPS: min.minCps,
        description: min.description,
        effectiveFrom: min.effectiveFrom,
        effectiveTo: min.effectiveTo,
        enforcedBy: min.enforcedBy
      };
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json({
      success: true,
      data: formattedMinimums,
      defaults: {
        writing_page: { minCPP: 240, minCPS: null },
        slide: { minCPP: 150, minCPS: 150 },
        technical_page: { minCPP: 270, minCPS: null },
        writer_default: { minCPP: 200, minCPS: 100 }
      }
    });
  } catch (error) {
    console.error('Error fetching pricing minimums:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing minimums' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    
    const body = await request.json();
    const { serviceType, minCpp, minCps, description, effectiveFrom, effectiveTo } = body;
    
    if (!serviceType || typeof minCpp !== 'number') {
      return NextResponse.json(
        { success: false, error: 'serviceType and minCpp are required' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    const [newMinimum] = await db.insert(pricingMinimums)
      .values({
        serviceType,
        minCpp,
        minCps: minCps || null,
        description: description || null,
        effectiveFrom: effectiveFrom || now,
        effectiveTo: effectiveTo || null,
        enforcedBy: 'admin',
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      data: newMinimum
    });
  } catch (error) {
    console.error('Error creating pricing minimum:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create pricing minimum' },
      { status: 500 }
    );
  }
}

