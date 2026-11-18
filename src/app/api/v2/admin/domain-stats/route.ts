import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { domains, users, jobs } from '@/db/schema';
import { eq, sql, count, and, inArray } from 'drizzle-orm';

interface DomainStats {
  totalDomains: number;
  activeDomains: number;
  inactiveDomains: number;
  totalUsersInDomains: number;
  domainsWithUsers: number;
  emptyDomains: number;
  domainsByStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  usersPerDomain: Array<{
    domainId: number;
    domainName: string;
    status: string;
    userCount: number;
    maxUsers: number | null;
    utilizationPercent: number | null;
  }>;
  recentDomains: Array<{
    id: number;
    name: string;
    status: string;
    createdAt: string;
    userCount: number;
  }>;
}

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    // Fetch all domains with user counts
    const domainsWithUsers = await db
      .select({
        id: domains.id,
        name: domains.name,
        description: domains.description,
        status: domains.status,
        maxUsers: domains.maxUsers,
        userCount: sql<number>`CAST(COUNT(DISTINCT ${users.id}) AS INTEGER)`,
        createdAt: domains.createdAt,
        updatedAt: domains.updatedAt,
      })
      .from(domains)
      .leftJoin(users, eq(domains.id, users.domainId))
      .groupBy(domains.id);

    // Calculate statistics
    const totalDomains = domainsWithUsers.length;
    const activeDomains = domainsWithUsers.filter(d => d.status === 'active').length;
    const inactiveDomains = domainsWithUsers.filter(d => d.status === 'inactive').length;
    const suspendedDomains = domainsWithUsers.filter(d => d.status === 'suspended').length;
    
    const domainsWithUsersCount = domainsWithUsers.filter(d => d.userCount > 0).length;
    const emptyDomains = domainsWithUsers.filter(d => d.userCount === 0).length;
    
    const totalUsersInDomains = domainsWithUsers.reduce((sum, d) => sum + (d.userCount || 0), 0);

    // Users per domain with utilization
    const usersPerDomain = domainsWithUsers.map(d => ({
      domainId: d.id,
      domainName: d.name,
      status: d.status,
      userCount: d.userCount || 0,
      maxUsers: d.maxUsers,
      utilizationPercent: d.maxUsers 
        ? Math.round(((d.userCount || 0) / d.maxUsers) * 100) 
        : null,
    })).sort((a, b) => b.userCount - a.userCount);

    // Recent domains (sorted by creation date)
    const recentDomains = [...domainsWithUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(d => ({
        id: d.id,
        name: d.name,
        status: d.status,
        createdAt: d.createdAt,
        userCount: d.userCount || 0,
      }));

    const stats: DomainStats = {
      totalDomains,
      activeDomains,
      inactiveDomains,
      totalUsersInDomains,
      domainsWithUsers: domainsWithUsersCount,
      emptyDomains,
      domainsByStatus: {
        active: activeDomains,
        inactive: inactiveDomains,
        suspended: suspendedDomains,
      },
      usersPerDomain,
      recentDomains,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching domain stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain statistics' },
      { status: 500 }
    );
  }
}

