import { db } from '@/db';
import { managerInvitations } from '@/db/schema';
import crypto from 'crypto';

async function createTestInvitation() {
  const email = `test-manager-${Date.now()}@example.com`;
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

  await db.insert(managerInvitations).values({
    email,
    token,
    createdBy: 1, // Admin user
    createdAt: now,
    expiresAt,
    used: false,
  });


  process.exit(0);
}

createTestInvitation();

