import { NextRequest, NextResponse } from 'next/server';
import { createTrainingBooking } from '@/lib/training-service';
import { getAuthenticatedUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseId,
      cohortId,
      fullName,
      email,
      phone,
      organization,
      jobTitle,
      registrationType,
      groupSize,
      discountCode,
    } = body;

    if (!courseId || !cohortId || !fullName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Please provide course, intake cohort, full name, email address, and phone number.' },
        { status: 400 }
      );
    }

    // Check optional authenticated user
    const authUser = await getAuthenticatedUser(request).catch(() => null);

    const booking = await createTrainingBooking({
      courseId: Number(courseId),
      cohortId: Number(cohortId),
      fullName: String(fullName),
      email: String(email),
      phone: String(phone),
      organization: organization ? String(organization) : undefined,
      jobTitle: jobTitle ? String(jobTitle) : undefined,
      registrationType,
      groupSize: groupSize ? Number(groupSize) : 1,
      discountCode: discountCode ? String(discountCode) : undefined,
      userId: authUser?.id,
    });

    return NextResponse.json({
      success: true,
      bookingReference: booking.bookingReference,
      bookingId: booking.id,
      agreedPrice: booking.agreedPrice,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      booking,
    });
  } catch (error: any) {
    console.error('Error creating training booking:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 400 }
    );
  }
}
