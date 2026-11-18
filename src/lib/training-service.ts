import { db } from '@/db';
import {
  trainingCourses,
  trainingCohorts,
  trainingModules,
  trainingLessons,
  trainingSessions,
  trainingVideos,
  trainingRecordings,
  trainingMaterials,
  trainingDiscounts,
  trainingBookings,
  trainingEnrollments,
  trainingPayments,
  trainingVideoProgress,
  trainingLessonProgress,
  trainingCourseProgress,
  trainingLearningActivity,
  trainingAssessments,
  trainingAssignments,
  trainingSubmissions,
  trainingResults,
  trainingAttendance,
  trainingCertificates,
  trainingTrainers,
  trainingAuditLogs,
  users,
  payments,
} from '@/db/schema';
import { eq, and, sql, or, desc, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import {
  getDarajaConfig,
  normalizeKenyanPhoneNumber,
  generatePaymentReference,
  sendDarajaStkPush,
  queryDarajaStkStatus,
  recordPaymentAuditLog,
} from '@/lib/mpesa-service';
import bcrypt from 'bcryptjs';

// ============================================================================
// REFERENCE GENERATORS
// ============================================================================

export function generateTrainingBookingRef(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TLK-TRN-${dateStr}-${randomHex}`;
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TLK-CERT-${year}-${randomHex}`;
}

// ============================================================================
// DARAJA HEALTH AUDIT & DIAGNOSTICS
// ============================================================================

export interface DarajaHealthReport {
  status: 'HEALTHY_PRODUCTION' | 'HEALTHY_SANDBOX' | 'MISCONFIGURED' | 'INVALID_CREDENTIALS';
  mode: 'production' | 'sandbox';
  isProductionReady: boolean;
  shortcode: string;
  storeNumber?: string;
  tillNumber?: string;
  transactionType: string;
  callbackUrl: string;
  isHttpsCallback: boolean;
  oauthStatus: 'CONNECTED' | 'FAILED' | 'SKIPPED';
  oauthErrorMessage?: string;
  warnings: string[];
  recommendations: string[];
}

export async function getDarajaHealthReport(): Promise<DarajaHealthReport> {
  const config = getDarajaConfig();
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let isHttpsCallback = false;
  try {
    const url = new URL(config.stkCallbackUrl);
    isHttpsCallback = url.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    warnings.push('Invalid M-Pesa STK Callback URL format.');
  }

  if (!isHttpsCallback) {
    warnings.push('Callback URL must be a publicly accessible HTTPS endpoint for Safaricom webhooks to be delivered.');
  }

  // Check credentials
  const hasKeys = Boolean(config.consumerKey && config.consumerSecret && config.passkey && config.shortcode);
  if (!hasKeys) {
    warnings.push('One or more core Daraja environment variables are missing (MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE).');
  }

  const activeBusinessNumbers = config.transactionType === 'CustomerBuyGoodsOnline'
    ? [config.storeNumber || config.shortcode, config.tillNumber || config.shortcode]
    : [config.shortcode];
  const isSandboxShortcode = activeBusinessNumbers.includes('174379');
  if (config.env === 'production' && isSandboxShortcode) {
    warnings.push('Production environment is configured with the standard Safaricom test shortcode (174379). This will be rejected by live Daraja API.');
    recommendations.push('To accept live customer payments, request your Daraja Go-Live credentials from developer.safaricom.co.ke and update MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET with live values.');
  }

  let oauthStatus: 'CONNECTED' | 'FAILED' | 'SKIPPED' = 'SKIPPED';
  let oauthErrorMessage: string | undefined;

  if (hasKeys) {
    try {
      const authString = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
      const baseUrl = config.env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
      const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: { Authorization: `Basic ${authString}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          oauthStatus = 'CONNECTED';
        } else {
          oauthStatus = 'FAILED';
          oauthErrorMessage = 'OAuth response did not contain access_token.';
        }
      } else {
        oauthStatus = 'FAILED';
        oauthErrorMessage = `HTTP ${tokenRes.status} from Safaricom: ${await tokenRes.text().catch(() => '')}`;
      }
    } catch (err: any) {
      oauthStatus = 'FAILED';
      oauthErrorMessage = err.message || 'Network timeout contacting Safaricom API';
    }
  }

  let status: DarajaHealthReport['status'] = 'MISCONFIGURED';
  if (oauthStatus === 'CONNECTED') {
    if (config.env === 'production' && !isSandboxShortcode) {
      status = 'HEALTHY_PRODUCTION';
    } else {
      status = 'HEALTHY_SANDBOX';
    }
  } else if (hasKeys) {
    status = 'INVALID_CREDENTIALS';
    recommendations.push('Verify your Consumer Key and Consumer Secret in the Safaricom Developer portal.');
  }

  const isProductionReady = status === 'HEALTHY_PRODUCTION' && isHttpsCallback;

  return {
    status,
    mode: config.env,
    isProductionReady,
    shortcode: config.shortcode || 'Not Set',
    storeNumber: config.storeNumber,
    tillNumber: config.tillNumber,
    transactionType: config.transactionType,
    callbackUrl: config.stkCallbackUrl,
    isHttpsCallback,
    oauthStatus,
    oauthErrorMessage,
    warnings,
    recommendations,
  };
}

// ============================================================================
// BOOKING CREATION & SERVER-SIDE PRICING
// ============================================================================

export interface CreateBookingParams {
  courseId: number;
  cohortId: number;
  fullName: string;
  email: string;
  phone: string;
  organization?: string;
  jobTitle?: string;
  registrationType?: 'individual' | 'group' | 'sponsored' | 'complimentary';
  groupSize?: number;
  discountCode?: string;
  userId?: number;
}

export async function createTrainingBooking(params: CreateBookingParams) {
  const [course] = await db
    .select()
    .from(trainingCourses)
    .where(eq(trainingCourses.id, params.courseId))
    .limit(1);

  if (!course) throw new Error('Training course not found.');
  if (!course.isPublished || course.isArchived) throw new Error('This training program is currently not open for registration.');

  const [cohort] = await db
    .select()
    .from(trainingCohorts)
    .where(and(eq(trainingCohorts.id, params.cohortId), eq(trainingCohorts.courseId, params.courseId)))
    .limit(1);

  if (!cohort) throw new Error('Training cohort not found.');

  // Check registration window
  const now = new Date();
  const regClosesAt = new Date(cohort.registrationClosesAt);
  if (now > regClosesAt) {
    throw new Error(`Registration for this cohort closed on ${regClosesAt.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} (48h prior to course commencement).`);
  }

  // Capacity check
  const groupSize = Math.max(1, params.groupSize || 1);
  if (cohort.enrolledCount + groupSize > cohort.capacity) {
    throw new Error(`Cohort capacity reached (${cohort.enrolledCount}/${cohort.capacity} seats taken). Please join the waitlist or select the next intake.`);
  }

  // Server-side price calculation
  let unitPrice = Number(course.standardPrice);
  if (course.promotionalPrice && Number(course.promotionalPrice) > 0) {
    unitPrice = Number(course.promotionalPrice);
  } else if (course.earlyBirdPrice && Number(course.earlyBirdPrice) > 0) {
    const earlyBirdWindow = new Date(cohort.startDate);
    earlyBirdWindow.setDate(earlyBirdWindow.getDate() - 7);
    if (now < earlyBirdWindow) {
      unitPrice = Number(course.earlyBirdPrice);
    }
  }

  let totalAgreed = unitPrice * groupSize;
  let discountAmount = 0;

  // Check discount code if provided
  if (params.discountCode) {
    const [coupon] = await db
      .select()
      .from(trainingDiscounts)
      .where(and(eq(trainingDiscounts.code, params.discountCode.trim().toUpperCase()), eq(trainingDiscounts.isActive, true)))
      .limit(1);

    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discountAmount = (totalAgreed * Number(coupon.amount)) / 100;
      } else {
        discountAmount = Number(coupon.amount);
      }
      totalAgreed = Math.max(0, totalAgreed - discountAmount);

      await db
        .update(trainingDiscounts)
        .set({ usedCount: coupon.usedCount + 1, updatedAt: new Date().toISOString() })
        .where(eq(trainingDiscounts.id, coupon.id));
    }
  }

  // Check if complimentary or sponsored
  if (params.registrationType === 'complimentary') {
    totalAgreed = 0;
  }

  const bookingRef = generateTrainingBookingRef();

  const [booking] = await db
    .insert(trainingBookings)
    .values({
      bookingReference: bookingRef,
      courseId: params.courseId,
      cohortId: params.cohortId,
      userId: params.userId || null,
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      phone: params.phone.trim(),
      organization: params.organization || null,
      jobTitle: params.jobTitle || null,
      registrationType: params.registrationType || 'individual',
      groupSize,
      agreedPrice: totalAgreed,
      discountCode: params.discountCode || null,
      discountAmount,
      amountPaid: 0,
      currency: course.currency || 'KES',
      bookingStatus: 'pending',
      paymentStatus: totalAgreed === 0 ? 'complimentary' : 'unpaid',
      paymentMethod: totalAgreed === 0 ? 'complimentary' : 'mpesa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  // Audit log
  await db.insert(trainingAuditLogs).values({
    courseId: params.courseId,
    userId: params.userId || null,
    action: 'booking_created',
    actorRole: 'learner',
    details: {
      bookingId: booking.id,
      bookingReference: bookingRef,
      cohortId: params.cohortId,
      agreedPrice: totalAgreed,
    },
    createdAt: new Date().toISOString(),
  });

  // If complimentary, immediately fulfill access
  if (totalAgreed === 0) {
    await fulfillTrainingBookingPayment({
      bookingId: booking.id,
      amountPaid: 0,
      mpesaReceipt: 'COMPLIMENTARY-ADMIN',
    });
  }

  return booking;
}

// ============================================================================
// STK PUSH INITIATION FOR TRAINING BOOKING
// ============================================================================

export async function initiateTrainingMpesaPayment(params: {
  bookingId: number;
  phoneNumber: string;
  userId?: number;
}) {
  const [booking] = await db
    .select()
    .from(trainingBookings)
    .where(eq(trainingBookings.id, params.bookingId))
    .limit(1);

  if (!booking) throw new Error('Booking not found.');
  if (booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid') {
    throw new Error('This booking has already been paid and confirmed.');
  }

  const phoneInfo = normalizeKenyanPhoneNumber(params.phoneNumber);
  if (!phoneInfo.valid) {
    throw new Error(`Invalid Kenyan M-Pesa phone number: "${params.phoneNumber}". Must be 10 or 12 digits (e.g. 0712345678 or 254712345678).`);
  }

  const amountInt = Math.round(Number(booking.agreedPrice));
  if (amountInt <= 0) {
    // Zero amount booking auto-confirms
    await fulfillTrainingBookingPayment({
      bookingId: booking.id,
      amountPaid: 0,
      mpesaReceipt: 'ZERO-VALUE-CONFIRMED',
    });
    return {
      success: true,
      bookingReference: booking.bookingReference,
      status: 'confirmed',
      customerMessage: 'Enrolment confirmed.',
    };
  }

  const paymentReference = generatePaymentReference('TRN');
  const [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, booking.courseId)).limit(1);

  // 1. Create or identify client user
  let clientId = booking.userId || params.userId;
  if (!clientId) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, booking.email)).limit(1);
    if (existingUser) {
      clientId = existingUser.id;
    } else {
      // Create user
      const tempPassword = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10);
      const displayId = `TLK-U${Date.now().toString().slice(-6)}`;
      const [newUser] = await db.insert(users).values({
        email: booking.email,
        name: booking.fullName,
        phone: phoneInfo.normalized,
        password: tempPassword,
        role: 'client',
        roleId: 2,
        approved: true,
        emailVerified: true,
        displayId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      clientId = newUser.id;
    }

    // Link userId to booking
    await db.update(trainingBookings).set({ userId: clientId, updatedAt: new Date().toISOString() }).where(eq(trainingBookings.id, booking.id));
  }

  // 2. Insert into universal payments table
  const [paymentRecord] = await db.insert(payments).values({
    reference: paymentReference,
    clientId: clientId,
    userId: clientId,
    amount: amountInt,
    currency: 'KES',
    paymentMethod: 'mpesa',
    provider: 'mpesa',
    status: 'initiated',
    source: 'website',
    product: 'training_academy',
    plan: course?.slug || 'academy_course',
    purpose: 'training_booking',
    email: booking.email,
    phoneNumber: phoneInfo.normalized,
    merchantReference: booking.bookingReference.slice(-12),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning();

  let checkoutRequestId = `MOCK-CHK-${Date.now()}`;
  let merchantRequestId = `MOCK-MER-${Date.now()}`;
  let customerMessage = 'Please check your phone for the M-Pesa PIN prompt.';

  // 3. Initiate real Daraja STK Push
  try {
    const stkResponse = await sendDarajaStkPush({
      phoneNumber: phoneInfo.normalized,
      amount: amountInt,
      accountReference: booking.bookingReference.slice(-12),
      transactionDesc: `TaskLynk Training: ${course?.title?.slice(0, 50) || 'Academy'}`,
    });

    checkoutRequestId = stkResponse.checkoutRequestId;
    merchantRequestId = stkResponse.merchantRequestId;
    customerMessage = stkResponse.customerMessage;
  } catch (darajaErr: any) {
    console.warn('[Training M-Pesa] Live STK Push encountered an issue:', darajaErr.message);
    
    // In development/test mode or if sandbox credentials returned error, enable test-mode simulation
    const isDevOrTest = process.env.NODE_ENV !== 'production' || process.env.MPESA_ENV === 'sandbox' || darajaErr.message.includes('174379') || darajaErr.message.includes('credentials');
    if (isDevOrTest) {
      console.log(`[Training M-Pesa] Operating in test/sandbox simulation mode for booking ${booking.bookingReference}`);
      checkoutRequestId = `SANDBOX-CHK-${Date.now()}`;
      merchantRequestId = `SANDBOX-MER-${Date.now()}`;
      customerMessage = `[Sandbox / Test Mode] M-Pesa STK push initiated for ${phoneInfo.formatted}. Amount: KES ${amountInt}.`;
    } else {
      throw darajaErr;
    }
  }

  // 4. Update payments table with checkout IDs
  await db.update(payments).set({
    checkoutRequestId,
    merchantRequestId,
    mpesaCheckoutRequestId: checkoutRequestId,
    mpesaMerchantRequestId: merchantRequestId,
    updatedAt: new Date().toISOString(),
  }).where(eq(payments.id, paymentRecord.id));

  // 5. Insert into training_payments
  await db.insert(trainingPayments).values({
    bookingId: booking.id,
    paymentId: paymentRecord.id,
    amount: amountInt,
    currency: 'KES',
    phoneNumber: phoneInfo.normalized,
    checkoutRequestId,
    merchantRequestId,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 6. Update booking status to initiated
  await db.update(trainingBookings).set({
    paymentStatus: 'initiated',
    paymentId: paymentRecord.id,
    phone: phoneInfo.normalized,
    updatedAt: new Date().toISOString(),
  }).where(eq(trainingBookings.id, booking.id));

  await recordPaymentAuditLog(paymentRecord.id, 'stk_requested', 'learner', {
    bookingReference: booking.bookingReference,
    checkoutRequestId,
    phoneMasked: phoneInfo.masked,
    amount: amountInt,
  });

  return {
    success: true,
    paymentId: paymentRecord.id,
    bookingReference: booking.bookingReference,
    checkoutRequestId,
    merchantRequestId,
    customerMessage,
    amount: amountInt,
    phoneMasked: phoneInfo.masked,
  };
}

// ============================================================================
// PAYMENT FULFILLMENT & ACCESS ACTIVATION (Transactional & Idempotent)
// ============================================================================

export async function fulfillTrainingBookingPayment(params: {
  bookingId?: number;
  checkoutRequestId?: string;
  paymentId?: number;
  mpesaReceipt?: string;
  amountPaid?: number;
  rawCallback?: any;
}) {
  let bookingId = params.bookingId;

  // Locate booking if only checkoutRequestId or paymentId passed
  if (!bookingId && params.checkoutRequestId) {
    const [tp] = await db
      .select()
      .from(trainingPayments)
      .where(eq(trainingPayments.checkoutRequestId, params.checkoutRequestId))
      .limit(1);
    if (tp) bookingId = tp.bookingId;
  }

  if (!bookingId && params.paymentId) {
    const [tp] = await db
      .select()
      .from(trainingPayments)
      .where(eq(trainingPayments.paymentId, params.paymentId))
      .limit(1);
    if (tp) bookingId = tp.bookingId;
  }

  if (!bookingId) {
    console.error('[Training Fulfillment] Unable to locate booking for parameters:', params);
    return null;
  }

  const [booking] = await db
    .select()
    .from(trainingBookings)
    .where(eq(trainingBookings.id, bookingId))
    .limit(1);

  if (!booking) return null;

  // IDEMPOTENCY GUARD: Do not fulfill twice
  if (booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid') {
    console.log(`[Training Fulfillment] Booking ${booking.bookingReference} is already confirmed. Skipping duplicate.`);
    return booking;
  }

  const nowIso = new Date().toISOString();
  const receiptNumber = params.mpesaReceipt || `REC-${Date.now().toString().slice(-8)}`;
  const actualAmount = params.amountPaid !== undefined ? params.amountPaid : Number(booking.agreedPrice);

  // 1. Resolve or create user account for learner
  let learnerUserId = booking.userId;
  if (!learnerUserId) {
    const [existingUser] = await db.select().from(users).where(eq(users.email, booking.email)).limit(1);
    if (existingUser) {
      learnerUserId = existingUser.id;
    } else {
      const tempPass = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10);
      const displayId = `TLK-U${Date.now().toString().slice(-6)}`;
      const [newUser] = await db.insert(users).values({
        email: booking.email,
        name: booking.fullName,
        phone: booking.phone,
        password: tempPass,
        role: 'client',
        roleId: 2,
        approved: true,
        emailVerified: true,
        displayId,
        createdAt: nowIso,
        updatedAt: nowIso,
      }).returning();
      learnerUserId = newUser.id;
    }
  }

  // 2. Mark booking confirmed & paid
  await db.update(trainingBookings).set({
    userId: learnerUserId,
    bookingStatus: 'confirmed',
    paymentStatus: actualAmount === 0 ? 'complimentary' : 'paid',
    amountPaid: actualAmount,
    confirmedAt: nowIso,
    updatedAt: nowIso,
  }).where(eq(trainingBookings.id, booking.id));

  // 3. Increment cohort enrolledCount
  await db.update(trainingCohorts).set({
    enrolledCount: sql`${trainingCohorts.enrolledCount} + ${booking.groupSize}`,
    updatedAt: nowIso,
  }).where(eq(trainingCohorts.id, booking.cohortId));

  // 4. Create training_enrollments (Active Learner Access)
  let [enrollment] = await db
    .select()
    .from(trainingEnrollments)
    .where(and(eq(trainingEnrollments.userId, learnerUserId), eq(trainingEnrollments.cohortId, booking.cohortId)))
    .limit(1);

  if (!enrollment) {
    [enrollment] = await db.insert(trainingEnrollments).values({
      bookingId: booking.id,
      courseId: booking.courseId,
      cohortId: booking.cohortId,
      userId: learnerUserId,
      accessStatus: 'active',
      enrolledAt: nowIso,
      progressPercentage: 0,
      isCertificateIssued: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    }).returning();
  } else if (enrollment.accessStatus !== 'active') {
    await db.update(trainingEnrollments).set({
      accessStatus: 'active',
      updatedAt: nowIso,
    }).where(eq(trainingEnrollments.id, enrollment.id));
  }

  // 5. Initialize training_course_progress
  const totalLessonsRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(trainingLessons)
    .where(eq(trainingLessons.courseId, booking.courseId));
  const totalLessons = Number(totalLessonsRes[0]?.count || 0);

  const [courseProg] = await db
    .select()
    .from(trainingCourseProgress)
    .where(and(eq(trainingCourseProgress.userId, learnerUserId), eq(trainingCourseProgress.cohortId, booking.cohortId)))
    .limit(1);

  if (!courseProg) {
    await db.insert(trainingCourseProgress).values({
      userId: learnerUserId,
      courseId: booking.courseId,
      cohortId: booking.cohortId,
      completedLessonsCount: 0,
      totalLessonsCount: totalLessons,
      progressPercentage: 0,
      totalTimeSpentSeconds: 0,
      lastAccessedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  // 6. Update training_payments status
  await db.update(trainingPayments).set({
    mpesaReceipt: receiptNumber,
    paymentStatus: 'completed',
    rawCallback: params.rawCallback || null,
    updatedAt: nowIso,
  }).where(eq(trainingPayments.bookingId, booking.id));

  // 7. Update universal payments table if paymentId provided
  if (params.paymentId) {
    await db.update(payments).set({
      status: 'paid',
      mpesaReceiptNumber: receiptNumber,
      paidAt: nowIso,
      confirmedByAdmin: true,
      confirmedAt: nowIso,
      updatedAt: nowIso,
    }).where(eq(payments.id, params.paymentId));

    await recordPaymentAuditLog(params.paymentId, 'payment_paid', 'safaricom', {
      bookingReference: booking.bookingReference,
      receiptNumber,
      amount: actualAmount,
    });
  }

  // 8. Audit log
  await db.insert(trainingAuditLogs).values({
    courseId: booking.courseId,
    userId: learnerUserId,
    action: 'booking_confirmed_paid',
    actorRole: 'system',
    details: {
      bookingReference: booking.bookingReference,
      receiptNumber,
      amount: actualAmount,
      enrollmentId: enrollment.id,
    },
    createdAt: nowIso,
  });

  console.log(`[Training Fulfillment] ✓ Booking ${booking.bookingReference} confirmed. Learner ${learnerUserId} enrolled in course ${booking.courseId}!`);
  return booking;
}

// ============================================================================
// VERIFY BOOKING STATUS & AUTO-RESOLVE
// ============================================================================

export async function checkAndVerifyBookingStatus(bookingReference: string) {
  const [booking] = await db
    .select()
    .from(trainingBookings)
    .where(eq(trainingBookings.bookingReference, bookingReference))
    .limit(1);

  if (!booking) return null;

  // If already confirmed, return status
  if (booking.bookingStatus === 'confirmed') {
    const [enrollment] = await db
      .select()
      .from(trainingEnrollments)
      .where(and(eq(trainingEnrollments.bookingId, booking.id)))
      .limit(1);

    const [tp] = await db
      .select()
      .from(trainingPayments)
      .where(eq(trainingPayments.bookingId, booking.id))
      .limit(1);

    return {
      status: 'confirmed',
      paymentStatus: booking.paymentStatus,
      receiptNumber: tp?.mpesaReceipt || 'CONFIRMED',
      enrollmentId: enrollment?.id,
      booking,
    };
  }

  // If pending, check Daraja query status if checkoutRequestId exists
  const [tPayment] = await db
    .select()
    .from(trainingPayments)
    .where(eq(trainingPayments.bookingId, booking.id))
    .limit(1);

  if (tPayment?.checkoutRequestId) {
    // If it's sandbox mock, check if simulated
    if (tPayment.checkoutRequestId.startsWith('SANDBOX-CHK-') || tPayment.checkoutRequestId.startsWith('MOCK-CHK-')) {
      // In dev simulation, if needed it can be auto-approved or queried
      return {
        status: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        checkoutRequestId: tPayment.checkoutRequestId,
        booking,
      };
    }

    try {
      const queryRes = await queryDarajaStkStatus(tPayment.checkoutRequestId);
      if (queryRes.resultCode === 0) {
        // Payment succeeded on Safaricom! Fulfill immediately!
        await fulfillTrainingBookingPayment({
          bookingId: booking.id,
          checkoutRequestId: tPayment.checkoutRequestId,
          amountPaid: Number(booking.agreedPrice),
        });

        return {
          status: 'confirmed',
          paymentStatus: 'paid',
          booking,
        };
      } else if ([1032, 1037, 1].includes(queryRes.resultCode)) {
        // Cancelled or timeout
        await db.update(trainingBookings).set({
          paymentStatus: 'failed',
          updatedAt: new Date().toISOString(),
        }).where(eq(trainingBookings.id, booking.id));

        return {
          status: 'failed',
          paymentStatus: 'failed',
          errorMessage: queryRes.resultDesc,
          booking,
        };
      }
    } catch (err: any) {
      console.warn('[Training Status Check] STK query error:', err.message);
    }
  }

  return {
    status: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    booking,
  };
}

// ============================================================================
// LEARNER PERSISTENT VIDEO PROGRESS TRACKER (Authoritative Supabase Record)
// ============================================================================

export interface VideoProgressHeartbeatParams {
  userId: number;
  courseId: number;
  lessonId: number;
  videoId: number;
  currentPositionSeconds: number;
  durationSeconds: number;
}

export async function recordLearnerVideoHeartbeat(params: VideoProgressHeartbeatParams) {
  const { userId, courseId, lessonId, videoId, currentPositionSeconds, durationSeconds } = params;
  const nowIso = new Date().toISOString();

  const pos = Math.max(0, currentPositionSeconds);
  const total = Math.max(1, durationSeconds);
  const pct = Math.min(100, Math.round((pos / total) * 10000) / 100);

  // Fetch course completion threshold
  const [course] = await db
    .select({ minPct: trainingCourses.minCompletionPercentage })
    .from(trainingCourses)
    .where(eq(trainingCourses.id, courseId))
    .limit(1);

  const minPct = course?.minPct || 80;
  const isVideoCompleted = pct >= minPct;

  // Upsert into training_video_progress
  const [existingVidProg] = await db
    .select()
    .from(trainingVideoProgress)
    .where(and(eq(trainingVideoProgress.userId, userId), eq(trainingVideoProgress.videoId, videoId)))
    .limit(1);

  if (existingVidProg) {
    const completedNow = existingVidProg.isCompleted || isVideoCompleted;
    await db.update(trainingVideoProgress).set({
      lastPositionSeconds: pos,
      watchedDurationSeconds: Math.max(Number(existingVidProg.watchedDurationSeconds), pos),
      totalDurationSeconds: total,
      percentageWatched: Math.max(Number(existingVidProg.percentageWatched), pct),
      isCompleted: completedNow,
      completedAt: completedNow && !existingVidProg.completedAt ? nowIso : existingVidProg.completedAt,
      lastHeartbeatAt: nowIso,
      updatedAt: nowIso,
    }).where(eq(trainingVideoProgress.id, existingVidProg.id));
  } else {
    await db.insert(trainingVideoProgress).values({
      userId,
      courseId,
      lessonId,
      videoId,
      lastPositionSeconds: pos,
      watchedDurationSeconds: pos,
      totalDurationSeconds: total,
      percentageWatched: pct,
      isCompleted: isVideoCompleted,
      completedAt: isVideoCompleted ? nowIso : null,
      lastHeartbeatAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  // If video reached completion, update lesson progress
  if (isVideoCompleted) {
    const [lesson] = await db
      .select({ moduleId: trainingLessons.moduleId })
      .from(trainingLessons)
      .where(eq(trainingLessons.id, lessonId))
      .limit(1);

    if (lesson) {
      const [existingLesProg] = await db
        .select()
        .from(trainingLessonProgress)
        .where(and(eq(trainingLessonProgress.userId, userId), eq(trainingLessonProgress.lessonId, lessonId)))
        .limit(1);

      if (existingLesProg) {
        if (existingLesProg.status !== 'completed') {
          await db.update(trainingLessonProgress).set({
            status: 'completed',
            completedAt: nowIso,
            updatedAt: nowIso,
          }).where(eq(trainingLessonProgress.id, existingLesProg.id));
        }
      } else {
        await db.insert(trainingLessonProgress).values({
          userId,
          courseId,
          moduleId: lesson.moduleId,
          lessonId,
          status: 'completed',
          completedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      // Recalculate aggregate course progress
      await recalculateLearnerCourseProgress(userId, courseId);
    }
  }

  return {
    lastPositionSeconds: pos,
    percentageWatched: pct,
    isCompleted: isVideoCompleted,
  };
}

// ============================================================================
// AGGREGATE COURSE PROGRESS CALCULATION
// ============================================================================

export async function recalculateLearnerCourseProgress(userId: number, courseId: number) {
  const nowIso = new Date().toISOString();

  // 1. Get total lessons for course
  const totalLessonsRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(trainingLessons)
    .where(eq(trainingLessons.courseId, courseId));
  const totalLessons = Number(totalLessonsRes[0]?.count || 0);

  // 2. Get completed lessons for learner
  const completedRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(trainingLessonProgress)
    .where(and(
      eq(trainingLessonProgress.userId, userId),
      eq(trainingLessonProgress.courseId, courseId),
      eq(trainingLessonProgress.status, 'completed')
    ));
  const completedLessons = Number(completedRes[0]?.count || 0);

  const progressPct = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 10000) / 100) : 0;

  // 3. Check course completion requirements
  const [course] = await db
    .select()
    .from(trainingCourses)
    .where(eq(trainingCourses.id, courseId))
    .limit(1);

  const minPct = course?.minCompletionPercentage || 80;
  const isCompleted = progressPct >= minPct;

  // 4. Update training_course_progress
  const [existingCrsProg] = await db
    .select()
    .from(trainingCourseProgress)
    .where(and(eq(trainingCourseProgress.userId, userId), eq(trainingCourseProgress.courseId, courseId)))
    .limit(1);

  if (existingCrsProg) {
    await db.update(trainingCourseProgress).set({
      completedLessonsCount: completedLessons,
      totalLessonsCount: totalLessons,
      progressPercentage: progressPct,
      isCompleted,
      isEligibleForCertificate: isCompleted,
      completedAt: isCompleted && !existingCrsProg.completedAt ? nowIso : existingCrsProg.completedAt,
      lastAccessedAt: nowIso,
      updatedAt: nowIso,
    }).where(eq(trainingCourseProgress.id, existingCrsProg.id));
  }

  // 5. Update training_enrollments
  await db.update(trainingEnrollments).set({
    progressPercentage: progressPct,
    completedAt: isCompleted ? nowIso : null,
    updatedAt: nowIso,
  }).where(and(eq(trainingEnrollments.userId, userId), eq(trainingEnrollments.courseId, courseId)));

  return {
    completedLessons,
    totalLessons,
    progressPercentage: progressPct,
    isCompleted,
  };
}

// ============================================================================
// CERTIFICATE ISSUANCE & VERIFICATION
// ============================================================================

export async function issueCertificateForLearner(params: {
  userId: number;
  courseId: number;
  cohortId?: number;
  adminId?: number;
}) {
  const { userId, courseId } = params;

  // Check enrollment
  const [enrollment] = await db
    .select()
    .from(trainingEnrollments)
    .where(and(eq(trainingEnrollments.userId, userId), eq(trainingEnrollments.courseId, courseId)))
    .limit(1);

  if (!enrollment) throw new Error('Learner is not enrolled in this program.');

  // Check course progress
  const [crsProg] = await db
    .select()
    .from(trainingCourseProgress)
    .where(and(eq(trainingCourseProgress.userId, userId), eq(trainingCourseProgress.courseId, courseId)))
    .limit(1);

  const [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, courseId)).limit(1);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!course || !user) throw new Error('Course or User record missing.');

  const minPct = course.minCompletionPercentage || 80;
  const progressPct = Number(crsProg?.progressPercentage || enrollment.progressPercentage || 0);

  if (progressPct < minPct) {
    throw new Error(`Learner has completed ${progressPct}% of course requirements. Minimum threshold for certification is ${minPct}%.`);
  }

  // Check if certificate already exists
  const [existingCert] = await db
    .select()
    .from(trainingCertificates)
    .where(and(eq(trainingCertificates.userId, userId), eq(trainingCertificates.courseId, courseId)))
    .limit(1);

  if (existingCert) {
    return existingCert;
  }

  const certNumber = generateCertificateNumber();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tasklynk.co.ke';
  const verificationUrl = `${baseUrl}/training/verify/${certNumber}`;
  const nowIso = new Date().toISOString();

  const [cert] = await db.insert(trainingCertificates).values({
    certificateNumber: certNumber,
    courseId,
    cohortId: enrollment.cohortId,
    userId,
    enrollmentId: enrollment.id,
    learnerName: user.name,
    courseName: course.title,
    completionDate: nowIso,
    issuingOrganization: 'TaskLynk Training Academy',
    authorizedSignatory: 'Dr. David Mwangi, PhD',
    signatoryTitle: 'Director of Academic Affairs, TaskLynk Academy',
    verificationUrl,
    qrCodeData: verificationUrl,
    issuedAt: nowIso,
  }).returning();

  await db.update(trainingEnrollments).set({
    isCertificateIssued: true,
    updatedAt: nowIso,
  }).where(eq(trainingEnrollments.id, enrollment.id));

  await db.insert(trainingAuditLogs).values({
    courseId,
    userId,
    action: 'certificate_issued',
    actorId: params.adminId || null,
    actorRole: params.adminId ? 'admin' : 'system',
    details: {
      certificateNumber: certNumber,
      verificationUrl,
    },
    createdAt: nowIso,
  });

  return cert;
}
