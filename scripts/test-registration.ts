import { loadEnvConfig } from '@next/env';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';

loadEnvConfig(process.cwd());

type TestScenario = {
  name: string;
  payload: {
    name: string;
    password: string;
    role: 'client' | 'freelancer';
    phone: string;
    account_name?: string;
  };
  expectations: {
    role: string;
    hasAccountName: boolean;
  };
};

const scenarios: TestScenario[] = [
  {
    name: 'Client with account',
    payload: {
      name: 'QA Client Account',
      password: 'TestPass123!',
      role: 'client',
      phone: '+254712345678',
      account_name: 'EssayPro',
    },
    expectations: {
      role: 'client',
      hasAccountName: true,
    },
  },
  {
    name: 'Client without account',
    payload: {
      name: 'QA Client Solo',
      password: 'TestPass123!',
      role: 'client',
      phone: '+254712345679',
    },
    expectations: {
      role: 'client',
      hasAccountName: false,
    },
  },
  {
    name: 'Freelancer',
    payload: {
      name: 'QA Freelancer',
      password: 'TestPass123!',
      role: 'freelancer',
      phone: '+254712345680',
    },
    expectations: {
      role: 'freelancer',
      hasAccountName: false,
    },
  },
];

type ScenarioDeps = {
  registerPost: typeof import('@/app/api/auth/register/route').POST;
  verifyPost: typeof import('@/app/api/auth/verify-code/route').POST;
  db: typeof import('@/db').db;
  pendingRegistrations: typeof import('@/db/schema').pendingRegistrations;
  users: typeof import('@/db/schema').users;
};

async function runScenario(scenario: TestScenario, deps: ScenarioDeps) {
  const email = `${scenario.payload.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@gmail.com`;

  const registerReq = new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...scenario.payload, email }),
  });

  const registerRes = await deps.registerPost(registerReq);
  const registerJson = await registerRes.json();

  if (!registerRes.ok) {
    throw new Error(
      `[${scenario.name}] Registration failed: ${JSON.stringify(registerJson)}`
    );
  }

  const [pending] = await deps.db
    .select()
    .from(deps.pendingRegistrations)
    .where(eq(deps.pendingRegistrations.email, email))
    .limit(1);

  if (!pending) {
    throw new Error(`[${scenario.name}] Pending registration not found for ${email}`);
  }

  const verifyReq = new NextRequest('http://localhost/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: pending.verificationCode }),
  });

  const verifyRes = await deps.verifyPost(verifyReq);
  const verifyJson = await verifyRes.json();

  if (!verifyRes.ok) {
    throw new Error(
      `[${scenario.name}] Verification failed: ${JSON.stringify(verifyJson)}`
    );
  }

  const [user] = await deps.db
    .select()
    .from(deps.users)
    .where(eq(deps.users.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`[${scenario.name}] User not found after verification`);
  }

  if (user.role !== scenario.expectations.role) {
    throw new Error(
      `[${scenario.name}] Role mismatch. Expected ${scenario.expectations.role}, got ${user.role}`
    );
  }

  const hasAccountName = Boolean(user.accountName);
  if (hasAccountName !== scenario.expectations.hasAccountName) {
    throw new Error(
      `[${scenario.name}] Account name expectation mismatch (expected ${scenario.expectations.hasAccountName}, got ${hasAccountName})`
    );
  }

  // Cleanup user to avoid polluting DB with test accounts
  await deps.db.delete(deps.users).where(eq(deps.users.email, email));

  return {
    name: scenario.name,
    email,
    displayId: user.displayId,
    role: user.role,
    accountName: user.accountName,
    status: user.status,
  };
}

async function main() {
  const [{ POST: registerPost }, { POST: verifyPost }, { db }, schema] = await Promise.all([
    import('@/app/api/auth/register/route'),
    import('@/app/api/auth/verify-code/route'),
    import('@/db'),
    import('@/db/schema'),
  ]);

  const deps: ScenarioDeps = {
    registerPost,
    verifyPost,
    db,
    pendingRegistrations: schema.pendingRegistrations,
    users: schema.users,
  };

  const results: Array<{
    scenario: string;
    status: 'passed' | 'failed';
    result?: Record<string, unknown>;
    error?: string;
  }> = [];

  for (const scenario of scenarios) {
    try {
      const result = await runScenario(scenario, deps);
      console.log(`✅ ${scenario.name} passed`, result);
      results.push({ scenario: scenario.name, status: 'passed', result });
    } catch (error) {
      console.error(`❌ ${scenario.name} failed`, error);
      results.push({
        scenario: scenario.name,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.table(results);
}

main().catch((error) => {
  console.error('Registration test script failed:', error);
  process.exit(1);
});

