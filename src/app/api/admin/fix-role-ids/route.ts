import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Correct role_id mapping
const CORRECT_ROLE_MAP: Record<string, number> = {
  'admin': 1,
  'client': 2,
  'manager': 3,
  'freelancer': 4,
  'account_owner': 5
};

export async function POST(request: NextRequest) {
  try {
    // Get all users
    const usersResult = await db.execute(sql`SELECT id, email, role, role_id FROM users`);

    const updates: Array<{ id: number; email: string; oldRoleId: any; newRoleId: number }> = [];

    for (const user of usersResult.rows) {
      const role = String(user.role);
      const currentRoleId = user.role_id;
      const correctRoleId = CORRECT_ROLE_MAP[role];

      if (correctRoleId && currentRoleId !== correctRoleId) {
        await db.execute(sql`UPDATE users SET role_id = ${correctRoleId} WHERE id = ${user.id}`);

        updates.push({
          id: Number(user.id),
          email: String(user.email),
          oldRoleId: currentRoleId,
          newRoleId: correctRoleId
        });

      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} users with incorrect role_id values`,
      updates
    }, { status: 200 });

  } catch (error) {
    console.error('[Fix Role IDs] Error:', error);
    return NextResponse.json({
      error: 'Failed to fix role_id values',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

