import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingBookings,
  trainingCourses,
  trainingCohorts,
  trainingPayments,
  trainingEnrollments,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ reference: string }> }
) {
  try {
    const params = await props.params;
    const { reference } = params;

    const [booking] = await db
      .select({
        booking: trainingBookings,
        course: trainingCourses,
        cohort: trainingCohorts,
      })
      .from(trainingBookings)
      .innerJoin(trainingCourses, eq(trainingBookings.courseId, trainingCourses.id))
      .innerJoin(trainingCohorts, eq(trainingBookings.cohortId, trainingCohorts.id))
      .where(eq(trainingBookings.bookingReference, reference))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const [payment] = await db
      .select()
      .from(trainingPayments)
      .where(eq(trainingPayments.bookingId, booking.booking.id))
      .limit(1);

    const [enrollment] = await db
      .select()
      .from(trainingEnrollments)
      .where(eq(trainingEnrollments.bookingId, booking.booking.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      booking: booking.booking,
      course: booking.course,
      cohort: booking.cohort,
      payment,
      enrollment,
    });
  } catch (error: any) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}
