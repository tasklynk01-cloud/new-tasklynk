import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function checkUser() {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, 77)).limit(1);
    console.log('User 77 full data:');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('\n--- Key fields ---');
    console.log('ID:', user?.id);
    console.log('Name:', user?.name);
    console.log('Email:', user?.email);
    console.log('Role:', user?.role);
    console.log('Status:', user?.status);
    console.log('Approved:', user?.approved);
    console.log('Updated At:', user?.updatedAt);
    
    // Now try the update
    console.log('\n--- Attempting update ---');
    const now = new Date().toISOString();
    const result = await db.update(users).set({ 
      approved: true,
      status: 'approved',  // FIXED: Changed from 'active' to 'approved'
      updatedAt: now 
    }).where(eq(users.id, 77));
    
    console.log('Update result:', result);
    
    // Check after update
    const [updatedUser] = await db.select().from(users).where(eq(users.id, 77)).limit(1);
    console.log('\n--- After update ---');
    console.log('Status:', updatedUser?.status);
    console.log('Approved:', updatedUser?.approved);
    console.log('Updated At:', updatedUser?.updatedAt);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
  process.exit(0);
}

checkUser();
