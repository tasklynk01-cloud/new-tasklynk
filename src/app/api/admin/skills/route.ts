/**
 * Admin Skills Management API
 * 
 * GET /api/admin/skills - Get all skill options (subjects, software, services)
 * POST /api/admin/skills - Add new skill option
 * PATCH /api/admin/skills - Update skill option status
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerSubjects, freelancerSoftware, freelancerServices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin', 'manager']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const [subjects, software, services] = await Promise.all([
      db.select().from(freelancerSubjects),
      db.select().from(freelancerSoftware),
      db.select().from(freelancerServices),
    ]);

    return NextResponse.json({
      success: true,
      data: { subjects, software, services },
    });
  } catch (error) {
    console.error('[Admin Skills GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
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
    const { type, name } = body;

    if (!type || !name) {
      return NextResponse.json(
        { success: false, error: 'Type and name are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    let result;
    switch (type) {
      case 'subject':
        result = await db.insert(freelancerSubjects).values({
          name,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
        break;
      case 'software':
        result = await db.insert(freelancerSoftware).values({
          name,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
        break;
      case 'service':
        result = await db.insert(freelancerServices).values({
          name,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type. Use: subject, software, or service' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} added successfully`,
    });
  } catch (error: any) {
    console.error('[Admin Skills POST] Error:', error);
    if (error.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { success: false, error: 'This name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to add skill' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { type, id, status } = body;

    if (!type || !id || !status) {
      return NextResponse.json(
        { success: false, error: 'Type, id, and status are required' },
        { status: 400 }
      );
    }

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be active or inactive' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    switch (type) {
      case 'subject':
        await db.update(freelancerSubjects)
          .set({ status, updatedAt: now })
          .where(eq(freelancerSubjects.id, id));
        break;
      case 'software':
        await db.update(freelancerSoftware)
          .set({ status, updatedAt: now })
          .where(eq(freelancerSoftware.id, id));
        break;
      case 'service':
        await db.update(freelancerServices)
          .set({ status, updatedAt: now })
          .where(eq(freelancerServices.id, id));
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type. Use: subject, software, or service' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} status updated to ${status}`,
    });
  } catch (error) {
    console.error('[Admin Skills PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update skill status' },
      { status: 500 }
    );
  }
}

