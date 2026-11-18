import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { calculateWriterEarningsByCPPLevel } from '@/lib/payment-calculations';

// Recalculate all freelancers' balances based on completed and payment-confirmed jobs
// Uses tier-based CPP system with live freelancer completed job counts
export async function POST() {
  try {
    // Get all freelancers
    const freelancers = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'freelancer'));

    let updated = 0;
    const details: { freelancerId: number; newBalance: number; jobCount: number; totalClientAmount: number }[] = [];

    for (const f of freelancers) {
      // Fetch qualifying jobs for each freelancer
      const rows = await db
        .select({
          jobId: jobs.id,
          pages: jobs.pages,
          slides: jobs.slides,
          singleSpaced: jobs.singleSpaced,
          workType: jobs.workType,
          amount: jobs.amount,
          freelancerEarnings: jobs.freelancerEarnings,
          freelancerCompletedJobs: users.completedJobs,
        })
        .from(jobs)
        .leftJoin(users, eq(users.id, jobs.assignedFreelancerId))
        .where(and(
          eq(jobs.assignedFreelancerId, f.id),
          eq(jobs.status, 'completed'),
          eq(jobs.paymentConfirmed, true)
        ));

      // Sum writer earnings using CPP model
      let sumWriter = 0;
      let count = 0;
      let sumClient = 0;
      for (const row of rows) {
        const storedEarnings = Number(row.freelancerEarnings ?? 0);
        const completedOrders = Number(row.freelancerCompletedJobs ?? 0);
        const writerAmount = storedEarnings > 0
          ? storedEarnings
          : calculateWriterEarningsByCPPLevel(
              row.pages ?? 0,
              row.slides ?? 0,
              row.workType ?? '',
              completedOrders,
              Boolean(row.singleSpaced)  // 🔴 Include single-spaced flag
            );

        sumWriter += writerAmount;
        sumClient += Number(row.amount || 0);
        count += 1;
      }

      // Update user's balance to match computed balance
      await db.update(users)
        .set({ balance: sumWriter, updatedAt: new Date().toISOString() })
        .where(eq(users.id, f.id));

      updated++;
      details.push({ freelancerId: f.id, newBalance: sumWriter, jobCount: count, totalClientAmount: sumClient });
    }

    return NextResponse.json({
      updated,
      details
    });
  } catch (error) {
    console.error('Recalculate balances cron error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  // Allow GET for manual trigger/monitoring in dev
  return POST();
}

