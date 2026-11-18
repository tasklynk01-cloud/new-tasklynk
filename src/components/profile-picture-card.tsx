"use client";

import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { safeApiFetch, extractErrorMessage } from '@/lib/client-api-helpers';
import { useAuth } from '@/lib/auth-context-v2';
import { dispatchProfilePictureUpdated } from '@/lib/profile-events';

type ProfilePictureCardProps = {
  userId: number;
  initialProfilePicture?: string | null;
  title?: string;
  description?: string;
};

export function ProfilePictureCard({
  userId,
  initialProfilePicture = null,
  title = 'Profile Picture',
  description = 'Update your profile picture (Max 5MB, JPG/PNG)',
}: ProfilePictureCardProps) {
  const { refreshUser } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(initialProfilePicture);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfilePicture(initialProfilePicture);
  }, [initialProfilePicture]);

  useEffect(() => {
    let cancelled = false;

    const fetchProfilePicture = async () => {
      try {
        const response = await safeApiFetch(`/api/v2/users/${userId}/profile`, {
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const nextUrl = typeof data.profilePictureUrl === 'string' ? data.profilePictureUrl : null;

        if (!cancelled) {
          setProfilePicture(nextUrl && (nextUrl.startsWith('http') || nextUrl.startsWith('data:')) ? nextUrl : null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch profile picture:', error);
        }
      }
    };

    fetchProfilePicture();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const response = await safeApiFetch(`/api/v2/users/${userId}/profile`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profilePictureUrl: base64String }),
        });

        if (response.ok) {
          setProfilePicture(base64String);
          toast.success('Profile picture updated successfully');
          await refreshUser();
          dispatchProfilePictureUpdated({ userId, profilePictureUrl: base64String });
        } else {
          const error = await response.json();
          toast.error(extractErrorMessage(error, 'Failed to upload profile picture'));
        }
      } catch (error) {
        console.error('Failed to upload profile picture:', error);
        toast.error('Failed to upload profile picture');
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setUploading(false);
      toast.error('Failed to read profile picture');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <Card className="shadow-lg border-2 rounded-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="w-24 h-24 min-w-[96px] min-h-[96px] max-w-[96px] max-h-[96px] aspect-square rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-[#DDD3E9] dark:border-[#3A2F5B]">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full max-w-full max-h-full object-cover rounded-full block pointer-events-none"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover',
                    aspectRatio: '1 / 1',
                  }}
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-[#FF7A3D] text-white rounded-full p-2 border-2 border-white dark:border-[#140E24] shadow-md hover:bg-[#E9662F] transition-colors disabled:opacity-50"
              type="button"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline" type="button">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload New Picture'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: Square image, at least 200x200px
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      </CardContent>
    </Card>
  );
}
