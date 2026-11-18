import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerCPPProgress, freelancerCPPLevels, users, writerTiers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Fetch freelancer CPP level and tier info
// Query params: freelancerId (required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const freelancerId = searchParams.get('freelancerId');

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 }
      );
    }

    const id = parseInt(freelancerId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid freelancerId' },
        { status: 400 }
      );
    }

    // Get user info including badge
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        rating: users.rating,
        completedJobs: users.completedJobs,
        freelancerBadge: users.freelancerBadge,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Get CPP progress
    const progressResult = await db
      .select({
        currentLevel: freelancerCPPProgress.currentLevel,
        totalCompletedOrders: freelancerCPPProgress.totalCompletedOrders,
        ordersInCurrentLevel: freelancerCPPProgress.ordersInCurrentLevel,
        progressPercentage: freelancerCPPProgress.progressPercentage,
        nextLevelOrdersRequired: freelancerCPPProgress.nextLevelOrdersRequired,
        isWorkTypeSpecialized: freelancerCPPProgress.isWorkTypeSpecialized,
        lastProgressUpdate: freelancerCPPProgress.lastProgressUpdate,
      })
      .from(freelancerCPPProgress)
      .where(eq(freelancerCPPProgress.freelancerId, id))
      .limit(1);

    // Get CPP level definitions
    const allLevels = await db
      .select()
      .from(freelancerCPPLevels)
      .orderBy(freelancerCPPLevels.level);

    // Get current level info if progress exists
    let currentLevelInfo = null;
    let nextLevelInfo = null;
    
    if (progressResult.length > 0) {
      const progress = progressResult[0];
      
      currentLevelInfo = allLevels.find(l => l.level === progress.currentLevel);
      nextLevelInfo = allLevels.find(l => l.level === progress.currentLevel + 1);
    }

    // Get writer tier info
    const allTiers = await db
      .select()
      .from(writerTiers)
      .orderBy(writerTiers.minJobs);

    // Calculate current tier based on user stats
    let currentTier = null;
    let nextTier = null;
    
    const rating = user.rating || 0;
    const completedJobs = user.completedJobs || 0;

    for (let i = allTiers.length - 1; i >= 0; i--) {
      const tier = allTiers[i];
      if (
        rating >= tier.minRating &&
        completedJobs >= tier.minJobs
      ) {
        currentTier = tier;
        nextTier = allTiers[i + 1] || null;
        break;
      }
    }

    // If no tier matched, use first tier as default
    if (!currentTier && allTiers.length > 0) {
      currentTier = allTiers[0];
      nextTier = allTiers[1] || null;
    }

    // Calculate CPP earnings (using standard formula)
    const cppRates = {
      1: { nonTechnical: 150, technical: 170 },
      2: { nonTechnical: 160, technical: 180 },
      3: { nonTechnical: 170, technical: 190 },
      4: { nonTechnical: 180, technical: 200 },
      5: { nonTechnical: 200, technical: 220 },
    };

    const currentCPPLevel = progressResult.length > 0 ? progressResult[0].currentLevel : 1;
    const rates = cppRates[currentCPPLevel as keyof typeof cppRates] || cppRates[1];

    return NextResponse.json({
      freelancer: {
        id: user.id,
        name: user.name,
        rating: user.rating,
        completedJobs: user.completedJobs,
        badge: user.freelancerBadge,
      },
      cppProgress: progressResult.length > 0 ? {
        ...progressResult[0],
        currentLevelName: currentLevelInfo?.levelName || 'Starter',
        currentLevelDescription: currentLevelInfo?.description || '',
        nextLevelName: nextLevelInfo?.levelName || null,
        ordersToNextLevel: nextLevelInfo ? (nextLevelInfo.completedOrdersRequired - (progressResult[0].totalCompletedOrders || 0)) : null,
      } : {
        currentLevel: 1,
        totalCompletedOrders: user.completedJobs || 0,
        ordersInCurrentLevel: 0,
        progressPercentage: 0,
        nextLevelOrdersRequired: 3,
        currentLevelName: 'Starter',
        currentLevelDescription: 'Entry level - earning KSh 150/page',
        nextLevelName: 'Rising',
        ordersToNextLevel: 3 - (user.completedJobs || 0),
      },
      cppRates: rates,
      writerTier: currentTier ? {
        id: currentTier.id,
        name: currentTier.name,
        minRating: currentTier.minRating,
        minJobs: currentTier.minJobs,
        minSuccessRate: currentTier.minSuccessRate,
        benefits: currentTier.benefits || [],
        color: currentTier.color,
        icon: currentTier.icon,
      } : null,
      nextTier: nextTier ? {
        name: nextTier.name,
        minRating: nextTier.minRating,
        minJobs: nextTier.minJobs,
        benefits: nextTier.benefits || [],
      } : null,
      allCPPLevels: allLevels,
      allTiers: allTiers.map(t => ({
        ...t,
        benefits: t.benefits || [],
      })),
    });
  } catch (error) {
    console.error('Error fetching freelancer CPP info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freelancer CPP info' },
      { status: 500 }
    );
  }
}

