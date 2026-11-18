import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerSubjectMap } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

// POST - Save freelancer's selected subjects
export async function POST(request: NextRequest) {
  try {
    // 🔒 AUTHENTICATION: Require freelancer role
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const user = authCheck.user!;
    const body = await request.json();
    const { domainIds } = body;

    // Validate domain IDs
    if (!domainIds || !Array.isArray(domainIds)) {
      return NextResponse.json(
        { error: 'domainIds array is required' },
        { status: 400 }
      );
    }

    if (domainIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one subject must be selected' },
        { status: 400 }
      );
    }

    if (domainIds.length < 7) {
      return NextResponse.json(
        { error: 'At least 7 subjects must be selected' },
        { status: 400 }
      );
    }

    if (domainIds.length > 15) {
      return NextResponse.json(
        { error: 'Maximum 15 subjects allowed' },
        { status: 400 }
      );
    }

    // Validate all IDs are numbers
    const validIds = domainIds.every(id => typeof id === 'number' && !isNaN(id));
    if (!validIds) {
      return NextResponse.json(
        { error: 'All domain IDs must be valid numbers' },
        { status: 400 }
      );
    }

    // Delete existing freelancer subject mappings
    await db
      .delete(freelancerSubjectMap)
      .where(eq(freelancerSubjectMap.freelancerId, user.id));

    // Insert new freelancer subject mappings
    const now = new Date().toISOString();
    const values = domainIds.map(domainId => ({
      freelancerId: user.id,
      subjectId: domainId,
      createdAt: now,
    }));

    await db.insert(freelancerSubjectMap).values(values);

    return NextResponse.json({
      success: true,
      message: 'Subject preferences saved successfully',
      selectedCount: domainIds.length,
    });
  } catch (error) {
    console.error('POST /api/freelancer/subjects error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Get freelancer's selected subjects
export async function GET(request: NextRequest) {
  try {
    // 🔒 AUTHENTICATION: Require freelancer role
    const authCheck = await requireRole(request, ['freelancer']);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const user = authCheck.user!;

    // Get freelancer's selected subjects
    const selected = await db
      .select()
      .from(freelancerSubjectMap)
      .where(eq(freelancerSubjectMap.freelancerId, user.id));

    return NextResponse.json({
      domainIds: selected.map(d => d.subjectId),
      count: selected.length,
    });
  } catch (error) {
    console.error('GET /api/freelancer/subjects error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

