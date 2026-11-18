/**
 * POST /api/admin/add-new-admins
 * 
 * Adds the new admin users with the specified password.
 * This is a one-time seed endpoint.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, balances } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const admins = [
      { email: 'maxwellotieno11@gmail.com', name: 'Maxwell Otieno' },
      { email: 'm.d.techpoint25@gmail.com', name: 'MD TechPoint' },
      { email: 'cylintech60@gmail.com', name: 'Cylin Tech' },
    ];

    const password = '33707896';
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    // Find which already exist
    const existing = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.email, admins.map((a) => a.email)));

    const existingEmails = new Set(existing.map((u) => u.email));
    const existingMap = new Map(existing.map((u) => [u.email, u.id]));

    // Prepare users to create
    const toCreate = admins
      .filter((a) => !existingEmails.has(a.email))
      .map((a, i) => ({
        displayId: `ADMN#${String(Date.now() + i).slice(-4)}`,
        email: a.email,
        password: passwordHash,
        name: a.name,
        role: 'admin' as const,
        roleId: 1,
        approved: true,
        phone: '+254700000' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }));

    const created: { id: number; email: string }[] = [];
    const updated: { id: number; email: string }[] = [];

    // Insert new admins one-by-one
    for (const u of toCreate) {
      try {
        const res = await db
          .insert(users)
          .values(u)
          .returning({ id: users.id, email: users.email });
        if (res && res[0]) {
          created.push(res[0]);

          // Create balance record for new admin
          await db.insert(balances).values({
            userId: res[0].id,
            availableBalance: 0,
            pendingBalance: 0,
            reservedBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
            createdAt: now,
            updatedAt: now,
          }).onConflictDoNothing();
        }
      } catch (err) {
        console.error(`Failed to create admin ${u.email}:`, err);
        // Try to select if it exists
        const sel = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.email, u.email))
          .limit(1);
        if (sel[0]) created.push(sel[0]);
      }
    }

    // Update existing users to be admins with new password
    for (const [email, userId] of existingMap) {
      try {
        await db
          .update(users)
          .set({
            password: passwordHash,
            role: 'admin',
            roleId: 1,
            approved: true,
            status: 'active',
            updatedAt: now,
          })
          .where(eq(users.id, userId));

        updated.push({ id: userId, email });

        // Ensure balance record exists
        await db.insert(balances).values({
          userId,
          availableBalance: 0,
          pendingBalance: 0,
          reservedBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          createdAt: now,
          updatedAt: now,
        }).onConflictDoNothing();
      } catch (err) {
        console.error(`Failed to update admin ${email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin users processed',
      created: created.length,
      updated: updated.length,
      details: {
        created: created.map((u) => u.email),
        updated: updated.map((u) => u.email),
      },
      loginCredentials: {
        emails: admins.map((a) => a.email),
        password: password,
      },
    });
  } catch (error) {
    console.error('Error adding admin users:', error);
    return NextResponse.json(
      { error: 'Failed to add admin users', details: String(error) },
      { status: 500 }
    );
  }
}

