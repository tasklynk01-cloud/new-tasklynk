import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingBookings,
  trainingCourses,
  trainingCohorts,
  trainingPayments,
  trainingEnrollments,
} from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { fulfillTrainingBookingPayment } from '@/lib/training-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const cohortId = searchParams.get('cohortId');
    const bookingStatus = searchParams.get('bookingStatus');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');

    const bookings = await db
      .select({
        booking: trainingBookings,
        courseTitle: trainingCourses.title,
        courseSlug: trainingCourses.slug,
        cohortName: trainingCohorts.name,
        payment: trainingPayments,
      })
      .from(trainingBookings)
      .innerJoin(trainingCourses, eq(trainingBookings.courseId, trainingCourses.id))
      .innerJoin(trainingCohorts, eq(trainingBookings.cohortId, trainingCohorts.id))
      .leftJoin(trainingPayments, eq(trainingBookings.id, trainingPayments.bookingId))
      .orderBy(desc(trainingBookings.createdAt));

    let filtered = bookings;
    if (courseId) filtered = filtered.filter((b) => b.booking.courseId === Number(courseId));
    if (cohortId) filtered = filtered.filter((b) => b.booking.cohortId === Number(cohortId));
    if (bookingStatus) filtered = filtered.filter((b) => b.booking.bookingStatus === bookingStatus);
    if (paymentStatus) filtered = filtered.filter((b) => b.booking.paymentStatus === paymentStatus);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.booking.fullName.toLowerCase().includes(q) ||
          b.booking.email.toLowerCase().includes(q) ||
          b.booking.phone.toLowerCase().includes(q) ||
          b.booking.bookingReference.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, bookings: filtered });
  } catch (error: any) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { action, bookingId, notes } = body;

    if (!bookingId || !action) {
      return NextResponse.json({ success: false, error: 'Booking ID and action required' }, { status: 400 });
    }

    const [booking] = await db
      .select()
      .from(trainingBookings)
      .where(eq(trainingBookings.id, Number(bookingId)))
      .limit(1);

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    if (action === 'approve_complimentary' || action === 'approve_sponsored') {
      const regType = action === 'approve_complimentary' ? 'complimentary' : 'sponsored';
      await db.update(trainingBookings).set({
        registrationType: regType,
        paymentMethod: regType,
        adminNotes: notes || `Approved as ${regType} by admin ${auth.user.name}`,
        updatedAt: new Date().toISOString(),
      }).where(eq(trainingBookings.id, booking.id));

      await fulfillTrainingBookingPayment({
        bookingId: booking.id,
        amountPaid: 0,
        mpesaReceipt: `${regType.toUpperCase()}-ADMIN-${Date.now().toString().slice(-6)}`,
      });

      return NextResponse.json({ success: true, message: `Booking approved as ${regType}.` });
    }

    if (action === 'cancel') {
      await db.update(trainingBookings).set({
        bookingStatus: 'cancelled',
        adminNotes: notes || 'Cancelled by admin',
        updatedAt: new Date().toISOString(),
      }).where(eq(trainingBookings.id, booking.id));

      return NextResponse.json({ success: true, message: 'Booking cancelled.' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing admin booking action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
