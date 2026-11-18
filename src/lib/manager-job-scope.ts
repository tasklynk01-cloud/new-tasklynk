import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, inArray, or } from 'drizzle-orm';

export async function getManagerScopedJobIds(managerId: number): Promise<number[]> {
  const managedUsers = await db
    .select({
      id: users.id,
      role: users.role,
    })
    .from(users)
    .where(eq(users.assignedManagerId, managerId));

  const clientIds = managedUsers
    .filter((user) => user.role === 'client')
    .map((user) => user.id);

  const freelancerIds = managedUsers
    .filter((user) => user.role === 'freelancer' || user.role === 'writer')
    .map((user) => user.id);

  const jobScopeConditions = [eq(jobs.managerId, managerId)];

  if (clientIds.length > 0) {
    jobScopeConditions.push(inArray(jobs.clientId, clientIds));
  }

  if (freelancerIds.length > 0) {
    jobScopeConditions.push(inArray(jobs.assignedFreelancerId, freelancerIds));
  }

  const scopedJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(or(...jobScopeConditions));

  return [...new Set(scopedJobs.map((job) => job.id))];
}

