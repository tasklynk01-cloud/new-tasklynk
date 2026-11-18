import { db } from '@/db';
import { managerInvitations, users, managers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function testManagerRegistration() {
  try {

    // Step 1: Create a test invitation
    const testEmail = `manager-test-${Date.now()}@tasklynk.test`;
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.insert(managerInvitations).values({
      email: testEmail,
      token,
      createdBy: 1, // Assume admin ID 1
      createdAt: now,
      used: false,
      expiresAt,
    });

    // Step 2: Simulate registration
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const displayId = `MNG${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    // Use raw SQL to insert with role_id
    await db.run(sql`
      INSERT INTO users (
        display_id, email, password, name, role, role_id, phone,
        approved, email_verified, status, created_at, updated_at
      ) VALUES (
        ${displayId}, ${testEmail}, ${hashedPassword}, 'Test Manager', 
        'manager', 3, '+254700000000',
        1, 1, 'approved', ${now}, ${now}
      )
    `);

    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail));


    // Step 3: Mark invitation as used
    await db
      .update(managerInvitations)
      .set({
        used: true,
        usedAt: now,
      })
      .where(eq(managerInvitations.token, token));


    // Step 4: Verify everything
    const [verifyUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, newUser.id));

    const [verifyManager] = await db
      .select()
      .from(managers)
      .where(eq(managers.userId, newUser.id));

    const [verifyInvitation] = await db
      .select()
      .from(managerInvitations)
      .where(eq(managerInvitations.token, token));





    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testManagerRegistration();

