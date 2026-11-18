import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingCourses,
  trainingCohorts,
  trainingBookings,
  trainingEnrollments,
  trainingPayments,
  trainingSessions,
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminRole(request);
    if (!authResult.user) {
      return NextResponse.json({ success: false, error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 });
    }

    // Aggregate counts
    const totalCoursesRes = await db.select({ count: sql<number>`count(*)` }).from(trainingCourses);
    const publishedCoursesRes = await db.select({ count: sql<number>`count(*)` }).from(trainingCourses).where(eq(trainingCourses.isPublished, true));
    
    const openCohortsRes = await db.select({ count: sql<number>`count(*)` }).from(trainingCohorts).where(eq(trainingCohorts.status, 'registration_open'));
    
    const bookingsRes = await db.select({ count: sql<number>`count(*)` }).from(trainingBookings);
    const confirmedLearnersRes = await db.select({ count: sql<number>`count(*)` }).from(trainingBookings).where(eq(trainingBookings.bookingStatus, 'confirmed'));
    const pendingPaymentsRes = await db.select({ count: sql<number>`count(*)` }).from(trainingBookings).where(eq(trainingBookings.paymentStatus, 'initiated'));
    
    // Revenue collected
    const revenueRes = await db
      .select({ total: sql<string>`coalesce(sum(amount_paid), 0)` })
      .from(trainingBookings)
      .where(eq(trainingBookings.bookingStatus, 'confirmed'));

    // Upcoming sessions
    const upcomingSessions = await db
      .select({
        session: trainingSessions,
        course: trainingCourses,
        cohort: trainingCohorts,
      })
      .from(trainingSessions)
      .innerJoin(trainingCourses, eq(trainingSessions.courseId, trainingCourses.id))
      .innerJoin(trainingCohorts, eq(trainingSessions.cohortId, trainingCohorts.id))
      .orderBy(trainingSessions.sessionDate)
      .limit(5);

    // Recent bookings
    const recentBookings = await db
      .select({
        booking: trainingBookings,
        courseTitle: trainingCourses.title,
        cohortName: trainingCohorts.name,
      })
      .from(trainingBookings)
      .innerJoin(trainingCourses, eq(trainingBookings.courseId, trainingCourses.id))
      .innerJoin(trainingCohorts, eq(trainingBookings.cohortId, trainingCohorts.id))
      .orderBy(sql`training_bookings.created_at DESC`)
      .limit(10);

    return NextResponse.json({
      success: true,
      stats: {
        totalCourses: Number(totalCoursesRes[0]?.count || 0),
        publishedPrograms: Number(publishedCoursesRes[0]?.count || 0),
        activeCohorts: Number(openCohortsRes[0]?.count || 0),
        totalBookings: Number(bookingsRes[0]?.count || 0),
        confirmedLearners: Number(confirmedLearnersRes[0]?.count || 0),
        pendingPayments: Number(pendingPaymentsRes[0]?.count || 0),
        revenueCollected: Number(revenueRes[0]?.total || 0),
        currency: 'KES',
      },
      upcomingSessions,
      recentBookings,
    });
  } catch (error: any) {
    console.error('Error in admin training overview:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
