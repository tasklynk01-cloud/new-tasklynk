import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { writerTiers } from '@/db/schema';
import { requireRole } from '@/lib/admin-auth';
import { eq, desc } from 'drizzle-orm';

// GET /api/v2/writer-tiers - List all writer tiers
export async function GET(request: NextRequest) {
  try {
    // Anyone can view tiers (clients, managers, freelancers need to see them)
    const tiers = await db
      .select()
      .from(writerTiers)
      .orderBy(desc(writerTiers.minJobs)); // Order by progression (highest first)

    return NextResponse.json({ 
      success: true, 
      tiers: tiers.map(tier => ({
        ...tier,
        benefits: tier.benefits || []
      }))
    });
  } catch (error) {
    console.error('Error fetching writer tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writer tiers' },
      { status: 500 }
    );
  }
}

// POST /api/v2/writer-tiers - Create new tier (admin only)
export async function POST(request: NextRequest) {
  try {
    // Validate authentication and role
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { name, minRating, minJobs, minSuccessRate, benefits, color, icon } = body;

    // Validate required fields
    if (!name || minRating === undefined || minJobs === undefined || minSuccessRate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, minRating, minJobs, minSuccessRate' },
        { status: 400 }
      );
    }

    // Validate ranges
    if (minRating < 0 || minRating > 5) {
      return NextResponse.json(
        { error: 'minRating must be between 0 and 5' },
        { status: 400 }
      );
    }

    if (minSuccessRate < 0 || minSuccessRate > 1) {
      return NextResponse.json(
        { error: 'minSuccessRate must be between 0 and 1' },
        { status: 400 }
      );
    }

    if (minJobs < 0) {
      return NextResponse.json(
        { error: 'minJobs must be a positive number' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const [newTier] = await db.insert(writerTiers).values({
      name,
      minRating,
      minJobs,
      minSuccessRate,
      benefits: benefits || null,
      color: color || '#3B82F6',
      icon: icon || '⭐',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      tier: {
        ...newTier,
        benefits: newTier.benefits || []
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating writer tier:', error);
    
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'A tier with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create writer tier' },
      { status: 500 }
    );
  }
}

