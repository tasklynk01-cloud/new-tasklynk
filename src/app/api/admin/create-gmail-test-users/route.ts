import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash('Test123!', 10);

    const testUsers = [
      {
        displayId: 'ADM#TEST001',
        email: 'testadmin@gmail.com',
        name: 'Test Admin',
        role: 'admin' as const,
        phone: '+254700000001',
      },
      {
        displayId: 'MGR#TEST001',
        email: 'testmanager@gmail.com',
        name: 'Test Manager',
        role: 'manager' as const,
        phone: '+254700000002',
      },
      {
        displayId: 'CLT#TEST001',
        email: 'testclient@gmail.com',
        name: 'Test Client',
        role: 'client' as const,
        phone: '+254700000003',
      },
      {
        displayId: 'FRL#TEST001',
        email: 'testfreelancer@gmail.com',
        name: 'Test Freelancer',
        role: 'freelancer' as const,
        phone: '+254700000004',
      },
    ];

    const created = [];

    for (const user of testUsers) {
      try {
        // Check if user exists using Drizzle ORM
        const [existing] = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing) {
          // Update existing user to ensure they're active and approved
          await db
            .update(users)
            .set({
              approved: true,
              status: 'active',
              emailVerified: true,
              suspendedUntil: null,
              suspensionReason: null,
              rejectedAt: null,
              rejectionReason: null,
              updatedAt: now,
            })
            .where(eq(users.email, user.email));
          created.push({ ...user, status: 'updated', id: existing.id });
        } else {
          // Insert new user using Drizzle ORM
          const [newUser] = await db
            .insert(users)
            .values({
              displayId: user.displayId,
              email: user.email,
              password: passwordHash,
              name: user.name,
              role: user.role,
              approved: true,
              emailVerified: true,
              balance: 0,
              earned: 0,
              totalEarnings: 0,
              rating: 0,
              phone: user.phone,
              status: 'active',
              totalEarned: 0,
              totalSpent: 0,
              completedJobs: 0,
              createdAt: now,
              updatedAt: now,
            })
            .returning({ id: users.id });
          
          created.push({ 
            ...user, 
            status: 'created',
            id: newUser?.id || null 
          });
        }
      } catch (userError: any) {
        console.error(`Error processing user ${user.email}:`, userError);
        created.push({ ...user, status: 'error', error: userError.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: '4 test users with @gmail.com emails have been created/updated',
      users: created,
      credentials: {
        password: 'Test123!',
        loginUrl: '/login',
        accounts: [
          { email: 'testadmin@gmail.com', role: 'admin', dashboard: '/admin/dashboard' },
          { email: 'testmanager@gmail.com', role: 'manager', dashboard: '/manager/dashboard' },
          { email: 'testclient@gmail.com', role: 'client', dashboard: '/client/dashboard' },
          { email: 'testfreelancer@gmail.com', role: 'freelancer', dashboard: '/freelancer/dashboard' },
        ]
      }
    });
  } catch (error: any) {
    console.error('Error creating test users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test users', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

