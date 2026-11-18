#!/usr/bin/env tsx
/**
 * Script to generate displayIds for users who don't have them
 * Follows the same pattern as registration: FRL#, CLT#, MGR#, ADM#, EDT#, ACO#
 */

import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { isNull, or, eq, and, sql } from 'drizzle-orm';

const ROLE_PREFIXES: Record<string, string> = {
  freelancer: 'FRL',
  client: 'CLT',
  manager: 'MGR',
  admin: 'ADM',
  editor: 'EDT',
  account_owner: 'ACO',
};

async function getNextDisplayId(role: string): Promise<string> {
  const prefix = ROLE_PREFIXES[role] || 'USR';
  
  // Get the highest existing display ID for this role
  const existingUsers = await db
    .select({ displayId: users.displayId })
    .from(users)
    .where(
      and(
        eq(users.role, role),
        sql`${users.displayId} IS NOT NULL AND ${users.displayId} != ''`
      )
    );
  
  // Extract numbers from displayIds like "FRL#00000027"
  let maxNumber = 0;
  for (const user of existingUsers) {
    if (user.displayId) {
      const match = user.displayId.match(/#(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
  }
  
  // Generate next number
  const nextNumber = maxNumber + 1;
  const paddedNumber = String(nextNumber).padStart(8, '0');
  return `${prefix}#${paddedNumber}`;
}

async function fixMissingDisplayIds() {
  console.log('🔍 Finding users without displayIds...\n');
  
  // Get users without displayId
  const usersWithoutDisplayId = await db
    .select()
    .from(users)
    .where(
      or(
        isNull(users.displayId),
        eq(users.displayId, '')
      )
    );
  
  console.log(`Found ${usersWithoutDisplayId.length} users without displayIds\n`);
  
  if (usersWithoutDisplayId.length === 0) {
    console.log('✅ All users have displayIds!');
    return;
  }
  
  // Group by role
  const usersByRole: Record<string, typeof usersWithoutDisplayId> = {};
  for (const user of usersWithoutDisplayId) {
    const role = user.role || 'unknown';
    if (!usersByRole[role]) usersByRole[role] = [];
    usersByRole[role].push(user);
  }
  
  console.log('Users by role:');
  Object.entries(usersByRole).forEach(([role, roleUsers]) => {
    console.log(`  ${role}: ${roleUsers.length}`);
  });
  console.log('');
  
  // Fix each user
  let fixed = 0;
  let errors = 0;
  
  for (const user of usersWithoutDisplayId) {
    try {
      const displayId = await getNextDisplayId(user.role || 'unknown');
      
      await db
        .update(users)
        .set({
          displayId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, user.id));
      
      console.log(`✅ User ${user.id} (${user.name}) - ${user.role}: ${displayId}`);
      fixed++;
    } catch (error) {
      console.error(`❌ Failed to fix user ${user.id} (${user.name}):`, error);
      errors++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Fixed: ${fixed}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${usersWithoutDisplayId.length}`);
  
  if (fixed > 0) {
    console.log('\n✅ Successfully generated displayIds for all users!');
  }
}

// Run the script
fixMissingDisplayIds().catch((error) => {
  console.error('Script error:', error);
  process.exit(1);
});
