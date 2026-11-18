/**
 * GET /api/freelancer/skills/options
 * 
 * Returns available subjects, software, and services for freelancer onboarding
 * Public endpoint - no authentication required (needed during registration flow)
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerSubjects, freelancerSoftware, freelancerServices } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all active subjects
    const subjects = await db
      .select({ id: freelancerSubjects.id, name: freelancerSubjects.name })
      .from(freelancerSubjects)
      .where(eq(freelancerSubjects.status, 'active'));

    // Fetch all active software
    const software = await db
      .select({ id: freelancerSoftware.id, name: freelancerSoftware.name })
      .from(freelancerSoftware)
      .where(eq(freelancerSoftware.status, 'active'));

    // Fetch all active services
    const services = await db
      .select({ id: freelancerServices.id, name: freelancerServices.name })
      .from(freelancerServices)
      .where(eq(freelancerServices.status, 'active'));

    // Predefined skills list
    const skills = [
      'Research & Analysis',
      'Critical Thinking',
      'Academic Writing',
      'Technical Writing',
      'Creative Writing',
      'Proofreading',
      'Editing',
      'Citation Formatting (APA, MLA, Chicago)',
      'Data Analysis',
      'Statistical Analysis',
      'Literature Review',
      'Case Study Analysis',
      'Report Writing',
      'Presentation Design',
      'Content Creation',
      'SEO Writing',
      'Copywriting',
      'Grant Writing',
      'Proposal Writing',
      'Business Writing',
      'Medical Writing',
      'Legal Writing',
      'Scientific Writing',
      'Translation',
      'Transcription',
      'Time Management',
      'Project Management',
      'Communication Skills',
      'Problem Solving',
      'Attention to Detail',
    ];

    return NextResponse.json({
      success: true,
      data: {
        subjects,
        software,
        services,
        skills,
      },
    });
  } catch (error) {
    console.error('[Skills Options] Error fetching options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skill options' },
      { status: 500 }
    );
  }
}

