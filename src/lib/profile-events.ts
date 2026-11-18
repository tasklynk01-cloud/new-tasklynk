export const PROFILE_PICTURE_UPDATED_EVENT = 'tasklynk:profile-picture-updated';

export type ProfilePictureUpdatedDetail = {
  userId: number;
  profilePictureUrl: string | null;
};

export function dispatchProfilePictureUpdated(detail: ProfilePictureUpdatedDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ProfilePictureUpdatedDetail>(PROFILE_PICTURE_UPDATED_EVENT, { detail })
  );
}

