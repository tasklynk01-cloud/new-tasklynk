import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Get user info
    const userResult = await db.execute(sql`SELECT id, email, name, role_id, status, approved_at, created_at FROM users WHERE email = ${email.trim().toLowerCase()}`);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        status: user.status,
        approved_at: user.approved_at,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Check user status error:', error);
    return NextResponse.json({
      error: 'Failed to check user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

