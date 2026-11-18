import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  trainingCertificates,
  trainingCourses,
  trainingCohorts,
  users,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ certNumber: string }> }
) {
  try {
    const params = await props.params;
    const certNumber = params.certNumber.trim().toUpperCase();

    const [cert] = await db
      .select({
        certificate: trainingCertificates,
        course: trainingCourses,
        cohort: trainingCohorts,
      })
      .from(trainingCertificates)
      .innerJoin(trainingCourses, eq(trainingCertificates.courseId, trainingCourses.id))
      .innerJoin(trainingCohorts, eq(trainingCertificates.cohortId, trainingCohorts.id))
      .where(eq(trainingCertificates.certificateNumber, certNumber))
      .limit(1);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found or invalid certificate number.' },
        { status: 404 }
      );
    }

    if (cert.certificate.isRevoked) {
      return NextResponse.json(
        {
          success: false,
          error: 'This certificate has been revoked by the issuing institution.',
          revocationReason: cert.certificate.revocationReason,
          certificate: cert.certificate,
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      certificate: cert.certificate,
      course: {
        title: cert.course.title,
        durationDays: cert.course.durationDays,
        slug: cert.course.slug,
      },
      cohort: {
        name: cert.cohort.name,
        startDate: cert.cohort.startDate,
        endDate: cert.cohort.endDate,
      },
    });
  } catch (error: any) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error verifying certificate' },
      { status: 500 }
    );
  }
}
