import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { users, editorProfiles } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

// Get all editors with their profiles
export async function GET(request: NextRequest) {
  // Validate admin or manager role
  const authCheck = await requireRole(request, ['admin', 'manager']);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    // Get all users with editor role (roleId = 5)
    const editorsData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        displayId: users.displayId,
        approved: users.approved,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.roleId, 5)); // 5 = editor role

    const editorIds = editorsData.map((editor) => editor.id);
    const profiles = editorIds.length
      ? await db
          .select()
          .from(editorProfiles)
          .where(inArray(editorProfiles.userId, editorIds))
      : [];

    // Map profiles to editors
    const profileMap = new Map(profiles.map(p => [p.userId, p]));

    const editors = editorsData.map(editor => {
      const profile = profileMap.get(editor.id);
      return {
        ...editor,
        profile: profile ? {
          specialization: profile.specialization,
          yearsExperience: profile.yearsExperience,
          ordersTouched: profile.ordersTouched || 0,
          clientSatisfactionRate: profile.clientSatisfactionRate || 0,
          isProfileComplete: !!(profile.specialization && profile.yearsExperience !== null),
        } : null,
      };
    });

    return NextResponse.json({ 
      editors,
      total: editors.length,
    });
  } catch (error) {
    console.error('Failed to fetch editors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editors' },
      { status: 500 }
    );
  }
}

