import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Test 1: Check default admin accounts
    const admins = await db.execute(sql`SELECT id, email, name, role_id, status, approved_at FROM users WHERE role_id = 1`);

    // Test 2: Check for any pending users
    const pendingUsers = await db.execute(sql`SELECT id, email, name, role_id, status FROM users WHERE status = ${'pending'}`);

    // Test 3: Check for any rejected users
    const rejectedUsers = await db.execute(sql`SELECT id, email, name, role_id, status FROM users WHERE status = ${'rejected'}`);

    // Test 4: Check for any approved non-admin users
    const approvedUsers = await db.execute(sql`SELECT id, email, name, role_id, status FROM users WHERE status = ${'approved'} AND role_id != 1`);


    return NextResponse.json({
      success: true,
      summary: {
        total_admins: admins.rows.length,
        pending_users: pendingUsers.rows.length,
        rejected_users: rejectedUsers.rows.length,
        approved_non_admin_users: approvedUsers.rows.length
      },
      details: {
        admins: admins.rows.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          status: u.status,
          approved_at: u.approved_at
        })),
        pending_users: pendingUsers.rows.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role_id: u.role_id,
          status: u.status
        })),
        rejected_users: rejectedUsers.rows.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role_id: u.role_id,
          status: u.status
        }))
      }
    });

  } catch (error) {
    console.error('Test registration flow error:', error);
    return NextResponse.json({
      error: 'Failed to test registration flow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

