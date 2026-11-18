import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const password = 'kemoda11';
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const testUsers = [
      { email: 'admin.tasklynk@gmail.com', name: 'Admin User', roleId: 1 },
      { email: 'manager.tasklynk@gmail.com', name: 'Manager User', roleId: 2 },
      { email: 'client.tasklynk@gmail.com', name: 'Client User', roleId: 3 },
      { email: 'freelancer.tasklynk@gmail.com', name: 'Freelancer User', roleId: 4 },
    ];

    const results = [];

    for (const userData of testUsers) {
      const existing = await db.execute(sql`SELECT id, email FROM users WHERE email = ${userData.email}`);

      if (existing.rows.length > 0) {
        await db.execute(sql`UPDATE users SET password = ${hashedPassword}, status = ${'approved'}, approved_at = ${now} WHERE email = ${userData.email}`);
        results.push({ email: userData.email, status: 'updated_and_approved' });
      } else {
        await db.execute(sql`INSERT INTO users (email, password, name, role_id, status, approved_at, created_at) VALUES (${userData.email}, ${hashedPassword}, ${userData.name}, ${userData.roleId}, 'approved', ${now}, ${now})`);
        results.push({ email: userData.email, status: 'created_and_approved' });
      }
    }

    // Fetch all created users
    const allTestUsers = await db.execute(sql`SELECT id, email, name, role_id, status, approved_at FROM users WHERE email IN (${'admin.tasklynk@gmail.com'}, ${'manager.tasklynk@gmail.com'}, ${'client.tasklynk@gmail.com'}, ${'freelancer.tasklynk@gmail.com'})`);


    return NextResponse.json({
      success: true,
      message: '✅ 4 test users created/updated and APPROVED successfully!',
      password: 'kemoda11',
      loginInstructions: 'All users are now approved and ready to login with password: kemoda11',
      testAccounts: [
        { email: 'admin.tasklynk@gmail.com', role: 'Admin' },
        { email: 'manager.tasklynk@gmail.com', role: 'Manager' },
        { email: 'client.tasklynk@gmail.com', role: 'Client' },
        { email: 'freelancer.tasklynk@gmail.com', role: 'Freelancer' },
      ],
      users: allTestUsers.rows,
      summary: results
    });
  } catch (error: any) {
    console.error('[Create Test Users] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create test users', details: error.message },
      { status: 500 }
    );
  }
}

