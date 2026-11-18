import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingPayments,
  trainingBookings,
  trainingCourses,
  payments,
  paymentAuditLogs,
} from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { fulfillTrainingBookingPayment } from '@/lib/training-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const transactions = await db
      .select({
        payment: trainingPayments,
        booking: trainingBookings,
        courseTitle: trainingCourses.title,
        basePayment: payments,
      })
      .from(trainingPayments)
      .innerJoin(trainingBookings, eq(trainingPayments.bookingId, trainingBookings.id))
      .innerJoin(trainingCourses, eq(trainingBookings.courseId, trainingCourses.id))
      .leftJoin(payments, eq(trainingPayments.paymentId, payments.id))
      .orderBy(desc(trainingPayments.createdAt));

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    console.error('Error fetching admin training payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole(request);
    if (!auth.user) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { action, bookingId, mpesaReceipt, amountPaid } = body;

    if (action === 'reconcile_manual') {
      if (!bookingId || !mpesaReceipt) {
        return NextResponse.json({ success: false, error: 'Booking ID and M-Pesa receipt required.' }, { status: 400 });
      }

      const receipt = String(mpesaReceipt).trim().toUpperCase();
      await fulfillTrainingBookingPayment({
        bookingId: Number(bookingId),
        mpesaReceipt: receipt,
        amountPaid: amountPaid ? Number(amountPaid) : undefined,
      });

      return NextResponse.json({ success: true, message: `Payment manually reconciled with receipt ${receipt}.` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in payment action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
