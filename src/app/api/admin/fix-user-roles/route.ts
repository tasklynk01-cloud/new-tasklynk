import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Get all users
    const usersResult = await db.execute(sql`SELECT id, display_id, email FROM users`);
    const users = usersResult.rows;


    const updates: string[] = [];
    const errors: string[] = [];

    for (const user of users) {
      const displayId = user.display_id as string;
      const userId = user.id as number;
      const email = user.email as string;
      let role = 'client'; // default

      // Determine role based on display_id or email
      if (displayId?.startsWith('A')) {
        role = 'admin';
      } else if (displayId?.startsWith('M')) {
        role = 'manager';
      } else if (displayId?.startsWith('F')) {
        role = 'freelancer';
      } else if (displayId?.startsWith('C')) {
        role = 'client';
      }

      // Check if this is a known admin email
      const adminEmails = [
        'topwriteessays@gmail.com',
        'm.d.techpoint25@gmail.com',
        'maguna956@gmail.com',
        'tasklynk01@gmail.com',
        'maxwellotieno11@gmail.com',
        'ashleydothy3162@gmail.com'
      ];

      if (adminEmails.includes(email.toLowerCase())) {
        role = 'admin';
      }

      try {
        await db.execute(sql`UPDATE users SET role = ${role} WHERE id = ${userId}`);
        updates.push(`✅ User ${userId} (${displayId}): Set role to ${role}`);
      } catch (error: any) {
        errors.push(`❌ User ${userId}: ${error.message}`);
        console.error(`❌ Failed to update user ${userId}:`, error);
      }
    }

    // Verify the updates
    const verifyResult = await db.execute(sql`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `);

    return NextResponse.json({
      success: true,
      message: 'User roles fixed successfully',
      updates,
      errors,
      totalProcessed: users.length,
      roleDistribution: verifyResult.rows,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fix roles error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fix roles',
      details: error.toString(),
    }, { status: 500 });
  }
}

