import 'dotenv/config';
import { db } from '../src/db';
import { users, pendingRegistrations } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { getRoleId } from '../src/lib/role-map';

async function testVerificationInsert() {
  console.log('🧪 Testing user insertion during verification...\n');

  try {
    // Get the actual pending registration
    const pending = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, 'nomaskworld11@gmail.com'))
      .limit(1);
    
    if (pending.length === 0) {
      console.log('❌ No pending registration found for nomaskworld11@gmail.com');
      return;
    }
    
    const reg = pending[0];
    console.log('Found pending registration:', {
      email: reg.email,
      name: reg.name,
      role: reg.role,
      phone: reg.phone
    });
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, reg.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log('\n⚠️ User already exists:', existingUser[0].email);
      console.log('Deleting existing user for test...');
      await db.delete(users).where(eq(users.email, reg.email));
    }
    
    // Prepare user data (mimicking verify-code route)
    const role = reg.role;
    const isAdmin = role === 'admin';
    const isClient = role === 'client' || role === 'account_owner';
    const roleId = getRoleId(role);
    const initialStatus = (isAdmin || isClient) ? 'approved' : 'pending';
    const isApproved = (isAdmin || isClient) ? true : false;
    const now = new Date().toISOString();
    
    // Generate a test display ID
    const displayId = `TEST-${Date.now()}`;
    
    console.log('\n📝 Preparing to insert user with data:');
    const userData = {
      displayId,
      email: reg.email,
      password: reg.password,
      name: reg.name,
      phone: reg.phone || '+254700000000',
      role,
      roleId,
      approved: isApproved,
      emailVerified: true,
      status: initialStatus,
      balance: 0,
      earned: 0,
      totalEarnings: 0,
      totalEarned: 0,
      totalSpent: 0,
      completedJobs: 0,
      loginCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
      badgeList: '[]',
      presenceStatus: 'offline',
      clientTier: 'basic',
      clientPriority: 'regular',
      accountName: reg.accountName || null,
      paymentTerms: (role === 'client' || role === 'account_owner') ? 'pod' : 'pod',
      skillsCompleted: false,
      domainId: null,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log(JSON.stringify(userData, null, 2));
    
    console.log('\n🚀 Attempting to insert user...');
    const [newUser] = await db.insert(users).values(userData).returning({ 
      id: users.id, 
      displayId: users.displayId,
      email: users.email,
      role: users.role 
    });
    
    console.log('\n✅ User inserted successfully!');
    console.log('New user:', newUser);
    
    // Clean up - delete the test user
    console.log('\n🧹 Cleaning up test user...');
    await db.delete(users).where(eq(users.id, newUser.id));
    console.log('✅ Test user deleted');
    
  } catch (error: any) {
    console.error('\n❌ Error during test:', {
      message: error.message,
      code: error.code,
      cause: error.cause,
      stack: error.stack
    });
  }
}

testVerificationInsert()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
