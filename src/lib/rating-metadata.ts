import { db } from '@/db';
import { ratings } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 📊 FIX #28: Incomplete Metadata Usage in Ratings
 * Parse and use rating metadata for detailed breakdowns
 */

export interface RatingMetadata {
  speed?: number;
  quality?: number;
  communication?: number;
  professionalism?: number;
  wouldRecommend?: boolean;
  experience?: string;
  improvements?: string;
}

export interface RatingBreakdown {
  overall: number;
  speed: number;
  quality: number;
  communication: number;
  professionalism: number;
  totalRatings: number;
  wouldRecommendPercentage: number;
}

/**
 * Calculate aggregate rating with dimensional breakdown
 */
export async function calculateAggregateRating(
  userId: number
): Promise<RatingBreakdown | null> {
  try {
    const userRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId));

    if (userRatings.length === 0) {
      return null;
    }

    let speedTotal = 0;
    let qualityTotal = 0;
    let communicationTotal = 0;
    let professionalismTotal = 0;
    let overallTotal = 0;
    let recommendCount = 0;
    let validRatingsCount = 0;

    for (const rating of userRatings) {
      const meta: RatingMetadata = (rating.metadata as RatingMetadata | null) || {};

      // Use metadata dimensions if available, otherwise fall back to overall score
      speedTotal += meta.speed || rating.rating;
      qualityTotal += meta.quality || rating.rating;
      communicationTotal += meta.communication || rating.rating;
      professionalismTotal += meta.professionalism || rating.rating;
      overallTotal += rating.rating;

      if (meta.wouldRecommend) {
        recommendCount++;
      }

      validRatingsCount++;
    }

    const ratingBreakdown: RatingBreakdown = {
      overall: parseFloat((overallTotal / validRatingsCount).toFixed(2)),
      speed: parseFloat((speedTotal / validRatingsCount).toFixed(2)),
      quality: parseFloat((qualityTotal / validRatingsCount).toFixed(2)),
      communication: parseFloat(
        (communicationTotal / validRatingsCount).toFixed(2)
      ),
      professionalism: parseFloat(
        (professionalismTotal / validRatingsCount).toFixed(2)
      ),
      totalRatings: validRatingsCount,
      wouldRecommendPercentage: parseFloat(
        ((recommendCount / validRatingsCount) * 100).toFixed(2)
      ),
    };

    return ratingBreakdown;
  } catch (error) {
    console.error('Error calculating aggregate rating:', error);
    return null;
  }
}

/**
 * Create a structured rating with metadata
 */
export function createRatingWithMetadata(
  baseScore: number,
  dimensions: Partial<RatingMetadata>
): { score: number; metadata: RatingMetadata } {
  const metadata: RatingMetadata = {
    speed: dimensions.speed || baseScore,
    quality: dimensions.quality || baseScore,
    communication: dimensions.communication || baseScore,
    professionalism: dimensions.professionalism || baseScore,
    wouldRecommend: dimensions.wouldRecommend ?? true,
    experience: dimensions.experience || '',
    improvements: dimensions.improvements || '',
  };

  return {
    score: baseScore,
    metadata,
  };
}

