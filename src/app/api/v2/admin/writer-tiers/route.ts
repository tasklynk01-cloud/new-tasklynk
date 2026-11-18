import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { writerTiers } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

// GET - Fetch all writer tiers
export async function GET(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const tiers = await db
      .select()
      .from(writerTiers)
      .orderBy(writerTiers.minJobs);

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching writer tiers:', error);
    return NextResponse.json({ error: 'Failed to fetch writer tiers' }, { status: 500 });
  }
}

// POST - Create a new writer tier
export async function POST(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { name, minRating, minJobs, minSuccessRate, benefits, color, icon } = body;

    if (!name || minRating === undefined || minJobs === undefined || minSuccessRate === undefined) {
      return NextResponse.json({ 
        error: 'Name, minRating, minJobs, and minSuccessRate are required' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const [newTier] = await db.insert(writerTiers).values({
      name,
      minRating,
      minJobs,
      minSuccessRate,
      benefits: benefits ? JSON.stringify(benefits) : null,
      color: color || '#3B82F6',
      icon: icon || '⭐',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ success: true, tier: newTier });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A tier with this name already exists' }, { status: 400 });
    }
    console.error('Error creating writer tier:', error);
    return NextResponse.json({ error: 'Failed to create writer tier' }, { status: 500 });
  }
}

// PUT - Update a writer tier
export async function PUT(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { id, name, minRating, minJobs, minSuccessRate, benefits, color, icon } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const updateData: any = { updatedAt: now };
    if (name !== undefined) updateData.name = name;
    if (minRating !== undefined) updateData.minRating = minRating;
    if (minJobs !== undefined) updateData.minJobs = minJobs;
    if (minSuccessRate !== undefined) updateData.minSuccessRate = minSuccessRate;
    if (benefits !== undefined) updateData.benefits = JSON.stringify(benefits);
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    const [updatedTier] = await db
      .update(writerTiers)
      .set(updateData)
      .where(eq(writerTiers.id, id))
      .returning();

    if (!updatedTier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, tier: updatedTier });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A tier with this name already exists' }, { status: 400 });
    }
    console.error('Error updating writer tier:', error);
    return NextResponse.json({ error: 'Failed to update writer tier' }, { status: 500 });
  }
}

// DELETE - Delete a writer tier
export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    await db.delete(writerTiers).where(eq(writerTiers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting writer tier:', error);
    return NextResponse.json({ error: 'Failed to delete writer tier' }, { status: 500 });
  }
}

