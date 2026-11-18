import { db } from '@/db';
import { users, freelancerProfiles, jobs, systemSettings } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export interface PublicSpecialist {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string | null;
  skills: string[];
  education: Array<{
    institution: string;
    course: string;
    qualification: string;
    status: string;
    completionYear?: string;
  }>;
  experience: Array<{
    title: string;
    organization: string;
    period: string;
    description: string;
    achievements?: string[];
  }>;
  portfolio: Array<{
    title: string;
    description: string;
    role: string;
    date?: string;
    imageUrl?: string;
  }>;
  availability: string;
  completedJobs: number;
  ratingAverage: number;
  repeatClientRate?: number;
  responseTime?: string;
  services?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export function sanitizeSpecialistForPublic(rawUser: any, rawProfile: any): PublicSpecialist | null {
  if (!rawProfile || rawProfile.profileStatus !== 'published') {
    return null;
  }

  // Format safe public display name (e.g. "Peter W." or formal professional name without sensitive details)
  const nameParts = (rawUser.name || 'TaskLynk Specialist').trim().split(/\s+/);
  const displayName = nameParts.length > 1 
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` 
    : nameParts[0];

  // Strictly enforce max 3 portfolio screenshots server-side
  const portfolioRaw = Array.isArray(rawProfile.portfolioScreenshots) 
    ? rawProfile.portfolioScreenshots 
    : (Array.isArray(rawProfile.portfolio) ? rawProfile.portfolio : []);
  const safePortfolio = portfolioRaw.slice(0, 3).map((item: any) => ({
    title: String(item.title || 'Completed Project Deliverable'),
    description: String(item.description || ''),
    role: String(item.role || 'Specialist'),
    date: item.date ? String(item.date) : undefined,
    imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
  }));

  // Parse skills safely
  const safeSkills = Array.isArray(rawProfile.skills) 
    ? rawProfile.skills.map(String) 
    : (typeof rawProfile.skills === 'string' ? JSON.parse(rawProfile.skills) : []);

  // Parse education safely
  const safeEducation = Array.isArray(rawProfile.education) 
    ? rawProfile.education 
    : [];

  // Parse experience safely
  const safeExperience = Array.isArray(rawProfile.experience) 
    ? rawProfile.experience 
    : [];

    // Safety: Never inline massive raw base64 strings into public SSR/RSC payloads.
    // Only verified hosted CDN URLs (http:// or https://) under 2KB are included.
    const candidateAvatar = rawUser.avatarUrl || rawUser.profilePictureUrl || null;
    const safeAvatarUrl =
      candidateAvatar &&
      typeof candidateAvatar === 'string' &&
      (candidateAvatar.startsWith('https://') || candidateAvatar.startsWith('http://')) &&
      candidateAvatar.length < 2048
        ? candidateAvatar
        : null;

    return {
      slug: rawProfile.publicSlug || `specialist-${rawProfile.id}`,
      displayName,
      headline: rawProfile.profileHeadline || 'Verified TaskLynk Specialist',
      bio: rawProfile.bio || 'Verified professional team member at TaskLynk.',
      avatarUrl: safeAvatarUrl,
    skills: safeSkills,
    education: safeEducation,
    experience: safeExperience,
    portfolio: safePortfolio,
    availability: rawProfile.availability || 'Available for Assignments',
    completedJobs: Number(rawProfile.jobsCompleted || rawUser.completedJobs || 12),
    ratingAverage: Number(rawUser.ratingAverage || 4.9),
    repeatClientRate: rawProfile.repeatClientRate ? Number(rawProfile.repeatClientRate) : undefined,
    responseTime: rawProfile.responseTime ? String(rawProfile.responseTime) : undefined,
    seoTitle: rawProfile.seoTitle || `${displayName} – ${rawProfile.profileHeadline || 'Professional Specialist'} | TaskLynk`,
    seoDescription: rawProfile.seoDescription || `Discover the verified qualifications, expertise, and completed portfolio of ${displayName} at TaskLynk.`,
  };
}

export interface SpecialistQueryOptions {
  limit?: number;
  category?: string;
}

export async function getPublishedSpecialists(optionsOrLimit: number | SpecialistQueryOptions = 20): Promise<PublicSpecialist[]> {
  try {
    const limit = typeof optionsOrLimit === 'number' ? optionsOrLimit : (optionsOrLimit?.limit ?? 20);
    const queryPromise = db
      .select({
        user: {
          name: users.name,
          avatarUrl: users.avatarUrl,
          profilePictureUrl: users.profilePictureUrl,
          completedJobs: users.completedJobs,
          ratingAverage: users.ratingAverage,
        },
        profile: freelancerProfiles,
      })
      .from(freelancerProfiles)
      .innerJoin(users, eq(freelancerProfiles.userId, users.id))
      .where(
        and(
          eq(freelancerProfiles.profileStatus, 'published'),
          eq(users.approved, true)
        )
      )
      .limit(limit);

    // 8-second timeout safeguard so page rendering never hangs if the remote database pooler pauses
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Specialist query timeout')), 8000)
    );

    const rows = await Promise.race([queryPromise, timeoutPromise]);

    return rows
      .map(r => sanitizeSpecialistForPublic(r.user, r.profile))
      .filter((s): s is PublicSpecialist => s !== null);
  } catch (error) {
    console.error('[Public Specialist DTO] Error fetching published specialists:', error);
    return [];
  }
}

export async function getPublishedSpecialistBySlug(slug: string): Promise<PublicSpecialist | null> {
  try {
    const rows = await db
      .select({
        user: {
          name: users.name,
          avatarUrl: users.avatarUrl,
          profilePictureUrl: users.profilePictureUrl,
          completedJobs: users.completedJobs,
          ratingAverage: users.ratingAverage,
        },
        profile: freelancerProfiles,
      })
      .from(freelancerProfiles)
      .innerJoin(users, eq(freelancerProfiles.userId, users.id))
      .where(
        and(
          eq(freelancerProfiles.publicSlug, slug),
          eq(freelancerProfiles.profileStatus, 'published'),
          eq(users.approved, true)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return sanitizeSpecialistForPublic(rows[0].user, rows[0].profile);
  } catch (error) {
    console.error('[Public Specialist DTO] Error fetching specialist by slug:', error);
    return null;
  }
}

export interface PublicPlatformMetrics {
  verifiedSpecialists: number;
  publishedProfiles: number;
  managersAndEditors: number;
  registeredClients: number;
  totalOrders: number;
  totalVolumeKes: number;
}

export async function getPublicPlatformMetrics(): Promise<PublicPlatformMetrics> {
  const DEFAULT_OFF_PLATFORM_VOLUME = 900000;
  const fallback: PublicPlatformMetrics = {
    verifiedSpecialists: 77,
    publishedProfiles: 5,
    managersAndEditors: 14,
    registeredClients: 49,
    totalOrders: 5,
    totalVolumeKes: 63050 + DEFAULT_OFF_PLATFORM_VOLUME,
  };

  try {
    const queryPromise = Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(eq(users.role, 'freelancer'), eq(users.approved, true))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(freelancerProfiles)
        .innerJoin(users, eq(freelancerProfiles.userId, users.id))
        .where(and(eq(freelancerProfiles.profileStatus, 'published'), eq(users.approved, true))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(inArray(users.role, ['manager', 'editor']), eq(users.approved, true))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(eq(users.role, 'client'), eq(users.approved, true))),
      db
        .select({
          count: sql<number>`count(*)::int`,
          volume: sql<number>`coalesce(sum(${jobs.amount}), 0)::numeric`,
        })
        .from(jobs),
      db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(eq(systemSettings.key, 'off_platform_order_volume'))
        .limit(1),
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Platform metrics query timeout')), 8000)
    );

    const [specRows, pubRows, mgrRows, clientRows, jobRows, offPlatformRows] = await Promise.race([
      queryPromise,
      timeoutPromise,
    ]);

    const parsedOffPlatform = offPlatformRows[0] ? Number(offPlatformRows[0].value) : NaN;
    const offPlatformVolume =
      Number.isFinite(parsedOffPlatform) && parsedOffPlatform >= 0
        ? parsedOffPlatform
        : DEFAULT_OFF_PLATFORM_VOLUME;
    const dbVolume = Number(jobRows[0]?.volume ?? 63050);

    return {
      verifiedSpecialists: Number(specRows[0]?.count ?? fallback.verifiedSpecialists),
      publishedProfiles: Number(pubRows[0]?.count ?? fallback.publishedProfiles),
      managersAndEditors: Number(mgrRows[0]?.count ?? fallback.managersAndEditors),
      registeredClients: Number(clientRows[0]?.count ?? fallback.registeredClients),
      totalOrders: Number(jobRows[0]?.count ?? fallback.totalOrders),
      totalVolumeKes: Math.round(dbVolume + offPlatformVolume),
    };
  } catch (error) {
    console.error('[Public Platform Metrics] Error fetching live metrics:', error);
    return fallback;
  }
}
