"use client";

import { useAuth } from '@/lib/auth-context-v2';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ProfilePictureCard } from '@/components/profile-picture-card';
import { SpecialistProfileWizard } from '@/components/specialist-profile-wizard';
import { Sparkles, ArrowLeft, ShieldCheck, User } from 'lucide-react';

export default function FreelancerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'freelancer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF7A3D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EDE5F5] dark:border-[#271E3C]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/freelancer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#5B3594] dark:text-[#FFA06E] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Freelancer Workspace
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#22183D] dark:text-white tracking-tight flex items-center gap-2">
            <span>Specialist Profile Studio</span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#FF7A3D]/15 text-[#FF7A3D] border border-[#FF7A3D]/30">
              Live Directory
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mt-1">
            Manage your public presentation, verified credentials, skills matrix, and deliverable portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/freelancer/settings"
            className="text-xs font-bold text-[#5B3594] dark:text-[#DDD3E9] hover:underline px-3 py-2 border rounded-lg border-[#DDD3E9] dark:border-[#352952]"
          >
            Account &amp; Security Settings
          </Link>
        </div>
      </div>

      {/* Grid: Left Profile Picture Uploader + Main Profile Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar & Trust Overview */}
        <div className="lg:col-span-4 space-y-6">
          <ProfilePictureCard
            userId={user.id}
            initialProfilePicture={user.profilePicture}
            title="Specialist Profile Photo"
            description="Upload a high-resolution, professional portrait. This photo is featured on your public directory listing and client proposals."
          />

          <div className="bg-[#FAF8FD] dark:bg-[#161026] border border-[#DDD3E9] dark:border-[#2E2448] rounded-xl p-5 space-y-3 text-xs">
            <div className="font-extrabold text-[#22183D] dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Public Directory Standard</span>
            </div>
            <p className="text-[11px] text-[#6B627A] dark:text-[#DDD3E9]/80 leading-relaxed">
              TaskLynk verifies all specialist degrees, professional certifications, and completed projects. Keep your profile updated to receive higher project match priority from project managers.
            </p>
            <div className="pt-2 border-t border-[#DDD3E9]/50 dark:border-[#271E3C] text-[10px] text-[#5B3594] dark:text-[#FFA06E] font-bold">
              100% Escrow Protected • QA Oversight • Direct WhatsApp PM Support
            </div>
          </div>
        </div>

        {/* Right Column: Full Profile Studio Wizard */}
        <div className="lg:col-span-8">
          <SpecialistProfileWizard />
        </div>
      </div>
    </div>
  );
}
