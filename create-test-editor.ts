/**
 * Create Test Editor Account
 * 
 * This script creates a test editor account for verifying
 * the editor dashboard functionality.
 * 
 * Usage: npx tsx create-test-editor.ts
 */

import 'dotenv/config';
import { db } from './src/db/index';
import { users } from './src/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createTestEditor() {
  try {
    console.log('🔍 Checking for existing test editor...');
    
    // Check if test editor already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, 'editor@test.com'))
      .limit(1);

    if (existing.length > 0) {
      console.log('⚠️  Test editor already exists:');
      console.log('   Email: editor@test.com');
      console.log('   Name:', existing[0].name);
      console.log('   Role:', existing[0].role);
      console.log('   Status:', existing[0].status);
      console.log('   Display ID:', existing[0].displayId);
      console.log('\n✅ No action needed.');
      return;
    }

    console.log('✨ Creating test editor account...');

    // Hash password
    const hashedPassword = await bcrypt.hash('editor123', 10);

    // Generate display ID
    const displayId = `ED-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const now = new Date().toISOString();
    
    // Create editor account - all required fields matching schema
    const result = await db.insert(users).values({
      displayId,
      email: 'editor@test.com',
      password: hashedPassword,
      name: 'Test Editor',
      role: 'editor',
      roleId: 5, // Editor role ID from role-map.ts
      phone: '+254712345678',
      approved: true,
      emailVerified: true,
      status: 'approved',
      balance: 0,
      earned: 0,
      totalEarnings: 0,
      ratingAverage: 0,
      ratingCount: 0,
      badgeList: '[]',
      presenceStatus: 'offline',
      totalEarned: 0,
      totalSpent: 0,
      completedJobs: 0,
      loginCount: 0,
      clientTier: 'basic',
      clientPriority: 'regular',
      skillsCompleted: false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    console.log('\n✅ Test editor account created successfully!');
    console.log('\n📋 Account Details:');
    console.log('   Email: editor@test.com');
    console.log('   Password: editor123');
    console.log('   Name: Test Editor');
    console.log('   Role: editor');
    console.log('   Display ID:', displayId);
    console.log('   Status: active');
    console.log('   Approved: Yes');
    console.log('\n🔐 Login URL: http://localhost:5000/login');
    console.log('\n📊 Dashboard URL: http://localhost:5000/editor/dashboard');
    console.log('\n⚠️  IMPORTANT: This is a TEST account. Do NOT use in production.');
    
  } catch (error) {
    console.error('❌ Error creating test editor:', error);
    process.exit(1);
  }
}

// Run the script
createTestEditor()
  .then(() => {
    console.log('\n✨ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
