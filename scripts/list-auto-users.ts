import 'dotenv/config';
import { db } from '@/db';
import { users } from '@/db/schema';
import { like, desc } from 'drizzle-orm';

async function main() {
  const results = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    status: users.status,
    createdAt: users.createdAt,
  }).from(users)
    .where(like(users.email, '%auto%'))
    .orderBy(desc(users.id))
    .limit(10);

  console.log('[Users] auto registrations:', results);
}

main().catch((error) => {
  console.error('[Users] query failed:', error);
  process.exitCode = 1;
});
