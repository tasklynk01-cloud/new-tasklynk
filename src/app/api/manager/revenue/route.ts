import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, payments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const managerId = request.nextUrl.searchParams.get('managerId');

    if (!managerId) {
      return NextResponse.json(
        { error: 'Missing managerId' },
        { status: 400 }
      );
    }

    // 🔴 CRITICAL FIX: Get jobs with actual CPP to calculate revenue properly
    const managerJobs = await db
      .select({
        id: jobs.id,
        amount: jobs.amount,
        pages: jobs.pages,
        slides: jobs.slides,
        workType: jobs.workType,
        clientCpp: jobs.clientCpp,
        effectiveCpp: jobs.effectiveCpp,
        baseCpp: jobs.baseCpp,
        singleSpaced: jobs.singleSpaced,
        status: jobs.status,
        freelancerEarnings: jobs.freelancerEarnings,
      })
      .from(jobs)
      .where(eq(jobs.managerId, parseInt(managerId)));

    const jobIds = managerJobs.map((j) => j.id);

    let totalRevenue = 0;
    let writerPayouts = 0;
    let completedOrders = 0;

    if (jobIds.length > 0) {
      // Calculate revenue based on actual CPP paid by clients
      for (const job of managerJobs) {
        if (job.status === 'completed' || job.status === 'paid' || job.status === 'approved') {
          const pages = Number(job.pages || 0);
          const slides = Number(job.slides || 0);
          const pageMultiplier = job.singleSpaced ? 2 : 1;
          const effectivePages = pages * pageMultiplier;
          const resolvedClientCpp = job.clientCpp ?? job.effectiveCpp ?? job.baseCpp ?? 0;
          const normalizedClientCpp = Number.isFinite(resolvedClientCpp) ? Number(resolvedClientCpp) : 0;

          let jobRevenue = Number(job.amount ?? 0);

          if (!jobRevenue) {
            const isSlidesOrder = (job.workType || '').toLowerCase() === 'slides';
            if (isSlidesOrder) {
              jobRevenue = slides * normalizedClientCpp;
            } else {
              jobRevenue = effectivePages * normalizedClientCpp + slides * normalizedClientCpp;
            }
          }

          if (!Number.isFinite(jobRevenue) || jobRevenue < 0) {
            jobRevenue = 0;
          }

          totalRevenue += jobRevenue;
          
          // Add freelancer earnings as writer payouts
          writerPayouts += job.freelancerEarnings || 0;
          
          completedOrders += 1;
        }
      }
    }

    const totalCommission = totalRevenue - writerPayouts;

    const monthlyData = [
      { month: 'Jan', revenue: totalRevenue * 0.3, commissions: totalCommission * 0.3 },
      { month: 'Feb', revenue: totalRevenue * 0.4, commissions: totalCommission * 0.4 },
      { month: 'Mar', revenue: totalRevenue, commissions: totalCommission },
    ];

    return NextResponse.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      writerPayouts: parseFloat(writerPayouts.toFixed(2)),
      completedOrders,
      monthlyData,
    });
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}

