import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trainingBookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { initiateTrainingMpesaPayment } from '@/lib/training-service';
import { getAuthenticatedUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingReference, phoneNumber } = body;

    if (!bookingReference || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Booking reference and M-Pesa phone number are required.' },
        { status: 400 }
      );
    }

    const [booking] = await db
      .select()
      .from(trainingBookings)
      .where(eq(trainingBookings.bookingReference, bookingReference))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    const authUser = await getAuthenticatedUser(request).catch(() => null);

    const result = await initiateTrainingMpesaPayment({
      bookingId: booking.id,
      phoneNumber: String(phoneNumber),
      userId: authUser?.id,
    });

    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error('Error initiating training payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment initiation failed' },
      { status: 400 }
    );
  }
}
