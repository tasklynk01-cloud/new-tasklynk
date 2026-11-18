import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pendingRegistrations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateUserDisplayId } from '@/app/api/utils/generate-display-id/route';
import { getRoleId } from '@/lib/role-map';

/**
 * Comprehensive registration flow test for all user types:
 * 1. Client with account (e.g., EssayPro)
 * 2. Client without account
 * 3. Freelancer
 * 4. Manager (via invitation system - tested separately)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, cleanup = true } = body;

    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };

    // Test data for each user type
    const testUsers = {
      clientWithAccount: {
        email: `test-client-account-${Date.now()}@gmail.com`,
        password: 'TestPassword123!',
        name: 'Test Client With Account',
        role: 'client',
        phone: '+254712345678',
        accountName: 'EssayPro',
        expectedDisplayIdPrefix: 'CLT#'
      },
      clientWithoutAccount: {
        email: `test-client-${Date.now()}@gmail.com`,
        password: 'TestPassword123!',
        name: 'Test Client Without Account',
        role: 'client',
        phone: '+254712345679',
        accountName: null,
        expectedDisplayIdPrefix: 'CLT#'
      },
      freelancer: {
        email: `test-freelancer-${Date.now()}@gmail.com`,
        password: 'TestPassword123!',
        name: 'Test Freelancer',
        role: 'freelancer',
        phone: '+254712345680',
        accountName: null,
        expectedDisplayIdPrefix: 'FRL#'
      }
    };

    // Helper function to test registration
    async function testRegistration(userData: any, testName: string) {
      const testResult: any = {
        name: testName,
        userType: userData.role,
        accountName: userData.accountName,
        steps: [],
        passed: false,
        error: null
      };

      try {
        // Step 1: Register (create pending registration)
        testResult.steps.push({ step: '1. Registration', status: 'running' });
        
        const normalizedEmail = userData.email.toLowerCase();
        
        // Check if user already exists
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (existingUser.length > 0) {
          testResult.steps[0].status = 'skipped';
          testResult.steps[0].message = 'User already exists, cleaning up first';
          if (cleanup) {
            await db.delete(users).where(eq(users.id, existingUser[0].id));
          }
        }

        // Clean up any pending registrations
        if (cleanup) {
          await db.delete(pendingRegistrations)
            .where(eq(pendingRegistrations.email, normalizedEmail));
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const timestamp = new Date().toISOString();

        // Insert pending registration
        await db.insert(pendingRegistrations).values({
          email: normalizedEmail,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          accountName: userData.accountName,
          verificationCode,
          codeExpiresAt,
          createdAt: timestamp,
        });

        testResult.steps[0].status = 'passed';
        testResult.steps[0].message = 'Pending registration created';

        // Step 2: Verify code (create user)
        testResult.steps.push({ step: '2. Email Verification', status: 'running' });

        // Get pending registration
        const pendingList = await db
          .select()
          .from(pendingRegistrations)
          .where(eq(pendingRegistrations.email, normalizedEmail));

        if (pendingList.length === 0) {
          throw new Error('Pending registration not found');
        }

        const pending = pendingList[0];

        // Verify code matches
        if (pending.verificationCode !== verificationCode) {
          throw new Error('Verification code mismatch');
        }

        // Check expiration
        if (new Date(pending.codeExpiresAt) < new Date()) {
          throw new Error('Verification code expired');
        }

        // Generate display ID
        const displayId = await generateUserDisplayId(userData.role);
        
        // Verify display ID format
        if (!displayId.startsWith(userData.expectedDisplayIdPrefix)) {
          throw new Error(`Display ID format incorrect. Expected prefix: ${userData.expectedDisplayIdPrefix}, got: ${displayId}`);
        }

        // Determine approval status
        const isAdmin = userData.role === 'admin';
        const initialStatus = (isAdmin || userData.role === 'account_owner') ? 'active' : 'pending';
        const isApproved = (isAdmin || userData.role === 'account_owner') ? true : false;
        const now = new Date().toISOString();

        const roleId = getRoleId(userData.role);

        // Create user
        const [newUser] = await db.insert(users).values({
          displayId,
          email: normalizedEmail,
          password: pending.password,
          name: pending.name,
          phone: pending.phone || '+254700000000',
          role: pending.role,
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
          accountName: pending.accountName || null,
          createdAt: now,
          updatedAt: now,
        }).returning({ 
          id: users.id, 
          displayId: users.displayId,
          email: users.email,
          role: users.role,
          accountName: users.accountName,
          approved: users.approved,
          status: users.status
        });

        testResult.steps[1].status = 'passed';
        testResult.steps[1].message = `User created with display ID: ${newUser.displayId}`;
        testResult.steps[1].userData = {
          id: newUser.id,
          displayId: newUser.displayId,
          email: newUser.email,
          role: newUser.role,
          accountName: newUser.accountName,
          approved: newUser.approved,
          status: newUser.status
        };

        // Step 3: Verify account name is preserved (for account clients)
        if (userData.accountName) {
          testResult.steps.push({ step: '3. Account Name Verification', status: 'running' });
          
          if (newUser.accountName !== userData.accountName) {
            throw new Error(`Account name mismatch. Expected: ${userData.accountName}, got: ${newUser.accountName}`);
          }

          testResult.steps[2].status = 'passed';
          testResult.steps[2].message = `Account name preserved: ${newUser.accountName}`;
        }

        // Step 4: Verify display ID format
        testResult.steps.push({ step: '4. Display ID Format', status: 'running' });
        
        if (!newUser.displayId.startsWith(userData.expectedDisplayIdPrefix)) {
          throw new Error(`Display ID format incorrect. Expected prefix: ${userData.expectedDisplayIdPrefix}, got: ${newUser.displayId}`);
        }

        testResult.steps[testResult.steps.length - 1].status = 'passed';
        testResult.steps[testResult.steps.length - 1].message = `Display ID format correct: ${newUser.displayId}`;

        // Step 5: Clean up pending registration
        testResult.steps.push({ step: '5. Cleanup', status: 'running' });
        await db.delete(pendingRegistrations)
          .where(eq(pendingRegistrations.email, normalizedEmail));
        
        testResult.steps[testResult.steps.length - 1].status = 'passed';
        testResult.steps[testResult.steps.length - 1].message = 'Pending registration cleaned up';

        // Clean up created user if requested
        if (cleanup) {
          await db.delete(users).where(eq(users.id, newUser.id));
          testResult.cleanup = 'User deleted';
        }

        testResult.passed = true;
        testResults.summary.passed++;

      } catch (error: any) {
        testResult.passed = false;
        testResult.error = error.message || String(error);
        testResult.steps.push({ 
          step: 'Error', 
          status: 'failed', 
          message: error.message 
        });
        testResults.summary.failed++;

        // Cleanup on error
        if (cleanup) {
          try {
            await db.delete(pendingRegistrations)
              .where(eq(pendingRegistrations.email, userData.email.toLowerCase()));
            const existingUser = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, userData.email.toLowerCase()))
              .limit(1);
            if (existingUser.length > 0) {
              await db.delete(users).where(eq(users.id, existingUser[0].id));
            }
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
      } finally {
        testResults.summary.total++;
      }

      testResults.tests.push(testResult);
    }

    // Run tests based on testType
    if (!testType || testType === 'all') {
      await testRegistration(testUsers.clientWithAccount, 'Client with Account (EssayPro)');
      await testRegistration(testUsers.clientWithoutAccount, 'Client without Account');
      await testRegistration(testUsers.freelancer, 'Freelancer');
    } else if (testType === 'clientWithAccount') {
      await testRegistration(testUsers.clientWithAccount, 'Client with Account (EssayPro)');
    } else if (testType === 'clientWithoutAccount') {
      await testRegistration(testUsers.clientWithoutAccount, 'Client without Account');
    } else if (testType === 'freelancer') {
      await testRegistration(testUsers.freelancer, 'Freelancer');
    }

    // Calculate success rate
    testResults.summary.successRate = testResults.summary.total > 0
      ? ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2) + '%'
      : '0%';

    return NextResponse.json(testResults, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test execution failed',
      message: error.message || String(error),
      stack: error.stack
    }, { status: 500 });
  }
}


