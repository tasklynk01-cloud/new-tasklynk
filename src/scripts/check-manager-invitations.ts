import { db } from '@/db';
import { managerInvitations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function checkManagerInvitations() {
  try {
    
    // Get all invitations
    const invites = await db.select().from(managerInvitations);
    
    if (invites.length === 0) {
    } else {
      invites.forEach((invite, index) => {
      });
    }

    // Check existing managers
    const managers = await db.select().from(users).where(eq(users.role, 'manager'));
    
    if (managers.length === 0) {
    } else {
      managers.forEach((manager, index) => {
      });
    }

    // Create a test invitation if none exist
    if (invites.length === 0) {
      
      const testEmail = 'testmanager@gmail.com';
      const testToken = `mgr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(managerInvitations).values({
        email: testEmail,
        token: testToken,
        createdBy: null,
        createdAt: new Date().toISOString(),
        used: false,
        usedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
      
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkManagerInvitations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });

