import { db } from '@/db';
import {
  freelancerProfiles,
  freelancerSubjectMap,
  freelancerSubjects,
  jobs,
  users,
} from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

const ACTIVE_LOAD_STATUSES = ['in_progress', 'editing', 'revision', 'on_hold', 'delivered'] as const;

export interface RecommendedFreelancer {
  id: number;
  name: string;
  phone?: string | null;
  rating: number;
  ratingCount?: number;
  presenceStatus?: string | null;
  availability?: string | null;
  activeLoad: number;
  subjectMatch: boolean;
  score: number;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function safeParseJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function computeScore(params: {
  subjectMatch: boolean;
  rating: number;
  presenceStatus?: string | null;
  availability?: string | null;
  activeLoad: number;
}): number {
  const ratingScore = Math.max(0, Math.min(5, params.rating));
  const presenceBoost = params.presenceStatus && params.presenceStatus !== 'offline' ? 0.5 : 0;
  const availabilityBoost = params.availability === 'full-time' ? 0.4 : params.availability === 'part-time' ? 0.2 : 0;
  const subjectBoost = params.subjectMatch ? 1.5 : 0;
  const loadPenalty = Math.max(0, params.activeLoad) * 0.25;
  return subjectBoost + ratingScore + presenceBoost + availabilityBoost - loadPenalty;
}

export async function recommendFreelancersForOrder(params: {
  orderId: number;
  limit?: number;
  activeLoadCap?: number;
}): Promise<RecommendedFreelancer[]> {
  const { orderId } = params;
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);
  const activeLoadCap = Math.min(Math.max(params.activeLoadCap ?? 5, 1), 50);

  const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId)).limit(1);
  if (!order) return [];

  const orderNeedle = `${normalizeText(order.workType)} ${normalizeText(order.title)}`;

  type FreelancerRow = {
    id: number;
    name: string;
    phone: string | null;
    approved: boolean;
    status: string | null;
    rating: number | null;
    ratingAverage: number | null;
    ratingCount: number | null;
    presenceStatus: string | null;
    availability: string | null;
    skills: string | null;
  };

  const freelancerRows = (await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      approved: users.approved,
      status: users.status,
      rating: users.rating,
      ratingAverage: users.ratingAverage,
      ratingCount: users.ratingCount,
      presenceStatus: users.presenceStatus,
      availability: freelancerProfiles.availability,
      skills: freelancerProfiles.skills,
    })
    .from(users)
    .leftJoin(freelancerProfiles, eq(freelancerProfiles.userId, users.id))
    .where(and(eq(users.role, 'freelancer'), eq(users.approved, true)))) as FreelancerRow[];

  const freelancerIds = freelancerRows
    .map((row: FreelancerRow) => Number(row.id))
    .filter((id: number) => Number.isFinite(id));
  if (freelancerIds.length === 0) return [];

  const loadRows = await db
    .select({
      freelancerId: jobs.assignedFreelancerId,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(jobs)
    .where(and(inArray(jobs.status, ACTIVE_LOAD_STATUSES as any), inArray(jobs.assignedFreelancerId, freelancerIds as any)))
    .groupBy(jobs.assignedFreelancerId);

  const loadByFreelancerId = new Map<number, number>();
  for (const row of loadRows) {
    if (row.freelancerId != null) loadByFreelancerId.set(Number(row.freelancerId), Number(row.count || 0));
  }

  const subjectRows = await db
    .select({
      freelancerId: freelancerSubjectMap.freelancerId,
      subjectName: freelancerSubjects.name,
    })
    .from(freelancerSubjectMap)
    .leftJoin(freelancerSubjects, eq(freelancerSubjectMap.subjectId, freelancerSubjects.id))
    .where(inArray(freelancerSubjectMap.freelancerId, freelancerIds as any));

  const subjectsByFreelancerId = new Map<number, string[]>();
  for (const row of subjectRows) {
    const fid = Number(row.freelancerId);
    if (!subjectsByFreelancerId.has(fid)) subjectsByFreelancerId.set(fid, []);
    if (row.subjectName) subjectsByFreelancerId.get(fid)!.push(String(row.subjectName));
  }

  const recommended: RecommendedFreelancer[] = [];

  for (const freelancer of freelancerRows) {
    const id = Number(freelancer.id);
    const activeLoad = loadByFreelancerId.get(id) ?? 0;
    if (activeLoad >= activeLoadCap) continue;

    const rating = Number(
      typeof freelancer.ratingAverage === 'number'
        ? freelancer.ratingAverage
        : typeof freelancer.rating === 'number'
          ? freelancer.rating
          : 0
    );

    const subjectNames = (subjectsByFreelancerId.get(id) ?? []).map(normalizeText);
    const subjectMatch = subjectNames.some((s) => s && orderNeedle.includes(s));

    const skills = safeParseJsonArray(freelancer.skills).map(normalizeText);
    const skillsMatch = skills.some((s) => s && orderNeedle.includes(s));

    const match = subjectMatch || skillsMatch;

    const score = computeScore({
      subjectMatch: match,
      rating,
      presenceStatus: freelancer.presenceStatus,
      availability: freelancer.availability,
      activeLoad,
    });

    recommended.push({
      id,
      name: String(freelancer.name || ''),
      phone: freelancer.phone ? String(freelancer.phone) : null,
      rating,
      ratingCount: freelancer.ratingCount ?? undefined,
      presenceStatus: freelancer.presenceStatus ? String(freelancer.presenceStatus) : null,
      availability: freelancer.availability ? String(freelancer.availability) : null,
      activeLoad,
      subjectMatch: match,
      score,
    });
  }

  return recommended
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

