"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, User, Check, Loader2, AlertCircle } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface GoogleProfile {
  email: string;
  name: string;
  avatarUrl?: string | null;
  googleId: string;
}

function GoogleRoleSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<GoogleProfile | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    try {
      const dataParam = searchParams.get('data');
      if (dataParam) {
        const decoded = JSON.parse(decodeURIComponent(dataParam));
        if (decoded.email && decoded.googleId) {
          setProfile(decoded);
          return;
        }
      }
      // If no data param, redirect to home with registration modal
      router.replace('/?register=true');
    } catch (err) {
      console.error('[Google Registration] Error parsing profile data:', err);
      setError('Could not load your Google profile details. Please try signing in again.');
    }
  }, [searchParams, router]);

  const handleRoleSelection = async (selectedRole: 'client' | 'freelancer') => {
    if (!profile) return;
    setLoadingRole(selectedRole);
    setError('');

    try {
      if (selectedRole === 'freelancer') {
        // For freelancer, save Google data in session and proceed to availability/subjects
        sessionStorage.setItem('google_pending_profile', JSON.stringify(profile));
        router.push(`/register/freelancer?email=${encodeURIComponent(profile.email)}&name=${encodeURIComponent(profile.name || '')}`);
        return;
      }

      // For client, register immediately
      const response = await fetch('/api/auth/google-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          role: 'client',
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      toast.success(data.message || 'Welcome to TaskLynk! Redirecting...');
      
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/client/dashboard';
      }, 500);

    } catch (err: any) {
      console.error('[Google Registration] Error registering user:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
      setLoadingRole(null);
    }
  };

  if (!profile && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {profile && (
        <div className="text-center mb-6 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-400">Signed in with Google as</p>
          <p className="text-sm font-bold text-white mt-0.5">{profile.name} ({profile.email})</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Client Card */}
        <div
          className="flex flex-col justify-between p-6 rounded-2xl border border-primary/40 bg-slate-900/90 hover:border-primary transition-all duration-300 cursor-pointer shadow-lg shadow-primary/10"
          onClick={() => !loadingRole && handleRoleSelection('client')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-primary/15 text-primary">
                Instant Access
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-white leading-tight">Client Account</h2>
              <p className="text-xs text-slate-400 mt-1">Students &amp; Organizations</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Order essays, SPSS data analysis, proposals, and get matched with verified specialists.
            </p>

            <ul className="space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400 font-bold" />
                <span>Auto-approved &amp; instant order placement</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400 font-bold" />
                <span>Dedicated 24/7 project management</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleRoleSelection('client');
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl shadow-md shadow-primary/25 text-xs sm:text-sm"
              size="lg"
              disabled={loadingRole !== null}
            >
              {loadingRole === 'client' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Continue as Client'
              )}
            </Button>
          </div>
        </div>

        {/* Freelancer Card */}
        <div
          className="flex flex-col justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all duration-300 cursor-pointer"
          onClick={() => !loadingRole && handleRoleSelection('freelancer')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-400">
                Earn Income
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-white leading-tight">Specialist / Professional</h2>
              <p className="text-xs text-slate-400 mt-1">Developers, Analysts, Designers &amp; Writers</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Earn by delivering verified web, software, data analytics, creative, business, and academic projects.
            </p>

            <ul className="space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400 font-bold" />
                <span>Managed professional &amp; technical orders</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400 font-bold" />
                <span>Bi-weekly M-Pesa payouts</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleRoleSelection('freelancer');
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 rounded-xl text-xs sm:text-sm"
              size="lg"
              disabled={loadingRole !== null}
            >
              {loadingRole === 'freelancer' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue as Specialist'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleRegisterPage() {
  return (
    <AuthShell
      title="Complete your setup"
      subtitle="Choose how you'd like to use TaskLynk"
      width="lg"
    >
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <GoogleRoleSelectionContent />
      </Suspense>
    </AuthShell>
  );
}
