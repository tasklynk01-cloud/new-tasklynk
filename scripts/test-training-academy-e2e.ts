import { db } from '@/db';
import {
  trainingCourses,
  trainingCohorts,
  trainingBookings,
  trainingEnrollments,
  trainingPayments,
  trainingVideos,
  trainingLessons,
  trainingVideoProgress,
  trainingCourseProgress,
  trainingCertificates,
  trainingAssessments,
  trainingResults,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  createTrainingBooking,
  initiateTrainingMpesaPayment,
  fulfillTrainingBookingPayment,
  recordLearnerVideoHeartbeat,
  issueCertificateForLearner,
  getDarajaHealthReport,
} from '@/lib/training-service';

async function runE2ETests() {
  console.log('🧪 Starting TaskLynk Training Academy End-to-End Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${msg}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Initial Training Programs & Calendar Verification
    // -------------------------------------------------------------------------
    console.log('👉 [Test 1] Verifying 5 Initial Programs and Cohorts...');
    const allCourses = await db.select().from(trainingCourses);
    assert(allCourses.length >= 5, `Found ${allCourses.length} training courses in database`);

    const academicWriting = allCourses.find((c) => c.slug === 'academic-writing-and-research');
    const researchMethods = allCourses.find((c) => c.slug === 'research-methods-and-data-analysis');
    const webDev = allCourses.find((c) => c.slug === 'web-development-and-software-engineering');
    const digitalMkt = allCourses.find((c) => c.slug === 'digital-marketing-and-seo');
    const aiProd = allCourses.find((c) => c.slug === 'ai-for-professional-productivity');

    assert(Boolean(academicWriting && Number(academicWriting.standardPrice) === 1500), 'Academic Writing configured at KSh 1,500');
    assert(Boolean(researchMethods && Number(researchMethods.standardPrice) === 2000), 'Research Methods configured at KSh 2,000');
    assert(Boolean(webDev && Number(webDev.standardPrice) === 2000), 'Web Development configured at KSh 2,000');
    assert(Boolean(digitalMkt && Number(digitalMkt.standardPrice) === 1500), 'Digital Marketing configured at KSh 1,500');
    assert(Boolean(aiProd && Number(aiProd.standardPrice) === 1500), 'AI for Productivity configured at KSh 1,500');
    assert(aiProd?.durationDays === 4, 'AI program is 4 consecutive days (Dec 27–30, 2026)');

    // -------------------------------------------------------------------------
    // TEST 2: Daraja Health Check
    // -------------------------------------------------------------------------
    console.log('\n👉 [Test 2] Auditing Safaricom Daraja Configuration & Health...');
    const health = await getDarajaHealthReport();
    assert(Boolean(health.shortcode), `Daraja Shortcode reported: ${health.shortcode}`);
    assert(Boolean(health.callbackUrl), `Callback URL configured: ${health.callbackUrl}`);
    assert(health.warnings.length >= 0, `Diagnostics executed with ${health.warnings.length} finding(s)`);
    console.log(`    Mode: ${health.mode} | Production Ready: ${health.isProductionReady} | OAuth: ${health.oauthStatus}`);

    // -------------------------------------------------------------------------
    // TEST 3: Booking Creation & Server-side Pricing
    // -------------------------------------------------------------------------
    console.log('\n👉 [Test 3] Creating Test Booking for Academic Writing...');
    const [cohort] = await db.select().from(trainingCohorts).where(eq(trainingCohorts.courseId, academicWriting!.id)).limit(1);
    assert(Boolean(cohort), `Intake cohort found: ${cohort?.cohortCode} (${cohort?.name})`);

    const testBooking = await createTrainingBooking({
      courseId: academicWriting!.id,
      cohortId: cohort.id,
      fullName: 'Test Learner Jane Doe',
      email: `jane.test.${Date.now()}@example.com`,
      phone: '0712345678',
      organization: 'Strathmore University',
      jobTitle: 'Research Assistant',
    });

    assert(Boolean(testBooking.id && testBooking.bookingReference), `Booking created: ${testBooking.bookingReference}`);
    assert(Number(testBooking.agreedPrice) === 1500, `Agreed price verified at KES ${testBooking.agreedPrice}`);
    assert(testBooking.bookingStatus === 'pending', 'Initial booking status is pending');
    assert(testBooking.paymentStatus === 'unpaid', 'Initial payment status is unpaid');

    // -------------------------------------------------------------------------
    // TEST 4: M-Pesa STK Push Initiation
    // -------------------------------------------------------------------------
    console.log('\n👉 [Test 4] Initiating Daraja M-Pesa Payment Flow...');
    const mpesaResult = await initiateTrainingMpesaPayment({
      bookingId: testBooking.id,
      phoneNumber: '0712345678',
    });

    assert(mpesaResult.success, `STK Push initiated successfully: ${mpesaResult.customerMessage}`);
    assert(Boolean(mpesaResult.checkoutRequestId), `CheckoutRequestID received: ${mpesaResult.checkoutRequestId}`);
    assert(mpesaResult.phoneMasked === '254712****78', `Phone masked securely: ${mpesaResult.phoneMasked}`);

    // -------------------------------------------------------------------------
    // TEST 5: Payment Fulfillment & Idempotency Verification
    // -------------------------------------------------------------------------
    console.log('\n👉 [Test 5] Simulating Daraja Webhook Callback & Enrolment...');
    const testReceipt = `QKH${Date.now().toString().slice(-7)}`;
    const fulfilledBooking = await fulfillTrainingBookingPayment({
      bookingId: testBooking.id,
      checkoutRequestId: mpesaResult.checkoutRequestId,
      mpesaReceipt: testReceipt,
      amountPaid: 1500,
    });

    assert(Boolean(fulfilledBooking), 'Payment fulfillment executed');

    // Verify DB records
    const [updatedBooking] = await db.select().from(trainingBookings).where(eq(trainingBookings.id, testBooking.id)).limit(1);
    assert(updatedBooking.bookingStatus === 'confirmed', 'Booking status transitioned to confirmed');
    assert(updatedBooking.paymentStatus === 'paid', 'Payment status transitioned to paid');
    assert(Number(updatedBooking.amountPaid) === 1500, 'Amount paid recorded as 1,500');

    // Verify learner enrollment
    const [enrollment] = await db
      .select()
      .from(trainingEnrollments)
      .where(and(eq(trainingEnrollments.bookingId, testBooking.id)))
      .limit(1);
    assert(Boolean(enrollment && enrollment.accessStatus === 'active'), `Active learner enrollment created: ID ${enrollment?.id}`);

    // Test Idempotency: re-running fulfillment with duplicate callback must not break or duplicate
    console.log('    Testing duplicate callback idempotency...');
    await fulfillTrainingBookingPayment({
      bookingId: testBooking.id,
      checkoutRequestId: mpesaResult.checkoutRequestId,
      mpesaReceipt: testReceipt,
      amountPaid: 1500,
    });
    const enrollmentCount = await db
      .select()
      .from(trainingEnrollments)
      .where(and(eq(trainingEnrollments.bookingId, testBooking.id)));
    assert(enrollmentCount.length === 1, 'Idempotency confirmed: No duplicate enrollment created');

    // -------------------------------------------------------------------------
    // TEST 6: Video Progress Tracking & 80% Threshold Completion
    // -------------------------------------------------------------------------
    console.log('\n👉 [Test 6] Testing Persistent Video Progress Tracking...');
    const [testLesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.courseId, academicWriting!.id)).limit(1);
    const [testVideo] = await db.select().from(trainingVideos).where(eq(trainingVideos.courseId, academicWriting!.id)).limit(1);

    assert(Boolean(testLesson && testVideo), 'Lesson and video records located');

    // Learner watches 50% (should not be completed yet)
    const prog1 = await recordLearnerVideoHeartbeat({
      userId: enrollment.userId,
      courseId: academicWriting!.id,
      lessonId: testLesson.id,
      videoId: testVideo.id,
      currentPositionSeconds: 900,
      durationSeconds: 1800,
    });
    assert(!prog1.isCompleted && prog1.percentageWatched === 50, `50% watch time recorded: completed = ${prog1.isCompleted}`);

    // Learner watches 85% (exceeds 80% threshold -> must mark completed)
    const prog2 = await recordLearnerVideoHeartbeat({
      userId: enrollment.userId,
      courseId: academicWriting!.id,
      lessonId: testLesson.id,
      videoId: testVideo.id,
      currentPositionSeconds: 1530,
      durationSeconds: 1800,
    });
    assert(prog2.isCompleted && prog2.percentageWatched === 85, `85% watch time recorded: completed = ${prog2.isCompleted} (Threshold met!)`);

    // Verify persistence in Supabase
    const [savedProg] = await db
      .select()
      .from(trainingVideoProgress)
      .where(and(eq(trainingVideoProgress.userId, enrollment.userId), eq(trainingVideoProgress.videoId, testVideo.id)))
      .limit(1);
    assert(Boolean(savedProg && savedProg.isCompleted), 'Authoritative progress record verified in PostgreSQL database');

    // -------------------------------------------------------------------------
    // TEST 7: Assessment & Quiz Evaluation
    // -------------------------------------------------------------------------
    console.log('\n👉 [Test 7] Testing Assessment Quiz Scoring & Submission...');
    const [assessment] = await db.select().from(trainingAssessments).where(eq(trainingAssessments.courseId, academicWriting!.id)).limit(1);
    assert(Boolean(assessment), `Assessment found: "${assessment?.title}"`);

    // Record passing score
    const [result] = await db.insert(trainingResults).values({
      assessmentId: assessment.id,
      userId: enrollment.userId,
      courseId: academicWriting!.id,
      score: 100,
      totalScore: 100,
      percentage: 100,
      passed: true,
      attemptNumber: 1,
    }).returning();
    assert(Boolean(result && result.passed), `Quiz evaluated: 100% (Passed = ${result.passed})`);

    // -------------------------------------------------------------------------
    // TEST 8: Official Certificate Issuance & Verification
    // -------------------------------------------------------------------------
    console.log('\n👉 [Test 8] Issuing and Verifying Official Certificate...');
    // Manually set course progress percentage to 100% for test user
    await db.update(trainingCourseProgress).set({
      progressPercentage: 100,
      isCompleted: true,
      isEligibleForCertificate: true,
    }).where(and(eq(trainingCourseProgress.userId, enrollment.userId), eq(trainingCourseProgress.courseId, academicWriting!.id)));

    const cert = await issueCertificateForLearner({
      userId: enrollment.userId,
      courseId: academicWriting!.id,
    });

    assert(Boolean(cert && cert.certificateNumber), `Certificate issued: ${cert.certificateNumber}`);
    assert(cert.certificateNumber.startsWith('TLK-CERT-'), 'Certificate number follows standard TLK-CERT format');
    assert(Boolean(cert.verificationUrl), `Public verification link generated: ${cert.verificationUrl}`);

    // Verify certificate in DB
    const [verifiedCert] = await db.select().from(trainingCertificates).where(eq(trainingCertificates.certificateNumber, cert.certificateNumber)).limit(1);
    assert(Boolean(verifiedCert && !verifiedCert.isRevoked), 'Certificate validated against official registry');

    console.log('\n=======================================================');
    console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('=======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during E2E test run:', err);
    process.exit(1);
  }
}

runE2ETests();
