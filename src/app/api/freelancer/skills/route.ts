/**
 * Freelancer Skills API
 * 
 * GET /api/freelancer/skills - Get freelancer's selected skills
 * POST /api/freelancer/skills - Save freelancer's skills
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  users, 
  freelancerSubjectMap, 
  freelancerSoftwareMap, 
  freelancerServicesMap,
  freelancerSubjects,
  freelancerSoftware,
  freelancerServices
} from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireRole, getUserFromRequest } from '@/lib/admin-auth';

/**
 * GET /api/freelancer/skills
 * Returns the freelancer's current skills and competencies
 * 
 * NOTE: This endpoint allows unapproved freelancers to access their skills
 * because they need to complete onboarding before approval
 */
export async function GET(request: NextRequest) {
  try {
    // Check auth - allow freelancer, writer, editor, admin, manager
    // Use getUserFromRequest to allow unapproved freelancers during onboarding
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    
    // Verify role - freelancers during onboarding, plus admin/manager for viewing
    const allowedRoles = ['freelancer', 'writer', 'editor', 'admin', 'manager'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }
    
    // Get freelancer ID from query param (for admin/manager viewing) or use authenticated user
    const searchParams = request.nextUrl.searchParams;
    const freelancerId = searchParams.get('freelancerId');
    
    let targetId = user.id;
    if (freelancerId && (user.role === 'admin' || user.role === 'manager')) {
      targetId = parseInt(freelancerId);
    }

    // Fetch freelancer's selected subjects
    const subjectMappings = await db
      .select({
        id: freelancerSubjectMap.id,
        subjectId: freelancerSubjectMap.subjectId,
        name: freelancerSubjects.name,
      })
      .from(freelancerSubjectMap)
      .leftJoin(freelancerSubjects, eq(freelancerSubjectMap.subjectId, freelancerSubjects.id))
      .where(eq(freelancerSubjectMap.freelancerId, targetId));

    // Fetch freelancer's selected software
    const softwareMappings = await db
      .select({
        id: freelancerSoftwareMap.id,
        softwareId: freelancerSoftwareMap.softwareId,
        name: freelancerSoftware.name,
        otherSoftware: freelancerSoftwareMap.otherSoftware,
      })
      .from(freelancerSoftwareMap)
      .leftJoin(freelancerSoftware, eq(freelancerSoftwareMap.softwareId, freelancerSoftware.id))
      .where(eq(freelancerSoftwareMap.freelancerId, targetId));

    // Fetch freelancer's selected services
    const serviceMappings = await db
      .select({
        id: freelancerServicesMap.id,
        serviceId: freelancerServicesMap.serviceId,
        name: freelancerServices.name,
        otherService: freelancerServicesMap.otherService,
      })
      .from(freelancerServicesMap)
      .leftJoin(freelancerServices, eq(freelancerServicesMap.serviceId, freelancerServices.id))
      .where(eq(freelancerServicesMap.freelancerId, targetId));

    // Get skills_completed status
    const [freelancerUser] = await db
      .select({ skillsCompleted: users.skillsCompleted })
      .from(users)
      .where(eq(users.id, targetId));

    return NextResponse.json({
      success: true,
      data: {
        skillsCompleted: freelancerUser?.skillsCompleted || false,
        subjects: subjectMappings.map(s => ({ id: s.subjectId, name: s.name })),
        software: softwareMappings.map(s => ({ 
          id: s.softwareId, 
          name: s.name,
          otherSoftware: s.otherSoftware 
        })),
        services: serviceMappings.map(s => ({ 
          id: s.serviceId, 
          name: s.name,
          otherService: s.otherService 
        })),
      },
    });
  } catch (error) {
    console.error('[Skills GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/freelancer/skills
 * Save freelancer's skills and competencies
 * 
 * NOTE: This endpoint allows unapproved freelancers to save their skills
 * because they need to complete onboarding before approval
 */
export async function POST(request: NextRequest) {
  try {
    // Check auth - use getUserFromRequest to allow unapproved freelancers during onboarding
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    
    // Verify role - only freelancers can save their own skills (or admin)
    const allowedRoles = ['freelancer', 'writer', 'editor', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const body = await request.json();

    const { 
      subjectIds, 
      softwareIds, 
      serviceIds,
      otherSoftware,
      otherService,
      freelancerId: targetFreelancerId 
    } = body;

    // Determine target freelancer (admin can set for others)
    let freelancerId = user.id;
    if (targetFreelancerId && user.role === 'admin') {
      freelancerId = parseInt(targetFreelancerId);
    }

    // Validate subjects: must be between 7 and 15
    if (!Array.isArray(subjectIds) || subjectIds.length < 7) {
      return NextResponse.json(
        { success: false, error: 'You must select at least 7 subjects' },
        { status: 400 }
      );
    }
    if (subjectIds.length > 15) {
      return NextResponse.json(
        { success: false, error: 'You can select a maximum of 15 subjects' },
        { status: 400 }
      );
    }

    // Validate services: must have at least 1
    if (!Array.isArray(serviceIds) || serviceIds.length < 1) {
      return NextResponse.json(
        { success: false, error: 'You must select at least 1 service type' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Start transaction-like operations
    try {
      // Clear existing mappings for this freelancer
      await db.delete(freelancerSubjectMap).where(eq(freelancerSubjectMap.freelancerId, freelancerId));
      await db.delete(freelancerSoftwareMap).where(eq(freelancerSoftwareMap.freelancerId, freelancerId));
      await db.delete(freelancerServicesMap).where(eq(freelancerServicesMap.freelancerId, freelancerId));

      // Insert new subject mappings
      for (const subjectId of subjectIds) {
        await db.insert(freelancerSubjectMap).values({
          freelancerId,
          subjectId: parseInt(subjectId),
          createdAt: now,
        });
      }

      // Insert new software mappings
      if (Array.isArray(softwareIds)) {
        for (const softwareId of softwareIds) {
          await db.insert(freelancerSoftwareMap).values({
            freelancerId,
            softwareId: parseInt(softwareId),
            otherSoftware: null,
            createdAt: now,
          });
        }
      }

      // Add "Other" software if provided
      if (otherSoftware && typeof otherSoftware === 'string' && otherSoftware.trim()) {
        await db.insert(freelancerSoftwareMap).values({
          freelancerId,
          softwareId: 0, // Placeholder ID for "Other"
          otherSoftware: otherSoftware.trim(),
          createdAt: now,
        });
      }

      // Insert new service mappings
      for (const serviceId of serviceIds) {
        await db.insert(freelancerServicesMap).values({
          freelancerId,
          serviceId: parseInt(serviceId),
          otherService: null,
          createdAt: now,
        });
      }

      // Add "Other" service if provided
      if (otherService && typeof otherService === 'string' && otherService.trim()) {
        await db.insert(freelancerServicesMap).values({
          freelancerId,
          serviceId: 0, // Placeholder ID for "Other"
          otherService: otherService.trim(),
          createdAt: now,
        });
      }

      // Update user's skills_completed flag
      await db
        .update(users)
        .set({ 
          skillsCompleted: true,
          updatedAt: now
        })
        .where(eq(users.id, freelancerId));


      return NextResponse.json({
        success: true,
        message: 'Skills saved successfully',
        data: {
          subjectsCount: subjectIds.length,
          softwareCount: (softwareIds?.length || 0) + (otherSoftware ? 1 : 0),
          servicesCount: serviceIds.length + (otherService ? 1 : 0),
        },
      });
    } catch (dbError) {
      console.error('[Skills POST] Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('[Skills POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save skills' },
      { status: 500 }
    );
  }
}

