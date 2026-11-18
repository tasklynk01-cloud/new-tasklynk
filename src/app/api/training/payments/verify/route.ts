import { NextRequest, NextResponse } from 'next/server';
import { checkAndVerifyBookingStatus, fulfillTrainingBookingPayment } from '@/lib/training-service';
import { db } from '@/db';
import { trainingBookings, trainingPayments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingReference, simulateSuccess } = body;

    if (!bookingReference) {
      return NextResponse.json({ success: false, error: 'Booking reference is required.' }, { status: 400 });
    }

    // In testing or simulation mode:
    if (simulateSuccess && (process.env.NODE_ENV !== 'production' || process.env.MPESA_ENV === 'sandbox')) {
      const [b] = await db.select().from(trainingBookings).where(eq(trainingBookings.bookingReference, bookingReference)).limit(1);
      if (b && b.bookingStatus !== 'confirmed') {
        const receipt = `SBX-${Date.now().toString().slice(-8)}`;
        await fulfillTrainingBookingPayment({
          bookingId: b.id,
          mpesaReceipt: receipt,
          amountPaid: Number(b.agreedPrice),
        });
      }
    }

    const verification = await checkAndVerifyBookingStatus(bookingReference);
    if (!verification) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ...verification,
    });
  } catch (error: any) {
    console.error('Error verifying training payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification check failed' },
      { status: 500 }
    );
  }
}
