import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  freelancerSubjectMap, 
  freelancerSoftwareMap, 
  freelancerServicesMap,
  users 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/admin-auth';

/**
 * GET /api/freelancer/specializations
 * Fetch freelancer's selected subjects, software, and services
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['freelancer', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || authCheck.user.id.toString();

    // Fetch user's subjects
    const subjects = await db
      .select({
        id: freelancerSubjectMap.subjectId,
        mappingId: freelancerSubjectMap.id,
      })
      .from(freelancerSubjectMap)
      .where(eq(freelancerSubjectMap.freelancerId, parseInt(userId)));

    // Fetch user's software
    const software = await db
      .select({
        id: freelancerSoftwareMap.softwareId,
        mappingId: freelancerSoftwareMap.id,
        other: freelancerSoftwareMap.otherSoftware,
      })
      .from(freelancerSoftwareMap)
      .where(eq(freelancerSoftwareMap.freelancerId, parseInt(userId)));

    // Fetch user's services
    const services = await db
      .select({
        id: freelancerServicesMap.serviceId,
        mappingId: freelancerServicesMap.id,
        other: freelancerServicesMap.otherService,
      })
      .from(freelancerServicesMap)
      .where(eq(freelancerServicesMap.freelancerId, parseInt(userId)));

    return NextResponse.json({
      success: true,
      data: {
        subjectIds: subjects.map(s => s.id),
        softwareIds: software.map(s => s.id),
        serviceIds: services.map(s => s.id),
      },
    });
  } catch (error) {
    console.error('[Freelancer Specializations GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch specializations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/freelancer/specializations
 * Update freelancer's specializations
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole(request, ['freelancer', 'admin']);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { 
      userId, 
      subjectIds = [], 
      softwareIds = [], 
      serviceIds = [],
      skills = [] 
    } = body;

    const freelancerId = userId || authCheck.user.id;

    // Validate subject count (7-15 required)
    if (subjectIds.length < 7 || subjectIds.length > 15) {
      return NextResponse.json(
        { success: false, error: 'Please select between 7-15 subjects' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Delete existing mappings
    await db.delete(freelancerSubjectMap).where(eq(freelancerSubjectMap.freelancerId, freelancerId));
    await db.delete(freelancerSoftwareMap).where(eq(freelancerSoftwareMap.freelancerId, freelancerId));
    await db.delete(freelancerServicesMap).where(eq(freelancerServicesMap.freelancerId, freelancerId));

    // Insert new subject mappings
    if (subjectIds.length > 0) {
      const subjectValues = subjectIds.map((subjectId: number) => ({
        freelancerId,
        subjectId,
        createdAt: timestamp,
      }));
      await db.insert(freelancerSubjectMap).values(subjectValues);
    }

    // Insert new software mappings
    if (softwareIds.length > 0) {
      const softwareValues = softwareIds.map((softwareId: number) => ({
        freelancerId,
        softwareId,
        createdAt: timestamp,
      }));
      await db.insert(freelancerSoftwareMap).values(softwareValues);
    }

    // Insert new service mappings
    if (serviceIds.length > 0) {
      const serviceValues = serviceIds.map((serviceId: number) => ({
        freelancerId,
        serviceId,
        createdAt: timestamp,
      }));
      await db.insert(freelancerServicesMap).values(serviceValues);
    }

    // Update user's skills_completed flag
    await db.update(users)
      .set({ skillsCompleted: true, updatedAt: timestamp })
      .where(eq(users.id, freelancerId));

    return NextResponse.json({
      success: true,
      message: 'Specializations updated successfully',
      data: {
        subjectsCount: subjectIds.length,
        softwareCount: softwareIds.length,
        servicesCount: serviceIds.length,
      },
    });
  } catch (error) {
    console.error('[Freelancer Specializations POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update specializations' },
      { status: 500 }
    );
  }
}

