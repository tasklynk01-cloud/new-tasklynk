import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getManagerScopedJobIds } from '@/lib/manager-job-scope';

export type MessagingActor = {
  id: number;
  role: string;
  accountId?: number | null;
  domainId?: number | null;
};

type MessageJob = {
  id: number;
  clientId: number;
  assignedFreelancerId: number | null;
  managerId: number | null;
};

type MessageParticipant = {
  id: number;
  role: string;
  accountId: number | null;
  domainId: number | null;
};

export type JobMessageAccessResult = {
  allowed: boolean;
  status: number;
  reason: string;
  job?: MessageJob;
};

async function getJob(jobId: number): Promise<MessageJob | null> {
  const [job] = await db
    .select({
      id: jobs.id,
      clientId: jobs.clientId,
      assignedFreelancerId: jobs.assignedFreelancerId,
      managerId: jobs.managerId,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  return job || null;
}

async function getParticipant(userId: number): Promise<MessageParticipant | null> {
  const [participant] = await db
    .select({
      id: users.id,
      role: users.role,
      accountId: users.accountId,
      domainId: users.domainId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return participant || null;
}

async function clientCanAccessJob(actor: MessagingActor, job: MessageJob): Promise<boolean> {
  if (job.clientId === actor.id) {
    return true;
  }

  const jobClient = await getParticipant(job.clientId);
  if (!jobClient) {
    return false;
  }

  if (actor.accountId && jobClient.accountId && actor.accountId === jobClient.accountId) {
    return true;
  }

  if (actor.domainId && jobClient.domainId && actor.domainId === jobClient.domainId) {
    return true;
  }

  return false;
}

export async function getJobMessageAccess(actor: MessagingActor, jobId: number): Promise<JobMessageAccessResult> {
  const job = await getJob(jobId);

  if (!job) {
    return {
      allowed: false,
      status: 404,
      reason: 'Job not found',
    };
  }

  const role = String(actor.role || '').toLowerCase().trim();

  if (role === 'admin') {
    return { allowed: true, status: 200, reason: 'Admin access', job };
  }

  if (role === 'manager') {
    if (job.managerId === actor.id) {
      return { allowed: true, status: 200, reason: 'Manager assigned to job', job };
    }

    const scopedJobIds = await getManagerScopedJobIds(actor.id);
    if (scopedJobIds.includes(jobId)) {
      return { allowed: true, status: 200, reason: 'Manager scoped access', job };
    }

    return { allowed: false, status: 403, reason: 'You do not have access to this job conversation' };
  }

  if (role === 'freelancer' || role === 'writer') {
    return job.assignedFreelancerId === actor.id
      ? { allowed: true, status: 200, reason: 'Freelancer assigned to job', job }
      : { allowed: false, status: 403, reason: 'You do not have access to this job conversation' };
  }

  if (role === 'client' || role === 'account_owner') {
    const allowed = await clientCanAccessJob(actor, job);
    return allowed
      ? { allowed: true, status: 200, reason: 'Client access to job', job }
      : { allowed: false, status: 403, reason: 'You do not have access to this job conversation' };
  }

  return {
    allowed: false,
    status: 403,
    reason: 'Your role cannot access this conversation',
  };
}

export async function getAccessibleJobIdsForMessaging(actor: MessagingActor): Promise<number[] | null> {
  const role = String(actor.role || '').toLowerCase().trim();

  if (role === 'admin') {
    return null;
  }

  if (role === 'manager') {
    return getManagerScopedJobIds(actor.id);
  }

  if (role === 'freelancer' || role === 'writer') {
    const rows = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.assignedFreelancerId, actor.id));

    return rows.map((row) => row.id);
  }

  if (role === 'client' || role === 'account_owner') {
    const candidateClientIds = new Set<number>([actor.id]);

    if (actor.accountId || actor.domainId) {
      const linkedUsers = await db
        .select({ id: users.id })
        .from(users);

      for (const linkedUser of linkedUsers) {
        const participant = await getParticipant(linkedUser.id);
        if (!participant) continue;

        const sameAccount = actor.accountId && participant.accountId && actor.accountId === participant.accountId;
        const sameDomain = actor.domainId && participant.domainId && actor.domainId === participant.domainId;

        if (sameAccount || sameDomain) {
          candidateClientIds.add(participant.id);
        }
      }
    }

    const clientIds = Array.from(candidateClientIds);
    const rows = clientIds.length === 0
      ? []
      : await db
          .select({ id: jobs.id })
          .from(jobs)
          .where(inArray(jobs.clientId, clientIds));

    return rows.map((row) => row.id);
  }

  return [];
}

export async function canCreateConversationForJob(
  actor: MessagingActor,
  participantId: number,
  jobId: number
): Promise<boolean> {
  const access = await getJobMessageAccess(actor, jobId);
  if (!access.allowed || !access.job) {
    return false;
  }

  if (participantId === actor.id) {
    return false;
  }

  const participant = await getParticipant(participantId);
  if (!participant) {
    return false;
  }

  const role = String(actor.role || '').toLowerCase().trim();

  if (role === 'admin') {
    return [access.job.clientId, access.job.assignedFreelancerId, access.job.managerId].includes(participantId)
      || participant.role === 'admin'
      || participant.role === 'manager';
  }

  if (role === 'manager') {
    return [access.job.clientId, access.job.assignedFreelancerId, access.job.managerId].includes(participantId)
      || participant.role === 'admin';
  }

  if (role === 'client' || role === 'account_owner') {
    return participantId === access.job.assignedFreelancerId
      || participantId === access.job.managerId
      || participant.role === 'admin';
  }

  if (role === 'freelancer' || role === 'writer') {
    return participantId === access.job.clientId
      || participantId === access.job.managerId
      || participant.role === 'admin';
  }

  return false;
}

