"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-v2';
import { safeApiFetch } from '@/lib/client-api-helpers';
import { AlertCircle, ArrowRight, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileData {
  userId: number;
  headline?: string;
  bio?: string;
  profileStatus: 'draft' | 'pending_review' | 'approved' | 'published' | string;
  publicSlug?: string;
  education?: any[];
  experience?: any[];
  portfolio?: any[];
  skills?: string[];
}

export function FreelancerProfileActivationBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const isOnProfilePage = pathname === '/freelancer/profile';

  useEffect(() => {
    if (sessionStorage.getItem('tasklynk_profile_notice_dismissed') === 'true') {
      setDismissed(true);
    }

    if (user && user.role === 'freelancer') {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const res = await safeApiFetch('/api/freelancer/profile');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'freelancer' || loading || dismissed || isOnProfilePage) {
    return null;
  }

  // Disappear completely once profile is published
  if (profile?.profileStatus === 'published') {
    return null;
  }

  const hasEducation = Boolean(profile?.education && profile.education.length > 0);
  const hasExperience = Boolean(profile?.experience && profile.experience.length > 0);
  const hasSkills = Boolean(profile?.skills && profile.skills.length >= 3);
  const hasPortfolio = Boolean(profile?.portfolio && profile.portfolio.length > 0);
  const hasHeadline = Boolean(profile?.headline && profile.headline.trim().length > 5);
  const hasBio = Boolean(profile?.bio && profile.bio.trim().length > 30);

  const completedSteps = [
    hasEducation,
    hasExperience,
    hasSkills,
    hasPortfolio,
    hasHeadline,
    hasBio,
  ].filter(Boolean).length;
  const totalSteps = 6;
  const pct = Math.round((completedSteps / totalSteps) * 100);
  const isPendingReview = profile?.profileStatus === 'pending_review' || profile?.profileStatus === 'approved';

  return (
    <div
      className={`rounded-xl border px-4 py-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isPendingReview
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isPendingReview ? (
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-[#FF7A3D] shrink-0" />
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-foreground">
              {isPendingReview
                ? 'Specialist profile submitted — awaiting admin approval'
                : 'Update your specialist profile to appear in the public directory'}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              ({completedSteps}/{totalSteps} sections · {pct}%)
            </span>
          </div>

          <div className="w-full max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: isPendingReview ? '#d97706' : '#FF7A3D',
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button asChild size="sm" variant={isPendingReview ? 'outline' : 'default'} className="h-7 px-3 text-xs rounded-lg">
          <Link href="/freelancer/profile">
            <span>{isPendingReview ? 'View Profile' : 'Update Profile'}</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>

        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem('tasklynk_profile_notice_dismissed', 'true');
          }}
          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
