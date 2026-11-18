import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { ratings, userBadges, users } from '@/db/schema';

export const PROFILE_ACCESS_ROLES = ['admin', 'client', 'freelancer', 'manager', 'editor', 'account_owner', 'writer'];

export type RequestProfileUser = {
  id: number;
  role: string;
};

export type UserProfileRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  displayId: string | null;
  phone: string;
  approved: boolean;
  status: string;
  avatar: string | null;
  profilePictureUrl: string | null;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  completedJobs: number;
  rating: number;
  ratingAverage: number;
  ratingCount: number;
  badges: Array<{
    id: number;
    badgeName: string;
    badgeIcon: string;
    description?: string | null;
    color?: string | null;
  }>;
};

export type UpdateUserProfileResult =
  | { user: Record<string, unknown> }
  | { error: { message: string; code: string; status: number } };

export function canViewUserProfile(requestUser: RequestProfileUser, targetUserId: number) {
  return requestUser.id === targetUserId || requestUser.role === 'admin' || requestUser.role === 'manager';
}

export function canEditUserProfile(requestUser: RequestProfileUser, targetUserId: number) {
  return requestUser.id === targetUserId || requestUser.role === 'admin';
}

export async function buildUserProfile(userId: number): Promise<UserProfileRecord | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return null;
  }

  const profile: UserProfileRecord = {
    id: user.id,
    name: user.name || 'Unknown User',
    email: user.email,
    role: user.role,
    displayId: user.displayId || null,
    phone: user.phone || '',
    approved: Boolean(user.approved),
    status: user.status,
    avatar: user.profilePictureUrl || null,
    profilePictureUrl: user.profilePictureUrl || null,
    balance: user.balance || 0,
    totalEarned: user.totalEarned || 0,
    totalSpent: user.totalSpent || 0,
    completedJobs: user.completedJobs || 0,
    rating: user.rating || 0,
    ratingAverage: user.ratingAverage || user.rating || 0,
    ratingCount: user.ratingCount || 0,
    badges: [],
  };

  if ((user.role === 'freelancer' || user.role === 'writer' || user.role === 'client') && !profile.ratingCount) {
    const userRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId));

    if (userRatings.length > 0) {
      const avgRating = userRatings.reduce((sum, entry) => sum + (entry.rating || 0), 0) / userRatings.length;
      profile.rating = Math.round(avgRating * 10) / 10;
      profile.ratingAverage = profile.rating;
      profile.ratingCount = userRatings.length;
    }
  }

  const badges = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId));

  profile.badges = badges.map((badge) => ({
    id: badge.id,
    badgeName: badge.badgeName || 'Unknown',
    badgeIcon: badge.badgeIcon || '🏆',
    description: badge.description || null,
    color: null,
  }));

  return profile;
}

export async function updateUserProfile(userId: number, body: Record<string, unknown>): Promise<UpdateUserProfileResult> {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existingUser.length === 0) {
    return { error: { message: 'User not found', code: 'USER_NOT_FOUND', status: 404 } };
  }

  const { name, phone, profilePictureUrl, avatar } = body;
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (name !== undefined) {
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return { error: { message: 'Name cannot be empty', code: 'INVALID_NAME', status: 400 } };
    }
    updates.name = trimmedName;
  }

  if (phone !== undefined && phone !== null) {
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
    if (!trimmedPhone) {
      return { error: { message: 'Phone cannot be empty', code: 'INVALID_PHONE', status: 400 } };
    }

    const phoneExists = await db
      .select()
      .from(users)
      .where(and(eq(users.phone, trimmedPhone), ne(users.id, userId)))
      .limit(1);

    if (phoneExists.length > 0) {
      return { error: { message: 'Phone number already in use', code: 'PHONE_EXISTS', status: 400 } };
    }

    updates.phone = trimmedPhone;
  }

  const nextProfilePicture = profilePictureUrl ?? avatar;
  if (profilePictureUrl !== undefined || avatar !== undefined) {
    if (nextProfilePicture === null || nextProfilePicture === '') {
      updates.profilePictureUrl = null;
      updates.avatarUrl = null;
    } else if (typeof nextProfilePicture !== 'string') {
      return { error: { message: 'Profile picture must be a valid string', code: 'INVALID_PROFILE_PICTURE', status: 400 } };
    } else if (nextProfilePicture.startsWith('data:image/')) {
      // Automatically upload base64 payload to Cloudinary to keep DB & origin transfer tiny
      try {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const uploadResult = await cloudinary.uploader.upload(nextProfilePicture, {
          folder: 'tasklynk/avatars',
          public_id: `user_${userId}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { fetch_format: 'auto', quality: 'auto' }
          ]
        });

        updates.profilePictureUrl = uploadResult.secure_url;
        updates.avatarUrl = uploadResult.secure_url;
      } catch (uploadErr: any) {
        console.error('[Cloudinary Avatar Upload] Error:', uploadErr);
        return { error: { message: 'Failed to process and store profile picture', code: 'UPLOAD_FAILED', status: 500 } };
      }
    } else {
      updates.profilePictureUrl = nextProfilePicture;
      updates.avatarUrl = nextProfilePicture;
    }
  }

  const updatedUser = await db
    .update(users)
    .set(updates as any)
    .where(eq(users.id, userId))
    .returning();

  const { password, twoFactorSecret, twoFactorBackupCodes, ...userWithoutSensitiveData } = updatedUser[0] as any;
  return { user: userWithoutSensitiveData };
}

